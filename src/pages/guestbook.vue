<template>
  <div
    class="guestbook-page"
    :class="{
      mobile: isMobile,
      dark: isDarkTheme
    }"
  >
    <div class="banner">
      <uimage cdn class="image" src="/images/page-guestbook/banner.jpg" />
      <span class="slogan">
        <span class="text">
          <i18n :lkey="LANGUAGE_KEYS.GUESTBOOK_SLOGAN" />
        </span>
      </span>
    </div>
    <div class="comment">
      <comment :post-id="0" :likes="siteLikes" />
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, computed } from 'vue'
  import { isClient } from '/@/environment'
  import { useEnhancer } from '/@/enhancer'
  import { onPrefetch } from '/@/universal'
  import { Modules, getNamespace } from '/@/store'
  import { OptionModuleActions, OptionModuleMutations } from '/@/store/option'
  import { CommentModuleActions } from '/@/store/comment'
  import { LANGUAGE_KEYS } from '/@/language/key'
  import Comment from '/@/components/comment/index.vue'

  export default defineComponent({
    name: 'Guestbook',
    components: {
      Comment
    },
    setup() {
      const { i18n, store, helmet, isMobile, isDarkTheme, isZhLang } = useEnhancer()
      const siteLikes = computed(() => {
        const appOption = store.state.option.appOption.data
        return appOption ? appOption.meta.likes : 0
      })

      helmet(() => {
        const prefix = isZhLang.value
          ? `${i18n.t(LANGUAGE_KEYS.PAGE_GUESTBOOK)} | `
          : ''
        return { title: prefix + 'Guestbook' }
      })

      const fetchAllData = () => Promise.all([
        store.dispatch(
          getNamespace(Modules.Option, OptionModuleActions.FetchAppOption),
          true
        ),
        store.dispatch(
          getNamespace(Modules.Comment, CommentModuleActions.FetchList),
          { post_id: 0, delay: isClient ? 368 : 0 }
        )
      ])

      const resultData = {
        LANGUAGE_KEYS,
        isMobile,
        isDarkTheme,
        siteLikes
      }

      return onPrefetch(fetchAllData, resultData)
    }
  })
</script>

<style lang="scss" scoped>
  @import 'src/assets/styles/init.scss';

  .guestbook-page {
    .banner {
      position: relative;
      overflow: hidden;
      margin-bottom: $lg-gap;
      width: 100%;
      height: 19rem;
      border: 0;
      background-color: $module-bg;
      @include radius-box($lg-radius);

      .image {
        margin-top: - ($gap * 6);
        transition: all $transition-time-slow;

        &:hover {
          transform: rotate(2deg) scale(1.1);
        }
      }

      .slogan {
        $size: 2em;
        display: block;
        position: absolute;
        right: $lg-gap * 2;
        bottom: $lg-gap * 2;
        height: $size;
        line-height: $size;
        padding: 0 $sm-gap;
        padding-left: 3rem;
        opacity: .8;
        font-weight: 700;
        color: $body-bg;
        cursor: progress;
        background: linear-gradient(
          to left,
          $module-bg-lighter,
          $module-bg,
          transparent
        );

        .text {
          letter-spacing: .3px;
          font-weight: bold;
          color: $text;
          background-clip: text;
          background-image: cdn-url('/images/page-guestbook/banner.jpg');
          background-position: 100% 80%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      }
    }

    &.dark {
      .banner {
        .slogan {
          .text {
            -webkit-text-fill-color: $text !important;
          }
        }
      }
    }

    &.mobile {
      .banner {
        height: 12rem;
      }
    }
  }
</style>
