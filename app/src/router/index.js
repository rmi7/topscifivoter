import Vue from 'vue';
import Router from 'vue-router';
import TopSciFiVoter from '@/components/TopSciFiVoter';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'TopSciFiVoter',
      component: TopSciFiVoter,
    },
  ],
});
