// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import router from './router';
import Vuex from 'vuex';
import App from './App';
import Color from 'color';
import TWEEN from '@tweenjs/tween.js';

Vue.config.productionTip = false;
Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    portfolioColor: {
      bg: {
        r: 241,
        g: 237,
        b: 253,
      },
      link: {
        r: 62,
        g: 42,
        b: 245,
      },
    },
  },
  getters: {
    bgHEX(state) {
      return Color([
        state.portfolioColor.bg.r,
        state.portfolioColor.bg.g,
        state.portfolioColor.bg.b
      ]).string();
    },
    linkHEX(state) {
      return Color([
        state.portfolioColor.link.r,
        state.portfolioColor.link.g,
        state.portfolioColor.link.b
      ]).string();
    },
  },
  mutations: {
    // TODO: Сделать вставку цветов через создание элемента style, вставку его в шапку и внедрения в него нужных свойств
    // TODO: Может как-то через CSS можно сделать переход цвета?
    changeLinkColor(state, link) {
      state.link = link;
    },
    changeBgColor(state, bg) {
      state.bg = bg;
    },
  },
  actions: {
    colorTransition(context, { bgTo, linkTo }) {
      let bgRGBarr = Color.rgb(bgTo).color;
      let bgRGBobj = {
        r: bgRGBarr[0],
        g: bgRGBarr[1],
        b: bgRGBarr[2],
      };

      let linkRGBarr = Color.rgb(linkTo).color
      let linkRGBobj = {
        r: linkRGBarr[0],
        g: linkRGBarr[1],
        b: linkRGBarr[2],
      };

      new TWEEN.Tween(context.state.portfolioColor.bg)
        .to(bgRGBobj)
        .start();
      new TWEEN.Tween(context.state.portfolioColor.link)
        .to(linkRGBobj)
        .start();
      function animate() {
        if (TWEEN.update()) requestAnimationFrame(animate);
      };

      animate();
    }
  },
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router,
  components: { App },
  template: '<App/>',
});
