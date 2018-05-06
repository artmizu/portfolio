<template>
  <PageScaffold
    title="Birden.io"
    category="Дизайн"
    description="Проектирование интерфейса для сервиса просмотра аниме, где пользователи
    могут смотреть любимые сериалы, следить за их выходом и собирать собственные
    коллекции любимых произведений."
  >
    <BrowserScaffold
      primary="#212D3E"
      secondary="#29374B"
      img="/static/portfolio/samo/landing.png"
    ></BrowserScaffold>
  </PageScaffold>
</template>

<script>
import PageScaffold from './../../PageScaffold';
import BrowserScaffold from './../../BrowserScaffold';
import Color from 'color';
import TWEEN from '@tweenjs/tween.js';

export default {
  beforeRouteEnter(to, from, next) {
    next(function (vm) {
      console.log(vm);
      vm.injectStyleTag();
      vm.styleProp({
        linkColor: "#16e4ba",
        titleColor: "#ffffff",
        paragraphColor: "#99aac1",
        bodyColor: "#2a394e",
      });
    });
  },
  beforeRouteLeave(to, from, next) {
    this.resetStyleTag();
    next();
  },
  components: {
    PageScaffold,
    BrowserScaffold,
  },
  data() {
    return {
      styleNode: null,
    }
  },
  methods: {
    injectStyleTag() {
      console.log('inject');
      let style = document.createElement('style');
      style.type = "text/css";
      style.appendChild(document.createTextNode(""));
      this.styleNode = style.childNodes[0];
      document.head.appendChild(style);
    },
    resetStyleTag() {
      this.styleNode.textContent = "";
    },
    styleProp(val) {
      console.log('change style');
      this.styleNode.textContent = `
        .body {
          color: ${val.paragraphColor};
          background-color: ${val.bodyColor};
          transition:color 0.5s, background-color 0.5s;
        }
        .h1, h2, h3 {
          color: ${val.titleColor};
          transition:color 0.5s;
        }
        .link {
          color: ${val.linkColor};
          transition:color 0.5s;
        }
      `;
    },
  },
};
</script>

<style>
  .rectangle {
    width: 100px;
    height: 100px;
  }
</style>
