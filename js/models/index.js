'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file !== 'associations.js') && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

db.Node.hasMany(db.Edge, { foreignKey: 'toId' })
db.Node.hasMany(db.Edge, { foreignKey: 'fromId' })
db.Edge.belongsTo(db.Node, {
  foreignKey: 'fromId',
  as: 'From',
  onDelete: 'CASCADE'
});
db.Edge.belongsTo(db.Node, {
  foreignKey: 'toId',
  as: 'To',
  onDelete: 'CASCADE'
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
