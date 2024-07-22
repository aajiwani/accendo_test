const OrgChartCSVConsts = require("./org-chart-csv-consts");

const schema = {
  type: "array",
  minItems: 1,
  items: [
    {
      type: "object",
      properties: {
        [OrgChartCSVConsts.JobId]: {
          type: "string",
          pattern: "^ACC-[0-9]{4}$",
        },
        [OrgChartCSVConsts.JobTitle]: {
          type: "string",
        },
        [OrgChartCSVConsts.EmlpoyeeName]: {
          type: "string",
        },
        [OrgChartCSVConsts.EmployeeId]: {
          type: "string",
        },
        [OrgChartCSVConsts.EmailAddress]: {
          type: "string",
        },
        [OrgChartCSVConsts.ReportsToJobId]: {
          type: "string",
          pattern: "^$|^[0-9]*$",
        },
        [OrgChartCSVConsts.ReportsToPerson]: {
          type: "string",
          pattern: "^$|^[0-9]*$",
        },
        [OrgChartCSVConsts.RolePriority]: {
          type: "string",
          pattern: "^[0-9]*$",
        },
        [OrgChartCSVConsts.JobLevel]: {
          type: "string",
          pattern: "^[0-9]*$",
        },
        [OrgChartCSVConsts.IsRoot]: {
          type: "string",
          enum: ["yes", "no"],
        }
      },
      required: [
        OrgChartCSVConsts.JobId,
        OrgChartCSVConsts.JobTitle,
        OrgChartCSVConsts.EmlpoyeeName,
        OrgChartCSVConsts.EmployeeId,
        OrgChartCSVConsts.EmailAddress,
        OrgChartCSVConsts.ReportsToJobId,
        OrgChartCSVConsts.ReportsToPerson,
        OrgChartCSVConsts.RolePriority,
        OrgChartCSVConsts.JobLevel,
        OrgChartCSVConsts.IsRoot
      ],
    },
  ],
};

module.exports = schema;
