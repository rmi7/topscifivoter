export default {
  account: state => state.account,
  balance: state => state.balance,

  owner: state => state.owner,
  votes: state => state.votes,
  myBids: state => state.myBids,
  endTime: state => state.endTime,

  time: state => state.time,
  startDays: state => state.startDays,
  startHours: state => state.startHours,
  startMinutes: state => state.startMinutes,
  startSeconds: state => state.startSeconds,
  movieName: state => state.movieName,

  votingStatus: state => state.votingStatus,
  startStatus: state => state.startStatus,
  voteStatus: state => state.voteStatus,
  withdrawStatus: state => state.withdrawStatus,
};
