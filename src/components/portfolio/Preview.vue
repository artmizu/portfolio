<template>
  <div>
    <div class="portfolio-preview grid-layout">
      <div class="portfolio-preview__preview grid-layout__item grid-layout__item_7">
        <video class="portfolio-preview__video" :src="video"></video>
      </div>
      <div class="portfolio-preview__about grid-layout__item">
        <h3 class="h3 h3_m0">
          <a href="#" class="link">{{ title }}</a>
        </h3>
        <p class="p p__small">{{ description }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PortfolioPreview',
  props: {
    title: {
      type: String,
      required: true,
    },
    description: String,
    video: {
      type: String,
      require: true,
    },
  },
};
</script>

<style>
  .portfolio-preview {
    &__preview {
      margin-bottom: 10px;
      overflow: hidden;
      border-radius: 5px;
    }
    &__video {
      width: 100%;
      display: block;
    }
    &__about {
      margin-bottom: 4px;
    }
  }
</style>
