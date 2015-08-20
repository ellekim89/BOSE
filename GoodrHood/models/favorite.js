'use strict';
module.exports = function(sequelize, DataTypes) {
  var favorite = sequelize.define('favorite', {
    user_id: DataTypes.INTEGER,
    address: DataTypes.STRING,
    zipcode: DataTypes.INTEGER,
    rating: DataTypes.INTEGER,
    mainImage: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
        models.favorite.belongsTo(models.user, {foreignKey: 'user_id'});
      }
    }
  });
  return favorite;
};