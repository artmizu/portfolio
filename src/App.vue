<template>
  <div class="layout">
    <div class="layout-header layout__header">
      <div class="layout-header__name">
        <h3 class="h3">Александр Сабуров</h3>
      </div>
      <div class="layout-header__nav">
        <h3 class="h3 layout-header__nav-item">
          <router-link to="/" class="link">Проекты</router-link>
        </h3>
        <h3 class="h3 layout-header__nav-item">
          <router-link to="/project/birden" class="link">Заметки</router-link>
        </h3>
      </div>
      <div class="layout-header__contacts">
        <h3 class="h3 layout-header__contact-title">Клиентам:</h3>
        <h3 class="h3 layout-header__contact-item"><a href="https://t.me/artmizu" class="link">Телеграм</a></h3>
        <h3 class="h3 layout-header__contact-item">
          <a href="mailto:hello@artmizu.ru" class="link">hello@artmizu.ru</a>
        </h3>
      </div>
    </div>
    <div class="layout__content">
      <router-view></router-view>
    </div>
    <div class="layout-footer layout__footer">
      <div class="layout-footer__date">2011 - {{ currentYear }}</div>
      <div class="layout-footer__copyright">* В шапке работа Утагавы Тоёкуни 1809 года</div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'App',
  data() {
    return {
      currentYear: new Date().getFullYear(),
    };
  },
};
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=Ubuntu:400,400i,500&subset=cyrillic');

  $pale: #68649F;
  $border: #DFD8F4;

  * {
    margin:0px;
    padding:0px;
    border:0;
    box-sizing: border-box;
  }

  html, body {
    height:100%;
  }

  body {
    padding: 0 40px;
    color:#232236;
    font-family: 'Ubuntu', sans-serif;
    font-size: 15px;
  }

  .body {
    color:#232236;
    background-color:#f1edfd;
    position:relative;
    /* &:before {
      content:"";
      background-image: url(./assets/body-pattern.png);
      display:block;
      position:absolute;
      z-index:-1;
      left:0px;
      top:0px;
      right:0px;
      bottom:0px;
      opacity:1;
      transition-duration:0.3s;
    }
    &_disable-bg:before {
      opacity:0;
    } */
  }

  .h1 {
    margin-bottom: 29px;
    font-size: 42px;
    line-height: 55px;
    font-weight: 500;
    &_m0 {
      margin-bottom: 0;
    }
  }

  .h2 {
    font-size: 20px;
    line-height: 25;
    margin-bottom: 7px;
  }

  .h3 {
    margin-bottom: 4px;
    font-size: 16px;
    line-height: 25px;
    font-weight: 500;
    &_m0 {
      margin-bottom:0px;
    }
  }

  .p {
    margin-bottom: 8px;
    font-size: 15px;
    line-height: 25px;
    font-weight: 400;
    &__small {
      margin-bottom: 6px;
      font-size: 13px;
      line-height: 19px;
    }
    &__limited {
      min-width: 740px;
    }
  }

  .link {
    color:#3F2AF5;
    text-decoration: none;
    &:hover {
      border-bottom: 1px solid black;
    }
  }

  .grid-layout {
    margin:0px -10px;
    display: flex;
    &__item {
      margin: 0 10px;
      flex: 1;
      &_3 {
        flex-grow: 3;
      }
      &_5 {
        flex-grow: 5;
      }
      &_7 {
        flex-grow: 7;
      }
    }
  }

  .layout {
    max-width: 1500px;
    min-height:100%;
    margin:0px auto;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    &__header {
      padding:30px 0 15px;
    }
    &__content {
      flex-grow: 1;
    }
  }

  .layout-header {
    display: flex;
    justify-content: space-between;
    &__name {
      padding-right: 30px;
    }
    &__nav {
      display: flex;
      flex-grow:1;
    }
    &__nav-item {
      padding-right: 15px;
    }
    &__contacts {
      display: flex;
    }
    &__contact-title {
      padding-right: 20px;
    }
    &__contact-item {
      padding-right: 15px;
      &:last-child {
        padding-right: 0;
      }
    }
  }

  .layout-footer {
    padding:35px 0 25px;
    color:$pale;
    font-size: 12px;
    font-style: italic;
    display:flex;
    justify-content: space-between;
  }
</style>
