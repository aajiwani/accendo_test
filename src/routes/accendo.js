// accendo.js

/** Express router providing accendo related routes
 * @module routers/accendo
 * @requires express
 */

/**
 * express module
 * @const
 */
const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const orgChartCSVSchema = require("./../utils/org-chart-schema");
const orgChartValidations = require("./../utils/org-chart-validation");
const orgChartJsonSort = require("./../utils/csv-json-org-sort");
const orgChartRowProcessor = require("./../utils/org-chart-row-processor");
const orgChartUpdateRowProcessor = require("./../utils/org-chart-update-row-processor");
const Sequelize = require("sequelize");
const findManager = require("./../utils/find-manager");
const OrgChartCSVConsts = require("./../utils/org-chart-csv-consts");

const ajv = require("ajv");
const {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} = require("unique-names-generator");

/**
 * Express router to mount accendo related functions on.
 * @type {object}
 * @const
 * @namespace accendoRouter
 */
const router = express.Router();

/**
 * Sequelize ORM to use for accendo use-cases
 * @type {object}
 * @const
 * @namespace accendoRouter
 */
const db = require("../database/index");

const csvToJson = require("csvtojson");
const createEmployeeRow = require("../utils/create-emlpoyee-row");

/**
 * Route serving current org chart.
 * @name get/org-chart
 * @function
 * @memberof module:routers/accendo~accendoRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get("/org-chart/:org_id", async function (req, res) {
  res.status(200).send(
    await db.sequelize.query(
      `SELECT e."employeeId", e."employeeName", e."jobLevel", ejt.title as JobTitle, e."isRoot" as TopLevel, m."employeeName" as reportingTo, ejt2.title as ManagerJobTitle, o."name" as organization from "Employees" e
FULL OUTER JOIN "Employees" m ON (e.reports_to = m."id")
INNER JOIN "Organizations" o ON (e.belongs_to = o.id)
FULL OUTER JOIN "EmployeeJobTitles" ejt ON (e."jobTitleId" = ejt.id)
FULL OUTER JOIN "EmployeeJobTitles" ejt2 ON (m."jobTitleId" = ejt2.id)
WHERE o.id= :org_id
ORDER BY e."jobLevel" ASC`,
      {
        replacements: { org_id: req.params.org_id },
        type: Sequelize.QueryTypes.SELECT,
      }
    )
  );
});

/**
 * Route to post a new org-chart to begin the journey with
 * @name post/org-chart
 * @function
 * @memberof module:routers/accendo~accendoRouter
 * @inner
 * @param {string} path - Express path
 * @param {multer} middleware - Multer middleware for file upload
 * @param {callback} middleware - Express middleware.
 */
router.post(
  "/org-chart",
  upload.single("org_chart"),
  async function (req, res) {
    await csvToJson()
      .fromString(req.file.buffer.toString())
      .then(async (json) => {
        // Validate the schema first
        const validate = new ajv({
          allErrors: true,
          async: false,
        }).compile(orgChartCSVSchema);
        const valid = validate(json);

        if (!valid) res.status(500).send(JSON.stringify(validate.errors));

        try {
          orgChartValidations(json);
        } catch (e) {
          res.status(500).send(e);
        }

        // Order the incoming record by the heirarchy, root at the top
        json.sort(orgChartJsonSort(json));

        let employees = [];
        let preparedOrg = null;

        // Run in a trasaction, so if we cause a problem, organization would fail to be created
        const t = await db.sequelize.transaction();

        // Let's process the org chart
        // Create a new orgniazation to situate the org chart in
        preparedOrg = await db.accendo.Organization.create({
          name: uniqueNamesGenerator(
            {
              dictionaries: [adjectives, colors, animals],
              separator: " ",
              length: 3,
            },
            {
              transaction: t,
            }
          ),
        });

        // For each row in CSV, this is how the process would look like
        for (let row of json) {
          try {
            const empl = await orgChartRowProcessor(
              row,
              t,
              preparedOrg.toJSON().id
            );
            employees.push(empl.employeeId);
          } catch (e) {
            res.status(500).send(e);
          }
        }

        // Once we are sure that our transaction has no outstanding matters to worry about, let's return the result
        await t.commit();

        // We are good with situating our organization in the database
        // Let's show a summary so that rest of the APIs could be called accordingly
        res.status(200).send({
          message: "Org chart successfully consumed",
          organization_created: {
            id: preparedOrg.id,
            name: preparedOrg.name,
          },
          employees: {
            count: employees.length,
            employees,
          },
        });
      });
  }
);

/**
 * Route to update org-chart for an organization
 * @name put/org-chart
 * @function
 * @memberof module:routers/accendo~accendoRouter
 * @inner
 * @param {string} path - Express path
 * @param {multer} middleware - Multer middleware for file upload
 * @param {callback} middleware - Express middleware.
 */
