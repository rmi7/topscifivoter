/* global artifacts:true */
const TopSciFiVoter = artifacts.require('./TopSciFiVoter.sol');

module.exports = (deployer) => {
  deployer.deploy(TopSciFiVoter);
};
