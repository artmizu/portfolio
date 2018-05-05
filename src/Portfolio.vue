<template>
  <div>
    <div class="about-me">
      <div class="about-me__content">
        <h1 class="h1 about-me__title">Дизайн и клиентская разработка</h1>
        <div class="about-me__text">
          <div class="about-me__text-block">
            <h3 class="h3">Дизайн</h3>
            <p class="p">
              Проектирую интерфейсы от простых промо-страниц до сложных CRM систем. Занимаюсь
              сопровождением макетов после их создания: напишу дизайн-спецификацию, проверю
              соответствие верстки макетам.
            </p>
            <p class="p">
              Общаюсь с разработчиками на их языке, вникаю
              в проблемы связанные с переносом дизайна в реальное окружение.
            </p>
          </div>
          <div class="about-me__text-block">
            <h3 class="h3">Верстка и Front-End</h3>
            <p class="p">
              Разрабатываю клиентскую часть: помогу выяснить почему верстка развалилась,
              сверстаю всё с нуля или напишу клиентскую часть
              на <span class="about-me__vue-link">Vue</span>.
            </p>
          </div>
          <div class="about-me__text-block">
            <h3 class="h3">Разработка игр</h3>
            <p class="p">
              Интересуюсь разработкой игр: структурой игровых движков, математикой стоящей
              за их работой и программированием на C#.
            </p>
          </div>
        </div>
      </div>
      <div class="about-me__masterpiece-wrapper">
        <div class="about-me__masterpiece"></div>
      </div>
    </div>
    <div class="portfolio-preview-grid">
      <PortfolioPreview
        class="portfolio-preview-grid__item"
        title="Samo-crm"
        description="Управление бизнес-процессами внутри туристической кампания"
        video="/static/portfolio/samo/preview.mp4"
      ></PortfolioPreview>
      <PortfolioPreview
        class="portfolio-preview-grid__item"
        title="Samo-crm"
        description="Управление бизнес-процессами внутри туристической кампания"
        video="/static/portfolio/samo/preview.mp4"
      ></PortfolioPreview>
      <PortfolioPreview
        class="portfolio-preview-grid__item"
        title="Samo-crm"
        description="Управление бизнес-процессами внутри туристической кампания"
        video="/static/portfolio/samo/preview.mp4"
      ></PortfolioPreview>
      <PortfolioPreview
        class="portfolio-preview-grid__item"
        title="Samo-crm"
        description="Управление бизнес-процессами внутри туристической кампания"
        video="/static/portfolio/samo/preview.mp4"
      ></PortfolioPreview>
      <PortfolioPreview
        class="portfolio-preview-grid__item"
        title="Samo-crm"
        description="Управление бизнес-процессами внутри туристической кампания"
        video="/static/portfolio/samo/preview.mp4"
      ></PortfolioPreview>
      <PortfolioPreview
        class="portfolio-preview-grid__item"
        title="Samo-crm"
        description="Управление бизнес-процессами внутри туристической кампания"
        video="/static/portfolio/samo/preview.mp4"
      ></PortfolioPreview>
      <PortfolioPreview
        class="portfolio-preview-grid__item"
        title="Samo-crm"
        description="Управление бизнес-процессами внутри туристической кампания"
        video="/static/portfolio/samo/preview.mp4"
      ></PortfolioPreview>
    </div>
  </div>
</template>

<script>
import PortfolioPreview from './components/portfolio/Preview';

export default {
  name: 'Portfolio',
  components: { PortfolioPreview },
};
</script>

<style>
  .about-me {
    padding-top: 26px;
    border-bottom: 1px solid #DFD8F4;
    display:flex;
    justify-content: space-between;
    &__content {
      width: 60%;
      padding-bottom: 31px;
    }
    &__masterpiece-wrapper {
      width: 600px;
      position: relative;
    }
    &__masterpiece {
      width: 600px;
      height: 477px;
      background-image:url(./assets/ukiyo.png);
      position: absolute;
      bottom: -21px;
      right: -12px;
    }
    &__title {
      max-width: 500px;
    }
    &__text-block {
      width: 50%;
      padding: 0 50px 8px 0;
      float:left;
    }
    &__vue-link {
      font-style:italic;
      display: inline-block;
      &:before {
        content:"";
        width: 22px;
        height: 19px;
        margin-right: 2px;
        background-image: url(./assets/vue-logo.png);
        background-size: 22px;
        display:inline-block;
        vertical-align: middle;
        position:relative;
        top:-2px;
      }
    }
  }

  .portfolio-preview-grid {
    margin: 0px -10px;
    padding-top: 32px;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    &__item {
      padding:0px 10px 20px;
      &:last-child {
        padding-bottom: 0;
      }
    }
    &__item:nth-child(6n+4) .portfolio-preview__preview {
      order: 2;
    }
    &__item:nth-child(3n+2) .portfolio-preview, &__item:nth-child(3n+3) .portfolio-preview {
      flex-direction: column;
    }
    &__item:nth-child(6n+2), &__item:nth-child(6n+6) {
      width: calc(100% * 0.375);
    }
    &__item:nth-child(6n+3), &__item:nth-child(6n+5) {
      width: calc(100% * 0.625);
    }
  }
</style>
