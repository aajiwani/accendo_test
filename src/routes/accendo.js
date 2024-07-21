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

/**
 * Route serving current org chart.
 * @name get/org-chart
 * @function
 * @memberof module:routers/accendo~accendoRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get("/org-chart/:org_id", function (req, res) {
  db.accendo.Employee.findAll({
    where: { belongs_to: req.params.org_id },
    raw: false,
  })
    .then((emlpoyees) => {
      res.status(200).send(JSON.stringify(emlpoyees));
    })
    .catch((err) => {
      res.status(500).send(JSON.stringify(err));
    });
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

        let employees = [];

        // Run in a trasaction, so if we cause a problem, organization would fail to be created
        const t = await db.sequelize.transaction();

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

// router.get("/:id", function(req, res) {
//     db.Person.findByPk(req.params.id)
//         .then( person => {
//             res.status(200).send(JSON.stringify(person));
//         })
//         .catch( err => {
//             res.status(500).send(JSON.stringify(err));
//         });
// });

/**
 * Route to modify an employee present in the org-chart
 * @name put/employee
 * @function
 * @memberof module:routers/accendo~accendoRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.put("/employee", function (req, res) {
  // db.Person.create({
  //     firstName: req.body.firstName,
  //     lastName: req.body.lastName,
  //     id: req.body.id
  //     })
  //     .then( person => {
  //         res.status(200).send(JSON.stringify(person));
  //     })
  //     .catch( err => {
  //         res.status(500).send(JSON.stringify(err));
  //     });
});

/**
 * Route to add a new employee to the org-chart
 * @name post/employee
 * @function
 * @memberof module:routers/accendo~accendoRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post("/employee", function (req, res) {
  // db.Person.create({
  //     firstName: req.body.firstName,
  //     lastName: req.body.lastName,
  //     id: req.body.id
  //     })
  //     .then( person => {
  //         res.status(200).send(JSON.stringify(person));
  //     })
  //     .catch( err => {
  //         res.status(500).send(JSON.stringify(err));
  //     });
});

// router.delete("/:id", function(req, res) {
//     db.Person.destroy({
//         where: {
//             id: req.params.id
//         }
//         })
//         .then( () => {
//             res.status(200).send();
//         })
//         .catch( err => {
//             res.status(500).send(JSON.stringify(err));
//         });
// });

module.exports = router;
