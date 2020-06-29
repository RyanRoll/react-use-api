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
  type Data = JsonObject | JsonObject[] | undefined | any

  interface Context {
    settings?: Settings
    renderSSR?: Settings['renderSSR']
    isSSR?: boolean
    collection?: SSRCollection
    isConfigured?: boolean
  }
  interface CustomContext extends Omit<Context, 'settings'> {
    settings?: CustomSettings
  }
  interface SSRCollection {
    ssrConfigs: SSRConfigs[]
    cacheKeys: Set<string>
  }
  interface SSRConfigs {
    config: Config
    cacheKey: string
  }
  interface ApiProviderProps {
    context?: CustomContext
  }
  interface Options {
    watch?: any[]
    dependencies?: dependencies
    skip?: boolean
    $cacheKey?: string
    handleData?: (data: Data, newState: State) => any
    shouldRequest?: () => boolean | void
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
    fromCache?: boolean
  }
  interface State extends InitState, CacheData, JsonObject {
    data?: Data
    prevData?: Data
    prevState?: State
    dependencies?: Options['dependencies']
  }

  interface RefData {
    id: number
    cacheKey: string
    state: State
    config: Config
    refreshFlag: number
    isRequesting: boolean
    isInitialized: boolean
    isFeeding: boolean
    timeoutID: number
    // options: Options // debug only
  }

  interface DispatchClusterElement {
    id: number
    dispatch: React.Dispatch<Action>
    refData: RefData
  }

  interface RECORDS {
    [cacheKey: string]: {
      dispatches: DispatchClusterElement[]
      suspense?: {
        promise: Promise<DataResponse>
        done: boolean
        reference: number
      }
    } & CacheData
  }

  type MiddlewareInterrupt = () => void
  interface Middleware {
    onHandleOptions?: (
      config?: Config,
      args?: { options: Options },
      interrupt?: MiddlewareInterrupt
    ) => Options
    onStart?: (
      config?: Config,
      args?: { state: State },
      interrupt?: MiddlewareInterrupt
    ) => State
    onHandleData?: (
      config?: Config,
      args?: {
        data: Data
        response: DataResponse
      },
      interrupt?: MiddlewareInterrupt
    ) => Data
    onHandleError?: (
      config?: Config,
      args?: { error: ErrorResponse },
      interrupt?: MiddlewareInterrupt
    ) => any
    onSuccess?: (
      config?: Config,
      args?: {
        data: Data
        response: DataResponse
      },
      interrupt?: MiddlewareInterrupt
    ) => void
    onError?: (
      config?: Config,
      args?: {
        error: ErrorResponse
        response: DataResponse
      },
      interrupt?: MiddlewareInterrupt
    ) => void
    onDone: (
      config?: Config,
      args?: {
        data: Data
        error: ErrorResponse
        response: DataResponse
      },
      interrupt?: MiddlewareInterrupt
    ) => void
  }
  type Middlewares = Middleware[]

  interface JsonObject {
    [key: string]: any
  }
}
