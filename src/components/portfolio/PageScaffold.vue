<template>
  <div class="portfolio-page">
    <div class="portfolio-page__intro">
      <div class="portfolio-page__title">
        <h1 class="h1 h1_m0">{{ title }}</h1>
        <div class="p p_small">
          {{ category }}
          <template v-if="url">
            , <a v-if="url" :href="url" class="link">{{ url }}</a>
          </template>
        </div>
      </div>
      <div class="portfolio-page__description">
        <p class="p">
          {{ description }}
        </p>
      </div>
    </div>
    <div class="portfolio-page__content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    url: String,
  },
};
</script>

<style>
  .portfolio-page {
    &__intro {
      padding-top: 22px;
      display: flex;
      justify-content: space-between;
    }
    &__title, &__description {
      flex:1;
    }
    &__content {
      padding-top: 40px;
    }
  }
</style>
