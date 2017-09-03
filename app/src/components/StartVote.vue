<template>
  <div>
    <section>

      <p v-if='!isOwner'>Only the contract owner can start the voting round</p>

      <template v-if='isOwner' id='startForm'>
        <form @submit.prevent='startHandler'>
          <h3>Vote period ends in</h3>
          <div>
            <label for='startDays'>Days: </label>
            <input
              type='number'
              id='startDays'
              placeholder='1'
              v-model.number='startDays'>
            </input>
          </div>

          <div>
            <label for='startHours'>Hours: </label>
            <input
              type='number'
              id='startHours'
              placeholder='1'
              v-model.number='startHours'>
            </input>
          </div>

          <div>
            <label for='startMinutes'>Minutes: </label>
            <input
              type='number'
              id='startMinutes'
              placeholder='1'
              v-model.number='startMinutes'>
            </input>
          </div>

          <div>
            <label for='startSeconds'>Seconds: </label>
            <input
              type='number'
              id='startSeconds'
              placeholder='1'
              v-model.number='startSeconds'>
            </input>
          </div>

          <button id='startBtn' type='submit'>Start Voting Round</button>
        </form>
        <p id='startStatus'>{{ startStatus }}</p>
      </template>
    </section>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import * as types from '../store/mutationTypes';

export default {
  name: 'topscifi-voter-start',
  computed: {
    ...mapGetters({
      account: 'account',
      owner: 'owner',
      startStatus: 'startStatus',
    }),
    startDays: {
      get() {
        return this.$store.state.startDays;
      },
      set(value) {
        this.$store.commit(types.UPDATE_STARTDAYS, value);
      },
    },
    startHours: {
      get() {
        return this.$store.state.startHours;
      },
      set(value) {
        this.$store.commit(types.UPDATE_STARTHOURS, value);
      },
    },
    startMinutes: {
      get() {
        return this.$store.state.startMinutes;
      },
      set(value) {
        this.$store.commit(types.UPDATE_STARTMINUTES, value);
      },
    },
    startSeconds: {
      get() {
        return this.$store.state.startSeconds;
      },
      set(value) {
        this.$store.commit(types.UPDATE_STARTSECONDS, value);
      },
    },
    isOwner() {
      return this.owner === this.account;
    },
  },
  methods: {
    startHandler() {
      if (this.startDays || this.startHours || this.startMinutes || this.startSeconds) {
        this.$store.dispatch('start');
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
  display: inline-block;
  font-weight: bold;
  margin-bottom: 0.25em;
}

input {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  width: 50%;
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
