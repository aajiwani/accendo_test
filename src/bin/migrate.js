// bin/migrate.js

var db = require('../database/index.js');
db.sequelize.sync({ force: true });