// /* global web3:true */

import contract from 'truffle-contract';

// import artifacts
import topscifivoterArtifacts from '../../../build/contracts/TopSciFiVoter.json';

// create contracts
const TopSciFiVoter = contract(topscifivoterArtifacts);

export {
  TopSciFiVoter,
};
