'use strict';
const Sequelize = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Edge extends Sequelize.Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // associations can be defined here
      // console.log(models, 'x', models.Nodes)
    }
  };
  Edge.init({
    label: DataTypes.STRING,
    fromId: DataTypes.INTEGER,
    toId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Edge',
  });
  return Edge;
};
