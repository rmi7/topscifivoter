<template>
  <div>
    <section>
      <h1>Vote on your favorite movie</h1>

      <h3 v-if='!account'><strong>PLEASE LOGIN TO MetaMask</strong></h3>

      <template v-if='account'>
        <p>My account balance: <strong>{{ balance }} ETH</strong></p>
        <p v-show='account && roundStatus'>Voting Round Status: <strong>{{ roundStatus }}</strong></p>
      </template>

      <p v-if='roundStarted || (roundEnded && myBids)'>My bids: <strong>{{ myBids }} ETH</strong></p>

      <template v-if='isOwner && roundNotStarted' id='startForm'>
        <form @submit.prevent='startHandler'>
          <h3>Vote period ends in</h3>
          <label for='startDays'>Days: </label>
          <input type='number' id='startDays' placeholder='1' :value.number='startDays' @input='updateStartDays'></input>
          <label for='startHours'>Hours: </label>
          <input type='number' id='startHours' placeholder='1' :value='startHours' @input='updateStartHours'></input>
          <label for='startMinutes'>Minutes: </label>
          <input type='number' id='startMinutes' placeholder='1' :value='startMinutes' @input='updateStartMinutes'></input>
          <label for='startSeconds'>Seconds: </label>
          <input type='number' id='startSeconds' placeholder='1' :value='startSeconds' @input='updateStartSeconds'></input>
          <button id='startBtn' type='submit'>Start Voting Round</button>
        </form>
        <p id='startStatus'>{{ startStatus }}</p>
      </template>

      <template v-if='roundStarted'>
        <p>Vote ends in: <strong>{{ timeLeft.days }} days, {{ timeLeft.hours }} hours, {{ timeLeft.minutes }} minutes, {{ timeLeft.seconds }} seconds</strong></p>

        <form @submit.prevent='voteHandler'>
          <label for='vote'>Vote on movie: </label>
          <input type='text' id='vote' placeholder='The Matrix' :value='movieName' @input='updateMovieName'></input>
          <button id='sendBtn' type='submit'>Vote</button>
        </form>
        <p id='voteStatus'>{{ voteStatus }}</p>
      </template>

      <template v-if='roundEnded && myBids'>
        <form @submit.prevent='withdrawHandler'>
          <button id='send' type='submit'>Withdraw my bids</button>
        </form>
        <p id='withdrawStatus'>{{ withdrawStatus }}</p>
      </template>

      <template v-if='(roundStarted || roundEnded) && sortedVotes.length'>
        <p>RANKING</p>
        <ol>
          <li v-for='movie in sortedVotes'>
              <span class="votesCount"><strong>{{ movie.votes }}</strong></span>
              <span class="votesMovie">{{ movie.name }}</span>
          </li>
        </ol>
      </template>
    </section>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import * as types from '../store/mutationTypes';

export default {
  name: 'topscifi-voter',
  created() {
    this.$store.dispatch('watchTime');
  },
  computed: {
    ...mapGetters({
      account: 'account',
      balance: 'balance',

      owner: 'owner',
      votes: 'votes',
      myBids: 'myBids',
      endTime: 'endTime',

      time: 'time',
      startDays: 'startDays',
      startHours: 'startHours',
      startMinutes: 'startMinutes',
      startSeconds: 'startSeconds',
      movieName: 'movieName',

      votingStatus: 'votingStatus',
      startStatus: 'startStatus',
      voteStatus: 'voteStatus',
      withdrawStatus: 'withdrawStatus',
    }),
    isOwner() {
      return this.owner === this.account;
    },
    roundNotStarted() {
      return this.votingStatus === 0;
    },
    roundStarted() {
      return this.votingStatus === 1;
    },
    roundEnded() {
      return this.votingStatus === 2;
    },
    roundStatus() {
      if (this.roundNotStarted) {
        return 'Not Started';
      } else if (this.roundStarted) {
        return 'Active';
      } else if (this.roundEnded) {
        return 'Ended';
      }
      return '';
    },
    sortedVotes() {
      return this.votes.slice().sort((a, b) => b.votes - a.votes);
    },
    timeLeft() {
      const ret = {};
      let delta = Math.abs(this.endTime - this.time);
      ret.days = Math.floor(delta / 86400);
      delta -= ret.days * 86400;
      ret.hours = Math.floor(delta / 3600) % 24;
      delta -= ret.hours * 3600;
      ret.minutes = Math.floor(delta / 60) % 60;
      delta -= ret.minutes * 60;
      ret.seconds = delta % 60;
      return ret;
    },
  },
  methods: {
    updateStartDays(e) {
      this.$store.commit(types.UPDATE_STARTDAYS, e.target.value ? parseInt(e.target.value, 10) : '');
    },
    updateStartHours(e) {
      this.$store.commit(types.UPDATE_STARTHOURS, e.target.value ? parseInt(e.target.value, 10) : '');
    },
    updateStartMinutes(e) {
      this.$store.commit(types.UPDATE_STARTMINUTES, e.target.value ? parseInt(e.target.value, 10) : '');
    },
    updateStartSeconds(e) {
      this.$store.commit(types.UPDATE_STARTSECONDS, e.target.value ? parseInt(e.target.value, 10) : '');
    },
    updateMovieName(e) {
      this.$store.commit(types.UPDATE_MOVIENAME, e.target.value);
    },

    voteHandler() {
      if (this.movieName) {
        this.$store.dispatch('vote');
      }
    },
    startHandler() {
      if (this.startDays || this.startHours || this.startMinutes || this.startSeconds) {
        this.$store.dispatch('start');
      }
    },
    withdrawHandler() {
      this.$store.dispatch('withdraw');
    },
  },
};
</script>

<!-- Add 'scoped' attribute to limit CSS to this component only -->
<style scoped>
section {
  margin-top: 3em;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.25em;
}

#startForm label,
#startForm input {
  display: inline-block;
  width:49%;
}

input {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  width: 100%;
  padding: 0.5em;
  font-size: 1em;
  border: 1px solid #ccc;
  margin-bottom: 1em;
}

button {
  padding: 0.5em 1em;
  background-color: #7FC76A;
  font-size: 1em;
  color: white;
  cursor: pointer;
  border: 0;
}

h1, h2 {
  font-weight: normal;
}

ul, ol {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

ol li {
  display: block;
}

a {
  color: #42b983;
}
</style>
