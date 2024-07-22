const db = require("./../database/index");
const OrgChartCSVConsts = require("./org-chart-csv-consts");

const createEmployeeRow = async (
  row,
  orgId,
  jobTitleId,
  managerId,
  transaction = null
) => {
  const creationParams = {
    jobId: row[OrgChartCSVConsts.JobId],
    employeeName: row[OrgChartCSVConsts.EmployeeName],
    employeeId: parseInt(row[OrgChartCSVConsts.EmployeeId]),
    emailAddress: row[OrgChartCSVConsts.EmailAddress],
    rolePriority: parseInt(row[OrgChartCSVConsts.RolePriority]),
    jobLevel: parseInt(row[OrgChartCSVConsts.JobLevel]),
    isRoot: row[OrgChartCSVConsts.IsRoot] === "yes" ? true : false,
    belongsTo: orgId,
    reportsTo: row[OrgChartCSVConsts.IsRoot] === "yes" ? null : managerId,
    jobTitleId: jobTitleId,
  };

  if (transaction) {
    return await db.accendo.Employee.create(creationParams, {
      transaction: transaction,
    });
  } else {
    return await db.accendo.Employee.create(creationParams);
  }
};

module.exports = createEmployeeRow;
