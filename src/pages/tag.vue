<template>
  <div class="tag-archive-page">
    <article-list-header
      :background-color="currentTagColor"
      :background-image="currentTagImage"
      :icon="currentTagIcon"
    >
      <i18n :zh="currentTag.name" :en="currentTag.slug" />
      <span class="delimiter">-</span>
      <span>{{ currentTag.description || '...' }}</span>
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
  import { isSSR } from '/@/environment'
  import { useEnhancer } from '/@/enhancer'
  import { Modules, getNamespace } from '/@/store'
  import { ArticleModuleActions } from '/@/store/article'
  import { TagModuleActions } from '/@/store/tag'
  import { getExtendsValue } from '/@/transforms/state'
  import { nextScreen, scrollToTop } from '/@/utils/effects'
  import { LANGUAGE_KEYS } from '/@/language/key'
  import ArticleListHeader from '/@/components/archive/header.vue'
  import ArticleList from '/@/components/archive/list.vue'

  export default defineComponent({
    name: 'TagPage',
    components: {
      ArticleListHeader,
      ArticleList
    },
    props: {
      tagSlug: {
        type: String,
        required: true
      }
    },
    setup(props) {
      const { store, i18n, helmet, isZhLang } = useEnhancer()
      // slug 是否为空
      if (!props.tagSlug) {
        return Promise.reject({
          code: 500,
          message: i18n.t(LANGUAGE_KEYS.QUERY_PARAMS_ERROR)
        })
      }

      const currentTag = computed(() => store.state.tag.data.find(
        tag => tag.slug === props.tagSlug
      ))
      if (isSSR && !currentTag.value) {
        return Promise.reject({ code: 404 })
      }

      // helmet
      helmet(() => {
        const slug = props.tagSlug
        const slugTitle = slug
          .toLowerCase()
          .replace(/( |^)[a-z]/g, L => L.toUpperCase())
        const enTitle = `${slugTitle} | Tag`
        const zhTitle = currentTag.value?.name
        const title = `${isZhLang.value && zhTitle ? zhTitle : enTitle} | Tag`
        const description = currentTag.value?.description || title
        return { title, description}
      })

      const article = computed(() => store.state.article.list)
      const currentTagIcon = computed(() => getExtendsValue(currentTag.value, 'icon') || 'icon-tag')
      const currentTagImage = computed(() => getExtendsValue(currentTag.value, 'background'))
      const currentTagColor = computed(() => getExtendsValue(currentTag.value, 'bgcolor'))

      const fetchTags = () => store.dispatch(
        getNamespace(Modules.Tag, TagModuleActions.FetchAll)
      )

      const fetchArticles = (params: any) => {
        return store.dispatch(
          getNamespace(Modules.Article, ArticleModuleActions.FetchList),
          params
        )
      }

      const loadmoreArticles = async () => {
        await fetchArticles({
          tag_slug: props.tagSlug,
          page: article.value.data.pagination.current_page + 1
        })
        onClient(nextScreen)
      }

      const fetchAllData = (tag_slug: string) => {
        onClient(scrollToTop)
        return Promise.all([
          fetchTags(),
          fetchArticles({ tag_slug })
        ])
      }

      onBeforeMount(() => {
        watch(
          () => props.tagSlug,
          tagSlug => fetchAllData(tagSlug),
          { flush: 'post' }
        )
      })

      const resultData = {
        article,
        currentTag,
        currentTagIcon,
        currentTagImage,
        currentTagColor,
        loadmoreArticles,
      }

      return onPrefetch(() => fetchAllData(props.tagSlug), resultData)
    }
  })
</script>

<style lang="scss" scoped>
  @import 'src/assets/styles/init.scss';

  .delimiter {
    margin: 0 $sm-gap;
  }
</style>
