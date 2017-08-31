/*
  global
  web3: true,
  artifacts:true,
  contract:true,
  beforeEach: true,
  describe: true,
  it:true,
  assert:true
*/

const TopSciFiVoter = artifacts.require('./TopSciFiVoter.sol');

const getTimestampInFuture = ({ days, hours, minutes, seconds }) => {
  const date = new Date();
  if (days) date.setDate(date.getDate() + days);
  if (hours) date.setHours(date.getHours() + hours);
  if (minutes) date.setMinutes(date.getMinutes() + minutes);
  if (seconds) date.setSeconds(date.getSeconds() + seconds);
  return Math.floor(date.getTime() / 1000); // to seconds
};

const sleep = seconds => new Promise(resolve => setTimeout(resolve, seconds * 1e3));

const ROUND_MAX_DAYS = 30;
const VOTE_PRICE_WEI = web3.toBigNumber(web3.toWei(1, 'ether'));

const ERROR_INVALID_ARGS = 'Invalid number of arguments to Solidity function';
const ERROR_INVALID_OPCODE = 'VM Exception while processing transaction: invalid opcode';

contract('TopSciFiVoter', (accounts) => {
  let instance;

  beforeEach(async () => {
    instance = await TopSciFiVoter.new();
  });

  describe('deployed', () => {
    it('[success] variables should be initialized to correct values', async () => {
      const [begin, end, owner, status, movieCount] = await Promise.all([
        instance.begin.call(),
        instance.end.call(),
        instance.owner.call(),
        instance.status.call(),
        instance.movieCount.call(),
      ]);
      assert.equal(begin.toNumber(), 0);
      assert.equal(end.toNumber(), 0);
      assert.equal(owner.valueOf(), accounts[0]);
      assert.equal(status.toNumber(), 0);
      assert.equal(movieCount.toNumber(), 0);
    });
  });

  describe('start', () => {
    it('[error] not from owner', async () => {
      const endTime = getTimestampInFuture({ days: ROUND_MAX_DAYS - 1 });
      try {
        await instance.start(endTime, { from: accounts[1] });
      } catch (err) {
        assert.equal(err.message, ERROR_INVALID_OPCODE);
        return;
      }
      throw new Error('should have thrown because msg.send !== owner');
    });

    it('[error] no endTime arg', async () => {
      try {
        await instance.start(undefined, { from: accounts[0] });
      } catch (err) {
        assert.equal(err.message, ERROR_INVALID_ARGS);
        return;
      }
      throw new Error('should have thrown because no endTime arg was given');
    });

    it('[error] endTime arg is invalid timestamp: 9999999999', async () => {
      try {
        await instance.start(9999999999, { from: accounts[0] });
      } catch (err) {
        assert.equal(err.message, ERROR_INVALID_OPCODE);
        return;
      }
      throw new Error('should have thrown because invalid endTime (9999999999) arg was given');
    });

    it('[error] endTime arg is invalid timestamp: 1', async () => {
      try {
        await instance.start(1, { from: accounts[0] });
      } catch (err) {
        assert.equal(err.message, ERROR_INVALID_OPCODE);
        return;
      }
      throw new Error('should have thrown because invalid endTime (1) arg was given');
    });

    it('[error] endTime arg is invalid timestamp: \'a string\'', async () => {
      try {
        await instance.start('a string', { from: accounts[0] });
      } catch (err) {
        assert.equal(err.message, 'new BigNumber() not a number: a string');
        return;
      }
      throw new Error('should have thrown because invalid endTime (\'a string\') arg was given');
    });

    it('[error] 2nd nonexistent arg', async () => {
      const endTime = getTimestampInFuture({ days: ROUND_MAX_DAYS + 1 });
      try {
        await instance.start(endTime, 'DOESNT EXIST', { from: accounts[0] });
      } catch (err) {
        assert.equal(err.message, ERROR_INVALID_ARGS);
        return;
      }
      throw new Error('should have thrown because a 2nd nonexistent arg was given');
    });

    it('[error] from owner but endTime > ROUND_MAX_DAYS', async () => {
      const endTime = getTimestampInFuture({ days: ROUND_MAX_DAYS + 1 });
      try {
        await instance.start(endTime, { from: accounts[0] });
      } catch (err) {
        assert.equal(err.message, ERROR_INVALID_OPCODE);
        return;
      }
      throw new Error('should have thrown because endTime > ROUND_MAX_DAYS');
    });

    it('[success] from owner and endtime < ROUND_MAX_DAYS', async () => {
      const account = accounts[0];
      const endTime = getTimestampInFuture({ days: ROUND_MAX_DAYS - 1 });
      await instance.start(endTime, { from: account });
      const [begin, end, owner, status, movieCount] = await Promise.all([
        instance.begin.call(),
        instance.end.call(),
        instance.owner.call(),
        instance.status.call(),
        instance.movieCount.call(),
      ]);
      assert.equal(end.toNumber(), endTime);
      assert.isAbove(end.toNumber(), begin.toNumber());
      assert.equal(owner.valueOf(), account);
      assert.equal(status.toNumber(), 1);
      assert.equal(movieCount.toNumber(), 0);
    });

    it('[error] start succeeded but calling start a 2nd time should throw', async () => {
      const account = accounts[0];
      const endTime = getTimestampInFuture({ days: ROUND_MAX_DAYS - 1 });
      await instance.start(endTime, { from: account });
      const [begin, end, owner, status, movieCount] = await Promise.all([
        instance.begin.call(),
        instance.end.call(),
        instance.owner.call(),
        instance.status.call(),
        instance.movieCount.call(),
      ]);
      assert.equal(end.toNumber(), endTime);
      assert.isAbove(end.toNumber(), begin.toNumber());
      assert.equal(owner.valueOf(), account);
      assert.equal(status.toNumber(), 1);
      assert.equal(movieCount.toNumber(), 0);
      // second time calling start()
      try {
        await instance.start(endTime, { from: accounts[0] });
      } catch (err) {
        assert.equal(err.message, ERROR_INVALID_OPCODE);
        const [_begin, _end, _owner, _status, _movieCount] = await Promise.all([
          instance.begin.call(),
          instance.end.call(),
          instance.owner.call(),
          instance.status.call(),
          instance.movieCount.call(),
        ]);
        assert.equal(end.toNumber(), _end.toNumber());
        assert.equal(begin.toNumber(), _begin.toNumber());
        assert.equal(owner.valueOf(), _owner.valueOf());
        assert.equal(status.toNumber(), _status.toNumber());
        assert.equal(movieCount.toNumber(), _movieCount.toNumber());
        return;
      }
      throw new Error('should have thrown because start was called twice');
    });
  });

  describe('vote', () => {
    describe('start was not called', () => {
      it('[error] vote can only be executed after start has been called', async () => {
        const movie = 'The Matrix';
        try {
          await instance.vote(movie, { from: accounts[0] });
        } catch (err) {
          assert.equal(err.message, ERROR_INVALID_OPCODE);
          return;
        }
        throw new Error('should have thrown because start should be called before vote');
      });
    });

    describe('start was called', () => {
      beforeEach(async () => {
        const endTime = getTimestampInFuture({ days: ROUND_MAX_DAYS - 1 });
        await instance.start(endTime, { from: accounts[0] });
      });

      it('[error] no movieName arg', async () => {
        try {
          await instance.vote(undefined, { from: accounts[0], value: VOTE_PRICE_WEI });
        } catch (err) {
          assert.equal(err.message, ERROR_INVALID_ARGS);
          return;
        }
        throw new Error('should have thrown because no arg was given and function accepts one arg');
      });

      it('[error] 2nd nonexistent arg', async () => {
        const movie = 'The Matrix';
        try {
          await instance.vote(movie, '2nd arg', { from: accounts[0], value: VOTE_PRICE_WEI });
        } catch (err) {
          assert.equal(err.message, ERROR_INVALID_ARGS);
          return;
        }
        throw new Error('should have thrown because a second nonexistent arg was given');
      });

      it('[error] vote round time has passed', async () => {
        // create own instance variable to overwrite the one from before(Each)
        // since we need custom endTime
        const instance = await TopSciFiVoter.new(); // eslint-disable-line no-shadow
        const endTime = getTimestampInFuture({ seconds: 1 });
        await instance.start(endTime, { from: accounts[0] });
        await sleep(2); // so that the voting round period has ended
        const movie = 'The Matrix';
        try {
          await instance.vote(movie, { from: accounts[0], value: VOTE_PRICE_WEI });
        } catch (err) {
          assert.equal(err.message, ERROR_INVALID_OPCODE);
          return;
        }
        throw new Error('should have thrown because vote round time has ended and you cannot vote anymore');
      });

      it('[error] one sender tries to vote on one movie but amount is less than VOTE_PRICE_WEI', async () => {
        const movie = 'The Matrix';
        try {
          await instance.vote(movie, { from: accounts[0], value: VOTE_PRICE_WEI.minus(1) });
        } catch (err) {
          assert.equal(err.message, ERROR_INVALID_OPCODE);
          return;
        }
        throw new Error('should have thrown because amount is less than VOTE_PRICE_WEI');
      });

      it('[error] one sender tries to vote twice on the same movie', async () => {
        const movie = 'The Matrix';
        await instance.vote(movie, { from: accounts[0], value: VOTE_PRICE_WEI });
        const [movieCount, status, movies, bids] = await Promise.all([
          instance.movieCount.call(),
          instance.status.call(),
          instance.movies.call(0),
          instance.bids.call(movie),
        ]);
        assert.equal(movieCount.toNumber(), 1);
        assert.equal(status.toNumber(), 1);
        assert.equal(web3.toUtf8(movies), movie);
        assert.equal(bids.toString(), VOTE_PRICE_WEI);
        // vote 2
        try {
          await instance.vote(movie, { from: accounts[0], value: VOTE_PRICE_WEI });
        } catch (err) {
          assert.equal(err.message, ERROR_INVALID_OPCODE);
          return;
        }
        throw new Error('should have thrown because sender cannot vote twice on the same movie');
      });

      it('[success] one sender votes on one movie', async () => {
        const movie = 'The Matrix';
        await instance.vote(movie, { from: accounts[0], value: VOTE_PRICE_WEI });
        const [movieCount, status, movies, bids] = await Promise.all([
          instance.movieCount.call(),
          instance.status.call(),
          instance.movies.call(0),
          instance.bids.call(movie),
        ]);
        assert.equal(movieCount.toNumber(), 1);
        assert.equal(status.toNumber(), 1);
        assert.equal(web3.toUtf8(movies), movie);
        assert.equal(bids.toString(), VOTE_PRICE_WEI);
      });

      it('[success] one sender votes on two different movies', async () => {
        const movie1 = 'The Matrix';
        await instance.vote(movie1, { from: accounts[0], value: VOTE_PRICE_WEI });
        const [movieCount, status, movies1, bids1] = await Promise.all([
          instance.movieCount.call(),
          instance.status.call(),
          instance.movies.call(0),
          instance.bids.call(movie1),
        ]);
        assert.equal(movieCount.toNumber(), 1);
        assert.equal(status.toNumber(), 1);
        assert.equal(web3.toUtf8(movies1), movie1);
        assert.equal(bids1.toString(), VOTE_PRICE_WEI);
        // vote 2
        const movie2 = 'Inception';
        await instance.vote(movie2, { from: accounts[0], value: VOTE_PRICE_WEI });
        const [_movieCount, _status, _movies1, _movies2, _bids1, _bids2] = await Promise.all([
          instance.movieCount.call(),
          instance.status.call(),
          instance.movies.call(0),
          instance.movies.call(1),
          instance.bids.call(movie1),
          instance.bids.call(movie2),
        ]);
        assert.equal(_movieCount.toNumber(), 2);
        assert.equal(_status.toNumber(), 1);
        assert.equal(web3.toUtf8(_movies1), movie1);
        assert.equal(web3.toUtf8(_movies2), movie2);
        assert.equal(_bids1.toString(), VOTE_PRICE_WEI);
        assert.equal(_bids2.toString(), VOTE_PRICE_WEI);
      });

      it('[success] two senders vote on the same movie', async () => {
        const movie = 'The Matrix';
        await instance.vote(movie, { from: accounts[0], value: VOTE_PRICE_WEI });
        const [movieCount, status, movies, bids] = await Promise.all([
          instance.movieCount.call(),
          instance.status.call(),
          instance.movies.call(0),
          instance.bids.call(movie),
        ]);
        assert.equal(movieCount.toNumber(), 1);
        assert.equal(status.toNumber(), 1);
        assert.equal(web3.toUtf8(movies), movie);
        assert.equal(bids.toString(), VOTE_PRICE_WEI);
        // vote 2
        await instance.vote(movie, { from: accounts[1], value: VOTE_PRICE_WEI });
        const [_movieCount, _status, _movies, _bids] = await Promise.all([
          instance.movieCount.call(),
          instance.status.call(),
          instance.movies.call(0),
          instance.bids.call(movie),
        ]);
        assert.equal(_movieCount.toNumber(), 1);
        assert.equal(_status.toNumber(), 1);
        assert.equal(web3.toUtf8(_movies), movie);
        assert.equal(_bids.toString(), VOTE_PRICE_WEI.times(2));
      });

      it('[success] two senders vote on different movies', async () => {
        const movie1 = 'The Matrix';
        await instance.vote(movie1, { from: accounts[0], value: VOTE_PRICE_WEI });
        const [movieCount, status, movies1, bids1] = await Promise.all([
          instance.movieCount.call(),
          instance.status.call(),
          instance.movies.call(0),
          instance.bids.call(movie1),
        ]);
        assert.equal(movieCount.toNumber(), 1);
        assert.equal(status.toNumber(), 1);
        assert.equal(web3.toUtf8(movies1), movie1);
        assert.equal(bids1.toString(), VOTE_PRICE_WEI);
        // vote 2
        const movie2 = 'Inception';
        await instance.vote(movie2, { from: accounts[1], value: VOTE_PRICE_WEI });
        const [_movieCount, _status, _movies1, _movies2, _bids1, _bids2] = await Promise.all([
          instance.movieCount.call(),
          instance.status.call(),
          instance.movies.call(0),
          instance.movies.call(1),
          instance.bids.call(movie1),
          instance.bids.call(movie2),
        ]);
        assert.equal(_movieCount.toNumber(), 2);
        assert.equal(_status.toNumber(), 1);
        assert.equal(web3.toUtf8(_movies1), movie1);
        assert.equal(web3.toUtf8(_movies2), movie2);
        assert.equal(_bids1.toString(), VOTE_PRICE_WEI);
        assert.equal(_bids2.toString(), VOTE_PRICE_WEI);
      });

      it('[success] successful vote with amount > VOTE_PRICE_WEI, excess is refunded', async () => {
        const originalBalance = web3.fromWei(web3.eth.getBalance(accounts[0]));
        const movie = 'The Matrix';
        // we are gonna send an amount of 10 ETH with the vote
        await instance.vote(movie, { from: accounts[0], value: VOTE_PRICE_WEI.times(10) });
        const [movieCount, status, movies, bids] = await Promise.all([
          instance.movieCount.call(),
          instance.status.call(),
          instance.movies.call(0),
          instance.bids.call(movie),
        ]);
        assert.equal(movieCount.toNumber(), 1);
        assert.equal(status.toNumber(), 1);
        assert.equal(web3.toUtf8(movies), movie);
        assert.equal(bids.toString(), VOTE_PRICE_WEI);
        const newBalance = web3.fromWei(web3.eth.getBalance(accounts[0]));
        // if the refund succeeded, the difference between original_balance and new_balance
        // should not be more than 2 ETH (cannot be precise since gas costs are also deducted)
        // since price is 1 ETH, and we sent 10 ETH, we should get back 9 ETH
        // gas cost of this call seems to be 0.0166199 ETH
        assert.isTrue(originalBalance.minus(newBalance).lessThan(2));
      });
    });
  });

  describe('withdraw', () => {
    describe('start was not called', () => {
      it('[error] withdraw can only be executed after start has been called', async () => {
        try {
          await instance.withdraw({ from: accounts[0] });
        } catch (err) {
          assert.equal(err.message, ERROR_INVALID_OPCODE);
          return;
        }
        throw new Error('should have thrown because start has not been called yet');
      });
    });

    describe('start was called', () => {
      describe('voting round period is still active', () => {
        it('[error] cannot withdraw if voting period still active', async () => {
          const endTime = getTimestampInFuture({ days: ROUND_MAX_DAYS - 1 });
          await instance.start(endTime, { from: accounts[0] });
          await instance.vote('The Matrix', { from: accounts[0], value: VOTE_PRICE_WEI });
          try {
            await instance.withdraw({ from: accounts[0] });
          } catch (err) {
            assert.equal(err.message, ERROR_INVALID_OPCODE);
            return;
          }
          throw new Error('should have thrown because voting round period is still active');
        });
      });

      describe('voting round period has ended', () => {
        beforeEach(async () => {
          await instance.start(getTimestampInFuture({ seconds: 2 }), { from: accounts[0] });
        });

        it('[error] arg was given but function has no args', async () => {
          await instance.vote('The Matrix', { from: accounts[0], value: VOTE_PRICE_WEI });
          await sleep(2);
          try {
            await instance.withdraw('my arg', { from: accounts[0] });
          } catch (err) {
            assert.equal(err.message, ERROR_INVALID_ARGS);
            return;
          }
          throw new Error('should have thrown because an arg was given but function has no args');
        });

        it('[error] sender did not vote', async () => {
          await instance.vote('The Matrix', { from: accounts[0], value: VOTE_PRICE_WEI });
          await sleep(2);
          try {
            await instance.withdraw({ from: accounts[1] });
          } catch (err) {
            assert.equal(err.message, ERROR_INVALID_OPCODE);
            return;
          }
          throw new Error('should have thrown because sender did not vote');
        });

        it('[error] sender withdraws and then tries to withdraw a second time', async () => {
          await instance.vote('The Matrix', { from: accounts[0], value: VOTE_PRICE_WEI });
          await sleep(2);
          await instance.withdraw({ from: accounts[0] });
          const afterwithdrawBalance = web3.fromWei(web3.eth.getBalance(accounts[0]));
          try {
            await instance.withdraw({ from: accounts[0] });
          } catch (err) {
            assert.equal(err.message, ERROR_INVALID_OPCODE);
            const aftersecondwithdrawBalance = web3.fromWei(web3.eth.getBalance(accounts[0]));
            // since a second withdraw is not possible the two balances should be almost equal
            // the difference should at least be less than 1 ETH
            assert.isTrue(aftersecondwithdrawBalance.minus(afterwithdrawBalance).lessThan(1));
            return;
          }
          throw new Error('should have thrown because sender tried to withdraw twice');
        });

        it('[success] sender successfully withdraws all his bids (1)', async () => {
          await instance.vote('The Matrix', { from: accounts[0], value: VOTE_PRICE_WEI });
          await sleep(2);
          const originalBalance = web3.fromWei(web3.eth.getBalance(accounts[0]));
          await instance.withdraw({ from: accounts[0] });
          const newBalance = web3.fromWei(web3.eth.getBalance(accounts[0]));
          // if the withdraw succeeded, the difference between original_balance and new_balance
          // should not be more than 2 ETH (cannot be precise since gas costs are also deducted)
          // since price of 1 bid is 1 ETH
          assert.isTrue(newBalance.minus(originalBalance).lessThan(2));
        });

        it('[success] sender successfully withdraws all his bids (2)', async () => {
          await instance.vote('The Matrix', { from: accounts[0], value: VOTE_PRICE_WEI });
          await instance.vote('Inception', { from: accounts[0], value: VOTE_PRICE_WEI });
          await sleep(2);
          const originalBalance = web3.fromWei(web3.eth.getBalance(accounts[0]));
          await instance.withdraw({ from: accounts[0] });
          const newBalance = web3.fromWei(web3.eth.getBalance(accounts[0]));
          // if the withdraw succeeded, the difference between original_balance and new_balance
          // should not be more than 3 ETH (cannot be precise since gas costs are also deducted)
          // since price of 2 bids is 2 * 1 ETH = 2 ETH
          assert.isTrue(newBalance.minus(originalBalance).lessThan(3));
        });
      });
    });
  });
});
