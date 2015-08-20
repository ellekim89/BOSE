'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    queryInterface.addColumn(
                            'favorites',
                            'mainImage',
                            Sequelize.STRING
                            );
    queryInterface.addColumn(
                            'favorites',
                            'rating',
                            Sequelize.INTEGER
                            );
  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    queryInterface.removeColumn(
                            'favorites',
                            'rating'
                            );
    queryInterface.removeColumn(
                            'favorites',
                            'mainImage'
                            );
  }
};
