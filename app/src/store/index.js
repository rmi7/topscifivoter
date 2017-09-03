
import Vue from 'vue';
import Vuex from 'vuex';

import createLogger from 'vuex/dist/logger';

import mutations from './mutations';
import actions from './actions';
import getters from './getters';
import rootState from './rootState';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  state: rootState,
  getters,
  actions,
  mutations,
  strict: debug,
  plugins: debug ? [createLogger()] : [],
});
