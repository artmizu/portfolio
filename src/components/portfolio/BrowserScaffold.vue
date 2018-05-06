<template lang="html">
<div class="browser-scaffold">
  <div class="browser-scaffold__navbar" :style="primaryStyle">
    <div class="browser-scaffold__dots">
      <div class="browser-scaffold__dot" :style="secondaryStyle"></div>
      <div class="browser-scaffold__dot" :style="secondaryStyle"></div>
      <div class="browser-scaffold__dot" :style="secondaryStyle"></div>
    </div>
    <div class="browser-scaffold__url" :style="secondaryStyle"></div>
  </div>
  <div class="browser-scaffold__page" :style="{ borderColor: primary }">
    <img :src="img" class="browser-scaffold__img">
  </div>
</div>
</template>

<script>
export default {
  props: {
    primary: {
      type: String,
      required: true,
    },
    secondary: {
      type: String,
      required: true
    },
    img: String
  },
  data() {
    return {
      primaryStyle: {
        backgroundColor: this.primary,
      },
      secondaryStyle: {
        backgroundColor: this.secondary,
      },
    };
  },
}
</script>

<style>
.browser-scaffold {
  &__navbar {
    height: 38px;
    padding:9px 10px 7px 10px;
    border-radius: 5px 5px 0 0;
    display: flex;
  }
  &__dots {
    padding: 5px 7px 0 5px;
    display: flex;
    justify-content: flex-start;
  }
  &__dot {
    width: 13px;
    height: 13px;
    margin-right: 6px;
    border-radius: 100%;
    flex:1;
  }
  &__url {
    height: 22px;
    border-radius: 2px;
    flex-grow:1;
  }
  &__page {
    border-width: 1px;
    border-style: solid;
    border-radius: 0 0 5px 5px;
    overflow: hidden;
  }
  &__img {
    width: 100%;
    display:block;
  }
}
</style>
