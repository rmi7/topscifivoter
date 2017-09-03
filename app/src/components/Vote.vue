<template>
  <div>
    <section>
      <p>Vote ends in: <strong>{{ timeLeft.days }} days, {{ timeLeft.hours }} hours, {{ timeLeft.minutes }} minutes, {{ timeLeft.seconds }} seconds</strong></p>
    </section>
    <section>

      <form @submit.prevent='voteHandler'>
        <label for='vote'>Vote on movie: </label>
        <input type='text' id='vote' placeholder='The Matrix' v-model='movieName'></input>
        <button id='sendBtn' type='submit'>Vote</button>
      </form>
      <p id='voteStatus'>{{ voteStatus }}</p>
    </section>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import * as types from '../store/mutationTypes';

export default {
  name: 'topscifi-voter-vote',
  created() {
    this.$store.dispatch('watchTime');
  },
  computed: {
    ...mapGetters({
      voteStatus: 'voteStatus',
      endTime: 'endTime',
      time: 'time',
    }),
    movieName: {
      get() {
        return this.$store.state.movieName;
      },
      set(value) {
        this.$store.commit(types.UPDATE_MOVIENAME, value);
      },
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
    voteHandler() {
      if (this.movieName) {
        this.$store.dispatch('vote');
      }
    },
  },
};
</script>

<style scoped>
section {
  margin-header: 3em;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.25em;
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
</style>
