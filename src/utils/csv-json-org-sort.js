const OrgChartCSVConsts = require("./org-chart-csv-consts");

const OrgChartJSONSort = (json) => (a, b) => {
  if (a[OrgChartCSVConsts.IsRoot] === "yes") {
    return -1;
  } else {
    const managerA = json.find(
      (r) =>
        r[OrgChartCSVConsts.JobId] === a[OrgChartCSVConsts.ReportsToJobId] &&
        r[OrgChartCSVConsts.EmlpoyeeName] ===
          a[OrgChartCSVConsts.ReportsToPerson]
    );

    const managerB = json.find(
      (r) =>
        r[OrgChartCSVConsts.JobId] === b[OrgChartCSVConsts.ReportsToJobId] &&
        r[OrgChartCSVConsts.EmlpoyeeName] ===
          b[OrgChartCSVConsts.ReportsToPerson]
    );

    if (typeof managerA === "undefined") {
      return -1;
    } else if (typeof managerB === "undefined") {
      return 1;
    } else if (
      parseInt(managerA[OrgChartCSVConsts.JobLevel]) > parseInt(managerB[OrgChartCSVConsts.JobLevel])
    ) {
      return 1;
    } else return -1;
  }
};

module.exports = OrgChartJSONSort;
