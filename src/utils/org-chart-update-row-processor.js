const OrgChartCSVConsts = require("./org-chart-csv-consts");
const db = require("./../database/index");

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

  let currentEmployee = null;
  // Find if the person exists in our db
  try {
    currentEmployee = await db.accendo.Employee.findOne({
      where: {
        employeeName: row[OrgChartCSVConsts.EmlpoyeeName],
        employeeId: row[OrgChartCSVConsts.employeeId],
        belongs_to: orgId,
      },
      rejectOnEmpty: true,
      transaction: trans,
    });
  } catch (e) {
    // Looks like we have a new employee joining in here
    // We will absorb this error
  }

  if (!currentEmployee) {
    // We are clear to create a new employee here,
    // We will start by finding their manager in our database
  }

  // Sort out the manager for the person, it changes from root to no root
  let manager = null;
  try {
    if (row[OrgChartCSVConsts.IsRoot] === "no") {
      // If someone is not a root and without a manager, we have a problem in the organization
      manager = await db.accendo.Employee.findOne({
        where: {
          employeeName: row[OrgChartCSVConsts.ReportsToPerson],
          jobId: row[OrgChartCSVConsts.ReportsToJobId],
          belongs_to: orgId,
        },
        rejectOnEmpty: true,
        transaction: trans,
      });
    }
  } catch (e) {
    // Looks like we found someone without manager in the organization
    await trans.rollback();
    throw new Error(
      "We expected everyone in the organization to have a manager"
    );
  }

  const createdEmployee = await db.accendo.Employee.create(
    {
      jobId: row[OrgChartCSVConsts.JobId],
      employeeName: row[OrgChartCSVConsts.EmlpoyeeName],
      employeeId: parseInt(row[OrgChartCSVConsts.EmployeeId]),
      emailAddress: row[OrgChartCSVConsts.EmailAddress],
      rolePriority: parseInt(row[OrgChartCSVConsts.RolePriority]),
      jobLevel: parseInt(row[OrgChartCSVConsts.JobLevel]),
      isRoot: row[OrgChartCSVConsts.IsRoot] === "yes" ? true : false,
      belongsTo: orgId,
      reportsTo:
        row[OrgChartCSVConsts.IsRoot] === "yes" ? null : manager.toJSON().id,
      jobTitleId: jobTitle.toJSON().id,
    },
    {
      transaction: trans,
    }
  );

  return createdEmployee;
};

module.exports = rowProcessor;
