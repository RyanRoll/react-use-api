/// <reference types="react" />

import * as Axios from 'axios'

export = ReactUseApi
export as namespace ReactUseApi

declare namespace ReactUseApi {
  type Settings = typeof import('./common').defaultSettings
  type CustomSettings = Partial<Settings>
  type ACTIONS = typeof import('./common').ACTIONS
  type InitState = typeof import('./common').initState
  type SingleConfig = Axios.AxiosRequestConfig
  type MultiConfigs = SingleConfig[]
  type Config = SingleConfig | MultiConfigs
  type ApiResponse = Axios.AxiosResponse<JsonObject>
  type Data = JsonObject | JsonObject[] | undefined

  type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

  interface ApiProviderProps {
    context?: Context
  }
  interface Context {
    settings?: Settings
    ssrConfigs?: SSRConfig[]
    renderSSR?: Settings['renderSSR']
    isSSR?: boolean
    $isConfigured?: boolean
  }
  interface CustomContext extends Omit<Context, 'settings'> {
    settings?: CustomSettings
  }
  interface Options {
    watch?: any[]
    handleData?: (data: Data, newState: State) => any
    withLoading?: boolean
    shouldRequest?: () => boolean | void
    dependencies?: dependencies
    $cacheKey?: string
  }
  interface dependencies {
    readonly [key: string]: any
  }

  interface CacheData {
    response?: ApiResponse | ApiResponse[]
    error?: Axios.AxiosError
  }
  interface Action extends CacheData {
    type: string
    options?: Options
  }
  interface State extends InitState, CacheData {
    data?: Data
    prevData?: Data
    prevState?: State
    dependencies?: Options['dependencies']
  }
  interface SSRConfig {
    config: Config
    cacheKey: string
  }
  interface JsonObject {
    [key: string]: any
  }
}
