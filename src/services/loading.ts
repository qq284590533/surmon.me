/**
 * @file 全局进度管理器
 * @module service/loading
 * @author Surmon <https://github.com/surmon-china>
 */

import { App, reactive, readonly, inject, nextTick } from 'vue'

declare global {
  interface Window {
    $loading: Loading
  }
}

export interface ILoadingOptions {
  throttle?: number
  duration?: number
}
const ILoadingSymbol = Symbol('loading')
const createLoadingStore = (options: ILoadingOptions = {}) => {
  let _cut: number
  let _timer: number
  let _throttle: number
  const state = reactive({
    percent: 0,
    show: false,
    error: null,
    canSucceed: true,
    skipTimerCount: 0,
    throttle: options.throttle || 200,
    duration: options.duration || 3000,
  })

  const clear = () => {
    window.clearInterval(_timer)
    window.clearTimeout(_throttle)
    _timer = 0
  }

  const increase = (num: number) => {
    state.percent = Math.min(100, Math.floor(state.percent + num))
  }

  const decrease = (num: number) => {
    state.percent = Math.max(0, Math.floor(state.percent - num))
  }

  const startTimer = () => {
    if (!state.show) {
      state.show = true
    }
    if (typeof _cut === 'undefined') {
      _cut = 10000 / Math.floor(state.duration)
    }

    _timer = window.setInterval(() => {
      /**
       * When reversing direction skip one timers
       * so 0, 100 are displayed for two iterations
       * also disable css width transitioning
       * which otherwise interferes and shows
       * a jojo effect
       */
      if (state.skipTimerCount > 0) {
        state.skipTimerCount--
        return
      }

      decrease(_cut)
    }, 100)
  }

  const start = () => {
    clear()
    state.percent = 0
    state.skipTimerCount = 0
    state.canSucceed = true
    state.show = true

    if (state.throttle) {
      _throttle = window.setTimeout(() => startTimer(), state.throttle)
    } else {
      startTimer()
    }
  }

  const hide = () => {
    clear()
    window.setTimeout(() => {
      state.show = false
      nextTick(() => {
        state.percent = 0
      })
    }, 500)
  }

  const set = (num: number) => {
    state.show = true
    state.canSucceed = true
    state.percent = Math.min(100, Math.max(0, Math.floor(num)))
  }

  const pause = () => {
    window.clearInterval(_timer)
  }

  const resume = () => {
    startTimer()
  }

  const finish = () => {
    state.error = null
    state.percent = 100
    hide()
  }

  const fail = (error?: any) => {
    state.error = error
    state.canSucceed = false
  }

  return {
    state: readonly(state),
    start,
    pause,
    resume,
    finish,
    fail,
    increase,
    decrease,
    set
  }
}

export type Loading = ReturnType<typeof createLoadingStore>
export const createLoading = (options?: ILoadingOptions) => {
  const loading = createLoadingStore(options)
  return {
    ...loading,
    install(app: App, config?: { exportToGlobal?: boolean }) {
      app.provide(ILoadingSymbol, loading)
      app.config.globalProperties.$loading = loading
      if (config?.exportToGlobal) {
        window.$loading = loading
      }
    }
  }
}

export const useLoading = (): Loading => {
  return inject(ILoadingSymbol) as Loading
}
