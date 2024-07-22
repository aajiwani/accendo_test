const OrgChartCSVConsts = require("./org-chart-csv-consts");

const validateOrgChartRules = (orgChartJson) => {
  // Lets check if we have only one root present
  const rootsFound = orgChartJson.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );
  if (rootsFound > 1)
    throw new Error(
      "We found more than 1 root, only one root could exist per organization"
    );

  // Lets check if the boses are righly aligned in the org
  orgChartJson.some((row) => {
    reportingToJobId = row[OrgChartCSVConsts.ReportsToJobId];
    reportingToName = row[OrgChartCSVConsts.ReportsToPerson];
    const foundManager = orgChartJson.find(
      (r) =>
        r[OrgChartCSVConsts.EmployeeName] == reportingToName &&
        r[OrgChartCSVConsts.EmployeeId] == reportingToJobId
    );
    if (reportingToJobId > 1 && typeof foundManager === "undefined")
      throw new Error(`Manager for ${row[OrgChartCSVConsts.EmployeeName]} has a problem`);
    if (reportingToJobId > 1 && row[OrgChartCSVConsts.JobLevel] < foundManager[OrgChartCSVConsts.JobLevel])
      throw new Error(
        `Manager should have a higher job level than the report: ${row[OrgChartCSVConsts.EmployeeName]} is odd`
      );
  });
};

module.exports = validateOrgChartRules;