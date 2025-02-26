<template>
  <div class="index-page">
    <carrousel
      :articles="article.data.data"
      :fetching="article.fetching"
    />
    <announcement
      :announcements="announcement.data"
      :fetching="announcement.fetching || article.fetching"
    />
    <article-list
      :mammon="false"
      :fetching="article.fetching"
      :articles="article.data.data"
      :pagination="article.data.pagination"
      @loadmore="loadmoreArticles"
    />
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, computed } from 'vue'
  import { onPrefetch, onClient } from '/@/universal'
  import { useStore, Modules, getNamespace } from '/@/store'
  import { ArticleModuleActions } from '/@/store/article'
  import { AnnouncementModuleActions } from '/@/store/announcement'
  import { nextScreen } from '/@/utils/effects'
  import Carrousel from '/@/components/archive/carrousel.vue'
  import Announcement from '/@/components/archive/announcement.vue'
  import ArticleList from '/@/components/archive/list.vue'

  export default defineComponent({
    name: 'Index',
    components: {
      Carrousel,
      Announcement,
      ArticleList
    },
    setup() {
      const store = useStore()
      const article = computed(() => store.state.article.list)
      const announcement = computed(() => store.state.announcement)

      const fetchAnnouncements = () => store.dispatch(
        getNamespace(Modules.Announcement, AnnouncementModuleActions.FetchList),
      )

      const fetchArticles = (params?: any) => store.dispatch(
        getNamespace(Modules.Article, ArticleModuleActions.FetchList),
        params
      )

      const loadmoreArticles = async () => {
        const targetPage = article.value.data.pagination?.current_page + 1
        await fetchArticles({ page: targetPage })
        if (targetPage > 1) {
          onClient(nextScreen)
        }
      }

      const fetchAllData = () => Promise.all([
        fetchArticles(),
        fetchAnnouncements()
      ])

      const resultData = {
        article,
        announcement,
        loadmoreArticles
      }

      return onPrefetch(fetchAllData, resultData)
    }
  })
</script>
