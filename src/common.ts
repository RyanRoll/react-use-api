import axios, { AxiosStatic, AxiosInstance, AxiosError } from 'axios'
import LRU from 'lru-cache'

// export const cacheKeySymbol: unique symbol = Symbol('cacheKey') TS still not friendly to symbol...
export const defaultSettings = {
  cache: new LRU<string, ReactUseApi.CacheData | any>(),
  axios: axios as AxiosStatic | AxiosInstance,
  clientCacheVar: '__USE_API_CACHE__',
  maxRequests: 50,
  withLoading: true,
  deleteAfterLoading: true,
  renderSSR: (() => '') as Function,
  isSSR: (() => typeof window === 'undefined') as Function,
  debug: false
}
export const ACTIONS = {
  REQUEST_START: 'REQUEST_START',
  REQUEST_END: 'REQUEST_END'
}
export const initState = {
  loading: false,
  $cacheKey: ''
}

export const configure = (context: ReactUseApi.CustomContext) => {
  if (context.$isConfigured) {
    return context as ReactUseApi.Context
  }
  const { settings: custom } = context
  const settings = { ...defaultSettings }
  if (isObject(custom)) {
    Object.keys(custom).forEach((key: keyof ReactUseApi.Settings) => {
      const value = custom[key]
      if (defaultSettings.hasOwnProperty(key) && !isNil(value)) {
        // @ts-ignore
        settings[key] = value
      }
    })
  }
  Object.assign(context, {
    settings,
    ssrConfigs: [],
    isSSR: isFunction(settings.isSSR) ? !!settings.isSSR() : false,
    $isConfigured: true
  })
  return context as ReactUseApi.Context
}

export async function axiosAll(
  context: ReactUseApi.Context,
  config: ReactUseApi.Config
): Promise<ReactUseApi.ApiResponse>
export async function axiosAll(
  context: ReactUseApi.Context,
  config: ReactUseApi.MultiConfigs
): Promise<ReactUseApi.ApiResponse[]>
export async function axiosAll(
  context: ReactUseApi.Context,
  config: ReactUseApi.Config | ReactUseApi.MultiConfigs
): Promise<ReactUseApi.ApiResponse | ReactUseApi.ApiResponse[]> {
  const {
    settings: { axios }
  } = context
  const isMulti = Array.isArray(config)
  const requests = ((isMulti
    ? config
    : [config]) as ReactUseApi.MultiConfigs).map(cfg => axios(cfg))
  try {
    const responses = await Promise.all<ReactUseApi.ApiResponse>(requests)
    responses.forEach(tidyResponse)
    const response = responses.length === 1 ? responses[0] : responses
    return response
  } catch (error) {
    const { response } = error as ReactUseApi.CacheData['error']
    if (response) {
      tidyResponse(response)
      throw error as AxiosError
    }
    throw error
  }
}

// for cache
export const tidyResponse = (response: ReactUseApi.ApiResponse) => {
  if (response) {
    delete response.config
    delete response.request
  }
  return response
}

export const getResponseData = (
  options: ReactUseApi.Options,
  state: ReactUseApi.State
) => {
  const { response } = state
  const isMultiApis = Array.isArray(response)
  let data = isMultiApis
    ? (response as ReactUseApi.ApiResponse[]).map(each => each.data)
    : (response as ReactUseApi.ApiResponse).data
  const { handleData } = options
  if (isFunction(handleData)) {
    data = handleData(data, state)
  }
  return data
}

export const isObject = (target: any) =>
  !!target && Object.prototype.toString.call(target) === '[object Object]'

export const isFunction = (target: any) =>
  !!target && typeof target === 'function'

export const isNil = (value: any) =>
  value === undefined || value === null || value === ''
