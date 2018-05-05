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

export default {
  components: {
    PageScaffold,
    BrowserScaffold,
  },
};
</script>

<style>

</style>
