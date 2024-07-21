const sequelize = require("./sequelize");
const { Employee, EmployeeJobTitle, Organization } = require("./accendo");

module.exports = {
  sequelize: sequelize,
  accendo: {
    Employee,
    EmployeeJobTitle,
    Organization,
  },
};
