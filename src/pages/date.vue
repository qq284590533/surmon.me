<template>
  <div class="date-archive-page">
    <article-list-header
      :background-color="null"
      :background-image="null"
      icon="icon-clock"
    >
      <i18n
        :zh="`发布于 ${date} 的所有文章`"
        :en="`${date} articles`"
      />
    </article-list-header>
    <article-list
      :fetching="article.fetching"
      :articles="article.data.data"
      :pagination="article.data.pagination"
      @loadmore="loadmoreArticles"
    />
  </div>
</template>

<script lang="ts">
  import { defineComponent, computed, watch, onBeforeMount } from 'vue'
  import { onPrefetch, onClient } from '/@/universal'
  import { useEnhancer } from '/@/enhancer'
  import { Modules, getNamespace } from '/@/store'
  import { ArticleModuleActions } from '/@/store/article'
  import { nextScreen, scrollToTop } from '/@/utils/effects'
  import { LANGUAGE_KEYS } from '/@/language/key'
  import ArticleListHeader from '/@/components/archive/header.vue'
  import ArticleList from '/@/components/archive/list.vue'

  export default defineComponent({
    name: 'DatePage',
    components: {
      ArticleListHeader,
      ArticleList
    },
    props: {
      date: {
        type: String,
        required: true
      }
    },
    setup(props) {
      const { i18n, store, helmet } = useEnhancer()
      const isVaildDate = (date: string) => {
        const dates = date.split('-')
        // x-x-x
        if (dates.length !== 3) {
          return false
        }
        // 0-0-0
        if (!dates.every(d => Number.isInteger(Number(d)))) {
          return false
        }
        // 0000-00-00
        const [year, month, day] = dates
        if (
          year.length !== 4 ||
          month.length !== 2 ||
          day.length !== 2
        ) {
          return false
        }
        return true
      }
      if (!props.date || !isVaildDate(props.date)) {
        return Promise.reject({
          code: 500,
          message: i18n.t(LANGUAGE_KEYS.QUERY_PARAMS_ERROR)
        })
      }

      const article = computed(() => store.state.article.list)
      const fetchArticles = (params: any) => {
        onClient(scrollToTop)
        return store.dispatch(
          getNamespace(Modules.Article, ArticleModuleActions.FetchList),
          params
        )
      }

      const loadmoreArticles = () => {
        return fetchArticles({
          date: props.date,
          page: article.value.data.pagination.current_page + 1
        }).then(nextScreen)
      }

      onBeforeMount(() => {
        watch(
          () => props.date,
          (date) => fetchArticles({ date }),
          { flush: 'post' }
        )
      })

      return onPrefetch(
        () => fetchArticles({ date: props.date }),
        {
          article,
          loadmoreArticles
        }
      )
    }
  })
</script>
