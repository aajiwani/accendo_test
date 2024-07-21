/** Adds in database entities for Accendo requirements
 * @module database/accendo
 * @requires database/sequelize
 */

// Loads initialized sequelize instance
const { Sequelize } = require("sequelize");
const sequelize = require("./sequelize");

const EmployeeJobTitle = sequelize.define("EmployeeJobTitle", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

const Organization = sequelize.define("Organization", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

const Employee = sequelize.define("Employee", {
  jobId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  employeeName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  employeeId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  emailAddress: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  rolePriority: {
    type: Sequelize.INTEGER,
    validate: {
      min: 1,
    },
  },
  jobLevel: {
    type: Sequelize.INTEGER,
    validate: {
      min: 1,
    },
  },
  isRoot: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
  },
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
});

Employee.belongsTo(Employee, {
  foreignKey: {
    allowNull: true,
    name: "reportsTo",
    field: "reports_to",
  },
  onDelete: "CASCADE",
});

Employee.belongsTo(Organization, {
  foreignKey: {
    allowNull: false,
    name: "belongsTo",
    field: "belongs_to",
  },
  onDelete: "CASCADE",
});

Employee.belongsTo(EmployeeJobTitle, {
  foreignKey: {
    allowNull: false,
    name: "jobTitleId",
    field: "jobTitleId",
  },
  onDelete: "CASCADE",
});

module.exports = {
  Employee: Employee,
  EmployeeJobTitle: EmployeeJobTitle,
  Organization: Organization,
};
