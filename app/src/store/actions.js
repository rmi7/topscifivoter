/* global web3:true */
import Web3 from 'web3';

import * as types from './mutationTypes';
import { TopSciFiVoter } from '../contracts';

const TIMEOUT_TRX_STATUS = 3000;

const STATUS_NOTSTARTED = 0;
const STATUS_STARTED = 1;
const STATUS_ENDED = 2;

function toTimestampSeconds(days, hours, minutes, seconds) {
  const date = new Date();
  if (days) date.setDate(date.getDate() + days);
  if (hours) date.setHours(date.getHours() + hours);
  if (minutes) date.setMinutes(date.getMinutes() + minutes);
  if (seconds) date.setSeconds(date.getSeconds() + seconds);
  return Math.floor(date.getTime() / 1000); // to seconds
}

export default {
  initWeb3({ dispatch }) {
    const web3RetryInterval = setInterval(() => {
      if (typeof web3 !== 'undefined') {
        window.web3 = new Web3(web3.currentProvider);
        clearInterval(web3RetryInterval);
        dispatch('watchWeb3Account');
        dispatch('setContractProvider');
      }
    }, 100);
  },
  watchWeb3Account({ dispatch, state, commit }) {
    const web3WatchInterval = setInterval(() => {
      const account = web3.eth.accounts[0];

      if (!account) {
        clearInterval(web3WatchInterval);
        commit(types.CLEAR_ALL);
        dispatch('initWeb3');
        return;
      }

      if (account === state.account) return;

      if (state.votingStatus === '') {
        // it's not an account change, so we need to init the app
        dispatch('getVoteStatus');
      } else {
        // it's an account switch so we already know the VoteStatus
        commit(types.CLEAR_MYBIDS);
        dispatch('initFromStatus', {
          status: state.votingStatus,
          accountSwitched: true,
          statusAtSwitch: true,
        });
      }

      commit(types.UPDATE_ACCOUNT, account);

      dispatch('getBalance');
    }, 300);
  },
  setContractProvider() {
    TopSciFiVoter.setProvider(web3.currentProvider);
  },
  getBalance({ commit, state }, blockNumber = 'latest') {
    web3.eth.getBalance(state.account, blockNumber, (err, result) => {
      if (err) {
        console.error(err);
        return;
      }

      commit(types.UPDATE_BALANCE, web3.fromWei(result).toNumber());
    });
  },
  getVoteStatus({ dispatch }) {
    TopSciFiVoter.deployed().then(instance => (
      instance.getStatus.call()
    )).then((status) => {
      dispatch('initFromStatus', { status: status.toNumber() });
    })
    .catch(console.error);
  },
  initFromStatus({ state, commit, dispatch }, { status, accountSwitched, statusAtSwitch }) {
    commit(types.UPDATE_VOTINGSTATUS, status);

    switch (status) {
      case STATUS_NOTSTARTED:
        if (!accountSwitched) {
          dispatch('watchVoteStarted');
          dispatch('getOwner');
        }
        break;
      case STATUS_STARTED:
        dispatch('getPastAndWatchNewVotes', { accountSwitched });
        dispatch('getVoteEndTime');
        dispatch('watchVoteEnded');
        break;
      case STATUS_ENDED:
        if (accountSwitched && statusAtSwitch) {
          dispatch('getPastAndWatchNewVotes', { accountSwitched });
        }
        dispatch('watchMyWithdrawn');
        break;
      default:
        throw new Error(`unknown vote status ${status}`);
    }
  },
  watchVoteStarted({ dispatch }) {
    TopSciFiVoter.deployed().then((instance) => {
      const events = instance.LogVoteStarted({}, { fromBlock: 0, toBlock: 'latest' });

      events.watch((err, res) => {
        events.stopWatching();

        if (err) {
          console.erorr(err);
          return;
        }

        dispatch('initFromStatus', { status: STATUS_STARTED });

        dispatch('getBalance', res.blockNumber); // <-- doesn't work with 'latest' using testrpc!
      });
    });
  },
  getVoteEndTime({ commit }) {
    TopSciFiVoter.deployed().then(instance => (
      instance.end.call()
    )).then((endTime) => {
      commit(types.SET_ENDTIME, endTime.toNumber());
    })
    .catch(console.error);
  },

  getOwner({ commit }) {
    TopSciFiVoter.deployed().then(instance => (
      instance.owner.call()
    )).then((owner) => {
      commit(types.SET_OWNER, owner);
    })
    .catch(console.error);
  },

  watchVoteEnded({ dispatch }) {
    TopSciFiVoter.deployed().then((instance) => {
      const events = instance.LogVoteEnded({}, { fromBlock: 'latest' });

      events.watch((err) => {
        events.stopWatching();

        if (err) {
          console.erorr(err);
          return;
        }

        dispatch('initFromStatus', { status: STATUS_ENDED });
      });
    });
  },

  watchMyWithdrawn({ dispatch }) {
    TopSciFiVoter.deployed().then((instance) => {
      const events = instance.LogWithdrawn({}, { fromBlock: 'latest' });

      events.watch((err, res) => {
        if (err) {
          console.erorr(err);
          return;
        }

        const args = {
          blockNumber: res.blockNumber,
          voter: res.args.voter,
        };

        dispatch('handleWithdrawnEvent', args);
      });
    });
  },
  handleWithdrawnEvent({ state, commit, dispatch }, { blockNumber, voter }) {
    if (voter === state.account) {
      // it's the current active account
      commit(types.CLEAR_MYBIDS);
    }

    dispatch('getBalance', blockNumber); // <-- doesn't work with 'latest' using testrpc!
  },

  getPastAndWatchNewVotes({ commit, state, dispatch }, { accountSwitched }) {
    TopSciFiVoter.deployed().then((instance) => {
      instance.LogNewVote({}, { fromBlock: 0, toBlock: 'latest' }).get((err, res) => {
        if (err) {
          console.erorr(err);
          return;
        }

        if (res.length) {
          res.forEach((vote) => {
            if (!accountSwitched) {
              commit(types.INCREMENT_VOTE, web3.toUtf8(vote.args.movieName));
            }

            if (vote.args.voter === state.account) {
              // it's a vote of myself
              commit(types.INCREMENT_MYBIDS);
            }
          });

          // NOTE: when we start watching for LogNewVote, we will immediately get
          // back the latest LogNewVote. If this vote trx happened in the 'latest'
          // block, it will be the same as the last vote trx we got in the above
          // LogNewVote.get, therefore we are gonna save it here and inside the
          // LogNewVote.watch we will check if the transaction hash is the same,
          // if it is we will ignore it inside LogNewVote.watch!
          if (!accountSwitched) {
            commit(types.SAVE_NEWESTVOTEHASH, res[res.length - 1].transactionHash);
          }
        }

        if (!accountSwitched) {
          dispatch('watchNewVotes');
        }
      });
    });
  },
  watchNewVotes({ dispatch, commit, state }) {
    TopSciFiVoter.deployed().then((instance) => {
      const eventVotes = instance.LogNewVote({}, { fromBlock: 'latest' });

      eventVotes.watch((err, res) => {
        if (err) {
          console.erorr(err);
          return;
        }

        if (res.transactionHash === state.newest_vote_hash) {
          // this is a workaround for the problem of getting the latest vote trx twice,
          // once here and once inside LogNewVote.get (see above)
          commit(types.CLEAR_NEWESTVOTEHASH);
          return;
        }

        const args = {
          blockNumber: res.blockNumber,
          voter: res.args.voter,
          movieName: res.args.movieName,
        };

        dispatch('handleNewVoteEvent', args);
      });
    });
  },
  handleNewVoteEvent({ commit, state, dispatch }, { blockNumber, voter, movieName }) {
    commit(types.INCREMENT_VOTE, web3.toUtf8(movieName));

    if (voter === state.account) {
      // it's my own vote
      commit(types.INCREMENT_MYBIDS);
    }

    dispatch('getBalance', blockNumber); // <-- doesn't work with 'latest' using testrpc!
  },

  watchTime({ commit, state, dispatch }) {
    window.setInterval(() => {
      const time = Math.trunc((new Date()).getTime() / 1000);

      commit(types.UPDATE_TIME, time);

      if (state.endTime !== '' && state.endTime <= time) {
        // if endtime has passed, change status to Ended
        dispatch('initFromStatus', { status: STATUS_ENDED });
      }
    }, 1000);
  },

  start({ commit, state }) {
    commit(types.UPDATE_STARTSTATUS, 'Initiating start... (please wait)');
    const timestamp = toTimestampSeconds(state.startDays, state.startHours, state.startMinutes);

    TopSciFiVoter.deployed().then(instance => (
      instance.start(timestamp, { from: state.account })
        .then(() => {
          commit(types.UPDATE_STARTSTATUS, 'Start transaction sent!');

          const events = instance.LogVoteStarted({}, { fromBlock: 'latest' });

          events.watch((err) => {
            if (err) {
              console.erorr(err);
              return;
            }

            events.stopWatching();

            commit(types.UPDATE_VOTESTATUS, 'Start transaction mined/completed');
            setTimeout(() => commit(types.CLEAR_VOTESTATUS), TIMEOUT_TRX_STATUS);
          });
        }).catch((err) => {
          console.error(err);

          commit(types.UPDATE_STARTSTATUS, 'Error starting voting round.');
          setTimeout(() => commit(types.CLEAR_STARTSTATUS), TIMEOUT_TRX_STATUS);
        })
    ));
  },

  vote({ commit, state }) {
    commit(types.UPDATE_VOTESTATUS, 'Initiating vote... (please wait)');

    TopSciFiVoter.deployed().then(instance => (
      instance.vote(state.movieName, { from: state.account, value: web3.toWei(1, 'ether') })
        .then(() => {
          commit(types.UPDATE_VOTESTATUS, 'Vote transaction sent!');

          const events = instance.LogNewVote({ voter: state.account }, { fromBlock: 'latest' });

          events.watch((err) => {
            if (err) {
              console.erorr(err);
              return;
            }

            events.stopWatching();

            commit(types.CLEAR_MOVIENAME);

            commit(types.UPDATE_VOTESTATUS, 'Vote transaction mined/completed');
            setTimeout(() => commit(types.CLEAR_VOTESTATUS), TIMEOUT_TRX_STATUS);
          });
        }).catch((err) => {
          console.error(err);

          commit(types.UPDATE_VOTESTATUS, 'Error sending vote.');
          setTimeout(() => commit(types.CLEAR_VOTESTATUS), TIMEOUT_TRX_STATUS);
        })
    ));
  },

  withdraw({ commit, state }) {
    commit(types.UPDATE_WITHDRAWSTATUS, 'Initiating withdraw... (please wait)');

    TopSciFiVoter.deployed().then(instance => (
      instance.withdraw({ from: state.account })
        .then(() => {
          commit(types.UPDATE_WITHDRAWSTATUS, 'Withdraw transaction sent!');

          const events = instance.LogWithdrawn({ voter: state.account }, { fromBlock: 'latest' });

          events.watch((err) => {
            if (err) {
              console.erorr(err);
              return;
            }

            events.stopWatching();

            commit(types.UPDATE_WITHDRAWSTATUS, 'Withdraw transaction mined/completed');
            setTimeout(() => commit(types.CLEAR_WITHDRAWSTATUS), TIMEOUT_TRX_STATUS);
          });
        }).catch((err) => {
          console.error(err);

          commit(types.UPDATE_VOTESTATUS, 'Error sending vote.');
          setTimeout(() => commit(types.CLEAR_WITHDRAWSTATUS), TIMEOUT_TRX_STATUS);
        })
    ));
  },
};
