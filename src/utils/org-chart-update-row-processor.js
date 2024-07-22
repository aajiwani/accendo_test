const OrgChartCSVConsts = require("./org-chart-csv-consts");
const findManager = require("./find-manager");
const db = require("./../database/index");
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

  let rowEmployee = null;
  // Find if the person exists in our db
  try {
    rowEmployee = await db.accendo.Employee.findOne({
      where: {
        emailAddress: row[OrgChartCSVConsts.EmailAddress],
        employeeId: parseInt(row[OrgChartCSVConsts.EmployeeId]),
        belongs_to: parseInt(orgId),
      },
      transaction: trans,
      logging: console.log
    });

    console.log()

    // if (rowEmployee === null) throw new Error("Employee not found!");

    // Looks like we have a new employee joining in here
    // let manager = null;

    // With all non-root employees we must have a manager in the org
    // if (row[OrgChartCSVConsts.IsRoot] === "no") {
        // console.log(`Finding manager with ${row[OrgChartCSVConsts.ReportsToPerson]} ${row[OrgChartCSVConsts.ReportsToJobId]}`);
        // manager = await findManager(
        //     row[OrgChartCSVConsts.ReportsToPerson],
        //     row[OrgChartCSVConsts.ReportsToJobId],
        //     orgId,
        //     trans
        //   );

    // }
    //   manager = await findManager(
    //     row[OrgChartCSVConsts.ReportsToPerson],
    //     row[OrgChartCSVConsts.ReportsToJobId],
    //     orgId,
    //     trans
    //   );

    await rowEmployee.set({
      jobId: row[OrgChartCSVConsts.JobId],
      rolePriority: parseInt(row[OrgChartCSVConsts.RolePriority]),
      jobLevel: parseInt(row[OrgChartCSVConsts.JobLevel]),
      isRoot: row[OrgChartCSVConsts.IsRoot] === "yes" ? true : false,
      belongsTo: orgId,
      reportsTo: null,
      jobTitleId: jobTitle.toJSON().id,
    });

    // await rowEmployee.save();
  } catch (e) {
    console.log("");
    console.log("");
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(e);
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log("");
    console.log("");
    // Looks like we have a new employee joining in here
    let manager = null;

    // With all non-root employees we must have a manager in the org
    if (row[OrgChartCSVConsts.IsRoot] === "no")
      manager = await findManager(
        row[OrgChartCSVConsts.ReportsToPerson],
        row[OrgChartCSVConsts.ReportsToJobId],
        orgId,
        trans
      );

    rowEmployee = await createEmployeeRow(
      row,
      orgId,
      jobTitle.toJSON().id,
      row[OrgChartCSVConsts.IsRoot] === "yes" ? null : manager.toJSON().id,
      trans
    );
  }

  // Coming out of the above, we will have either a newly created employee or an old employee
  return rowEmployee;
};

module.exports = rowProcessor;
