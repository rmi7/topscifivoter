<template>
  <div>
    <section>
      <p>My bids: <strong>{{ myBids }} ETH</strong></p>
    </section>

    <section v-if='roundEnded'>
      <form @submit.prevent='withdrawHandler'>
        <button id='send' type='submit'>Withdraw my bids</button>
      </form>
      <p id='withdrawStatus'>{{ withdrawStatus }}</p>
    </section>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'topscifi-voter-myvotes',
  computed: {
    ...mapGetters({
      withdrawStatus: 'withdrawStatus',
      roundEnded: 'roundEnded',
      myBids: 'myBids',
    }),
  },
  methods: {
    withdrawHandler() {
      this.$store.dispatch('withdraw');
    },
  },
};
</script>

<style scoped>
section {
  margin-header: 3em;
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
