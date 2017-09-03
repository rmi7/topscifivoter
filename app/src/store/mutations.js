import * as types from './mutationTypes';

export default {
  [types.ROUTE_CHANGED](state, { to, from }) {
    // NOTE: not used
    console.log('route changed from', from.name, 'to', to.name); // eslint-disable-line no-console
  },
  [types.SAVE_NEWESTVOTEHASH](state, hash) {
    state.newest_vote_hash = hash;
  },
  [types.CLEAR_NEWESTVOTEHASH](state) {
    state.newest_vote_hash = '';
  },
  [types.UPDATE_ACCOUNT](state, account) {
    state.account = account;
  },
  [types.UPDATE_BALANCE](state, balance) {
    state.balance = balance;
  },
  [types.UPDATE_VOTINGSTATUS](state, status) {
    state.votingStatus = status;
  },
  [types.SET_ENDTIME](state, time) {
    state.endTime = time;
  },
  [types.SET_OWNER](state, owner) {
    state.owner = owner;
  },
  [types.INCREMENT_VOTE](state, movieName) {
    let found = false;

    state.votes = state.votes.map((movie) => {
      if (movie.name === movieName) {
        movie.votes += 1;
        found = true;
      }
      return movie;
    });

    if (!found) {
      state.votes.push({
        name: movieName,
        votes: 1,
      });
    }
  },
  [types.INCREMENT_MYBIDS](state) {
    state.myBids += 1;
  },
  [types.CLEAR_MYBIDS](state) {
    state.myBids = 0;
  },
  [types.UPDATE_TIME](state, time) {
    state.time = time;
  },
  [types.UPDATE_STARTSTATUS](state, status) {
    state.startStatus = status;
  },
  [types.CLEAR_STARTSTATUS](state) {
    state.startStatus = '';
  },
  [types.UPDATE_VOTESTATUS](state, status) {
    state.voteStatus = status;
  },
  [types.CLEAR_VOTESTATUS](state) {
    state.voteStatus = '';
  },
  [types.UPDATE_WITHDRAWSTATUS](state, status) {
    state.withdrawStatus = status;
  },
  [types.CLEAR_WITHDRAWSTATUS](state) {
    state.withdrawStatus = '';
  },
  [types.UPDATE_STARTDAYS](state, days) {
    state.startDays = days;
  },
  [types.UPDATE_STARTHOURS](state, hours) {
    state.startHours = hours;
  },
  [types.UPDATE_STARTMINUTES](state, minutes) {
    state.startMinutes = minutes;
  },
  [types.UPDATE_STARTSECONDS](state, seconds) {
    state.startSeconds = seconds;
  },
  [types.UPDATE_MOVIENAME](state, movieName) {
    state.movieName = movieName;
  },
  [types.CLEAR_MOVIENAME](state) {
    state.movieName = '';
  },
  [types.CLEAR_ALL](state) {
    state.movieName = '';
    state.votingStatus = '';
    state.voteStatus = '';
    state.startSeconds = '';
    state.withdrawStatus = '';
    state.time = '';
    state.endTime = '';
    state.myBids = 0;
    state.startDays = '';
    state.startHours = '';
    state.startMinutes = '';
    state.startSeconds = '';
    state.votes = [];
    state.balance = '';
    state.account = '';
    state.owner = '';
    state.newest_vote_hash = '';
  },
};
