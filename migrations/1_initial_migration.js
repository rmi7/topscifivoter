/* global artifacts:true */
const Migrations = artifacts.require('./Migrations.sol');

module.exports = (deployer) => {
  deployer.deploy(Migrations);
};
