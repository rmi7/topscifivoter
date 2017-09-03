<template>
  <div>
    <section>
      <h1>Vote on your favorite movie</h1>

      <h3 v-if='!account'><strong>Please login to MetaMask</strong></h3>

      <p v-if='account'>Active account: <strong>{{ shortAddress(account) }}</strong></p>

      <p v-if='balance'>My account balance: <strong>{{ balance }} ETH</strong></p>

      <p v-if='owner'>Owner account: <strong>{{ shortAddress(owner) }}</strong></p>

      <p v-if='roundStatus'>Voting Round Status: <strong>{{ roundStatus }}</strong></p>
    </section>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'topscifi-voter-header',
  computed: {
    ...mapGetters({
      account: 'account',
      balance: 'balance',
      votingStatus: 'votingStatus',
      owner: 'owner',
    }),
    roundStatus() {
      switch (this.votingStatus) {
        case 0: return 'Not Started';
        case 1: return 'Started';
        case 2: return 'Ended';
        default: return '';
      }
    },
  },
  methods: {
    shortAddress(addr) {
      return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
    },
  },
};
</script>

<style scoped>
section {
  margin-header: 3em;
}

h1 {
  font-weight: normal;
}
</style>
