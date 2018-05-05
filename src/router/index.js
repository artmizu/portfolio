import Vue from 'vue';
import Router from 'vue-router';
import Portfolio from '@/Portfolio';
import Birden from '@/components/portfolio/page/birden';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      component: Portfolio,
    }, {
      path: '/project/birden',
      component: Birden,
    },
  ],
});
