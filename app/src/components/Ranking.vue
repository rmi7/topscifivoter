<template>
  <div>
    <section>
      <h2>Ranking</h2>
      <ol>
        <li v-for='movie in sortedVotes'>
            <span class="votesCount"><strong>{{ movie.votes }}</strong></span>
            <span class="votesMovie">{{ movie.name }}</span>
        </li>
      </ol>
    </section>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'topscifi-voter-ranking',
  computed: {
    ...mapGetters({
      votes: 'votes',
    }),
    sortedVotes() {
      return this.votes.slice().sort((a, b) => b.votes - a.votes);
    },
  },
};
</script>

<style scoped>
section {
  margin-header: 3em;
}

h2 {
  font-weight: normal;
}

ol {
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
</style>
