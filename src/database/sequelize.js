/** Provides an initialized sequelized database driver, ready to use
 * @module database/sequelize
 * @requires sequelize
 */

/**
 * sequelize module
 * @const
 */
const Sequelize = require("sequelize");

// Initializes sequelize with environment settings
const sequelize = new Sequelize(
  process.env.DB_SCHEMA || "postgres",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    dialectOptions: {
      ssl: process.env.DB_SSL == "true",
    },
  }
);

module.exports = sequelize;