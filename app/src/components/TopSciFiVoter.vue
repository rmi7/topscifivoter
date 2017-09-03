<template>
  <div>
    <topscifi-voter-header></topscifi-voter-header>

    <topscifi-voter-start v-if='roundNotStarted'></topscifi-voter-start>

    <topscifi-voter-vote v-if='roundStarted'></topscifi-voter-vote>

    <topscifi-voter-myvotes v-if='myBids'></topscifi-voter-myvotes>

    <topscifi-voter-ranking v-if='votes.length'></topscifi-voter-ranking>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Header from './Header';
import StartVote from './StartVote';
import Vote from './Vote';
import Ranking from './Ranking';
import MyVotes from './MyVotes';

export default {
  components: {
    'topscifi-voter-header': Header,
    'topscifi-voter-start': StartVote,
    'topscifi-voter-vote': Vote,
    'topscifi-voter-ranking': Ranking,
    'topscifi-voter-myvotes': MyVotes,
  },
  name: 'topscifi-voter',
  created() {
    this.$store.dispatch('watchTime');
  },
  computed: {
    ...mapGetters({
      votes: 'votes',
      roundNotStarted: 'roundNotStarted',
      roundStarted: 'roundStarted',
      myBids: 'myBids',
    }),
  },
};
</script>

<style scoped>
section {
  margin-header: 3em;
}
</style>
