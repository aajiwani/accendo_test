const OrgChartCSVConsts = require("./org-chart-csv-consts");
const db = require("./../database/index");
const findManager = require("./find-manager");
const createEmployeeRow = require("./create-emlpoyee-row");

const rowProcessor = async (row, trans, orgId) => {
  let jobTitle = null;

  // Sort out if job title has to be reused
  try {
    jobTitle = await db.accendo.EmployeeJobTitle.findOne({
      where: { title: row[OrgChartCSVConsts.JobTitle] },
      rejectOnEmpty: true,
      transaction: trans,
    });
  } catch (e) {
    jobTitle = await db.accendo.EmployeeJobTitle.create(
      {
        title: row[OrgChartCSVConsts.JobTitle],
      },
      {
        transaction: trans,
      }
    );
  }

  // Sort out the manager for the person, it changes from root to no root
  let manager = null;
  if (row[OrgChartCSVConsts.IsRoot] === "no")
    manager = await findManager(
      row[OrgChartCSVConsts.ReportsToPerson],
      row[OrgChartCSVConsts.ReportsToJobId],
      orgId,
      trans
    );

  const createdEmployee = await createEmployeeRow(
    row,
    orgId,
    jobTitle.toJSON().id,
    row[OrgChartCSVConsts.IsRoot] === "yes" ? null : manager.toJSON().id,
    trans
  );

  return createdEmployee;
};

module.exports = rowProcessor;