router.put(
  "/org-chart/:id",
  upload.single("org_chart"),
  async function (req, res) {
    let org = null;

    try {
      org = await db.accendo.Organization.findOne({
        where: {
          id: req.params.id,
        },
        rejectOnEmpty: true,
      });
    } catch (e) {
      res.status(500).send(JSON.stringify(e));
      return;
    }

    await csvToJson()
      .fromString(req.file.buffer.toString())
      .then(async (json) => {
        // Validate the schema first
        const validate = new ajv({
          allErrors: true,
          async: false,
        }).compile(orgChartCSVSchema);
        const valid = validate(json);

        if (!valid) res.status(500).send(JSON.stringify(validate.errors));

        try {
          orgChartValidations(json);
        } catch (e) {
          res.status(500).send(e);
        }

        // Order the incoming record by the heirarchy, root at the top
        json.sort(orgChartJsonSort(json));

        // Run in a trasaction, so if we cause a problem, organization would fail to be created
        const t = await db.sequelize.transaction();

        const identifiedForDeletion = await db.accendo.Employee.findAll({
          where: {
            emailAddress: {
              [Sequelize.Op.notIn]: json.map(
                (r) => r[OrgChartCSVConsts.EmailAddress]
              ),
            },
            belongsTo: parseInt(org.toJSON().id),
          },
          transaction: t,
        });

        // Derisk employees marked for deletion
        await db.accendo.Employee.update(
          { reportsTo: null },
          {
            where: {
              reportsTo: identifiedForDeletion.map((r) => r.toJSON().id),
              belongsTo: parseInt(org.toJSON().id),
            },
            transaction: t,
          }
        );

        // Create accounts that doesn't exist in the organization
        for (let row of json) {
          await db.accendo.Employee.count({
            where: {
              emailAddress: row[OrgChartCSVConsts.EmailAddress],
              belongsTo: parseInt(org.toJSON().id),
            },
          }).then(async (count) => {
            // Find or create JobTitle
            try {
              jobTitle = await db.accendo.EmployeeJobTitle.findOne({
                where: { title: row[OrgChartCSVConsts.JobTitle] },
                rejectOnEmpty: true,
                transaction: t,
              });
            } catch (e) {
              jobTitle = await db.accendo.EmployeeJobTitle.create(
                {
                  title: row[OrgChartCSVConsts.JobTitle],
                },
                {
                  transaction: t,
                }
              );
            }

            if (count == 0) {
              // We must create the new users
              try {
                await createEmployeeRow(
                  row,
                  org.toJSON().id,
                  jobTitle.toJSON().id,
                  null,
                  t
                );
              } catch (e) {
                res.status(500).send(e);
                await t.rollback();
              }
            } else {
              // Or we modify the existing
              await db.accendo.Employee.update(
                {
                  jobId: row[OrgChartCSVConsts.JobId],
                  rolePriority: parseInt(row[OrgChartCSVConsts.RolePriority]),
                  jobLevel: parseInt(row[OrgChartCSVConsts.JobLevel]),
                  isRoot:
                    row[OrgChartCSVConsts.IsRoot] === "yes" ? true : false,
                  jobTitleId: jobTitle.toJSON().id,
                },
                {
                  where: {
                    emailAddress: row[OrgChartCSVConsts.EmailAddress],
                    belongsTo: parseInt(org.toJSON().id),
                  },
                  transaction: t,
                }
              );
            }
          });
        }

        // Once we are sure everything exist in our database
        // Let's assign the rightful manager
        for (let row of json) {
          if (row[OrgChartCSVConsts.IsRoot] === "no") {
            try {
              const manager = await findManager(
                row[OrgChartCSVConsts.ReportsToPerson],
                row[OrgChartCSVConsts.ReportsToJobId],
                parseInt(org.toJSON().id),
                t
              );

              await db.accendo.Employee.update(
                {
                  reportsTo: manager.toJSON().id,
                },
                {
                  where: {
                    emailAddress: row[OrgChartCSVConsts.EmailAddress],
                    belongsTo: parseInt(org.toJSON().id),
                  },
                  transaction: t,
                }
              );
            } catch (e) {
              res.status(500).send(JSON.stringify(e));
              return;
            }
          }
        }

        // Finally delete the ones we don't have anymore in the organization
        await db.accendo.Employee.destroy({
          where: {
            id: identifiedForDeletion.map((r) => r.toJSON().id),
          },
          transaction: t,
        });

        await t.commit();

        res.status(200).send({
          message: "Successfully changed the organization",
        });
      });
  }
);

/**
 * Route to modify an employee present in the org-chart
 * @name put/employee
 * @function
 * @memberof module:routers/accendo~accendoRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.put("/employee", function (req, res) {});

/**
 * Route to add a new employee to the org-chart
 * @name post/employee
 * @function
 * @memberof module:routers/accendo~accendoRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post("/employee", function (req, res) {});

module.exports = router;
