import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useMemo,
  useContext,
  useCallback,
  useRef,
} from 'react'

import { ApiContext } from './context'
import {
  initState,
  ACTIONS,
  axiosAll,
  getResponseData,
  isObject,
  isFunction,
} from './common'

export function useApi<D = ReactUseApi.SingleData>(
  config: ReactUseApi.SingleConfig | string,
  opt?: ReactUseApi.Options | ReactUseApi.Options['handleData']
): [D, ReactUseApi.State, ReactUseApi.RequestFn]
export function useApi<D = ReactUseApi.SingleData[]>(
  config: ReactUseApi.MultiConfigs,
  opt?: ReactUseApi.Options | ReactUseApi.Options['handleData']
): [D, ReactUseApi.State, ReactUseApi.RequestFn]
export function useApi<D = ReactUseApi.Data>(
  config: ReactUseApi.Config | string,
  opt?: ReactUseApi.Options | ReactUseApi.Options['handleData']
): [D, ReactUseApi.State, ReactUseApi.RequestFn] {
  if (typeof config === 'string') {
    config = {
      url: config,
    }
  }
  const context = useContext(ApiContext)
  const {
    settings,
    settings: { cache, debug, clearLastCacheWhenConfigChanges },
    isSSR,
    collection: { ssrConfigs, cacheKeys },
  } = context
  const cacheKey = JSON.stringify(config)
  const ref = useRef(
    useMemo(
      () =>
        ({
          id: Date.now(),
          isRequesting: false,
          isInit: false,
          hasFed: false,
          refreshFlag: 1,
          cacheKey,
          config,
        } as ReactUseApi.RefData),
      []
    )
  )
  const options = useMemo(
    () => handleUseApiOptions(opt, settings, config, cacheKey),
    [opt, settings, cacheKey]
  )
  const { current: refData } = ref
  const isValidConfig = verifyConfig(config)
  const hasChangedConfig = refData.cacheKey !== cacheKey
  options.$hasChangedConfig = hasChangedConfig
  if (hasChangedConfig) {
    if (clearLastCacheWhenConfigChanges) {
      cache.del(refData.cacheKey)
    }
    refData.cacheKey = cacheKey
    refData.config = config
    refData.hasFed = false
  }

  // SSR processing
  const cacheData: ReactUseApi.CacheData = cache.get(cacheKey)
  const { skip, useCache } = options
  let defaultState = { ...initState }

  if (!skip && !refData.isInit) {
    if (cacheData && !refData.hasFed && (isSSR || useCache !== false)) {
      const { response, error } = cacheData
      const action = {
        type: ACTIONS.REQUEST_END,
        response,
        error,
        options,
      } as ReactUseApi.Action
      debug && console.log('[ReactUseApi][Feed]', cacheKey)
      if (!isSSR) {
        action.fromCache = true
        refData.hasFed = true
      }
      defaultState = reducer(defaultState, action)
    } else if (isSSR) {
      if (!cacheKeys.has(cacheKey)) {
        cacheKeys.add(cacheKey)
        debug && console.log('[ReactUseApi][Collect]', cacheKey)
      }
      ssrConfigs.push({
        config,
        cacheKey,
      })
    }
  }

  refData.isInit = true

  const [state, dispatch] = useReducer(reducer, defaultState)
  const { shouldRequest, watch } = options
  const { loading, data } = state

  const request = useCallback(
    async (
      cfg = refData.config as ReactUseApi.Config,
      keepState = false,
      revalidate = true
    ) => {
      if (options.skip) {
        return null
      }
      // foolproof
      if (
        (cfg as React.MouseEvent)?.target &&
        (cfg as React.MouseEvent)?.isDefaultPrevented
      ) {
        cfg = refData.config
      }
      // update state's cachekey for saving the prevState when requesting (refreshing)
      // it's good to set true for pagination
      if (keepState) {
        state.$cacheKey = cacheKey
      }
      refData.isRequesting = true
      return fetchApi(context, cfg, options, dispatch, revalidate)
    },
    [context, cacheKey, options, dispatch, state, refData]
  )

  const shouldFetchApi = useCallback(
    (forRerender = false) => {
      let shouldRequestResult: boolean
      if (isFunction(shouldRequest)) {
        shouldRequestResult = !!shouldRequest() as boolean
      }
      return (
        !skip &&
        !refData.isRequesting &&
        ((forRerender
          ? shouldRequestResult === true
          : // false means skip
            shouldRequestResult !== false) ||
          hasChangedConfig)
      )
    },
    [skip, refData, shouldRequest, hasChangedConfig]
  )

  // for each re-rendering
  if (shouldFetchApi(true)) {
    refData.refreshFlag = Date.now()
  }

  if (!loading && refData.isRequesting) {
    refData.isRequesting = false
  }

  const useIsomorphicLayoutEffect = isSSR ? useEffect : useLayoutEffect
  const effect: typeof useIsomorphicLayoutEffect = useCallback(
    (callback, ...args) => {
      const wrapper = () => {
        if (isValidConfig) {
          return callback()
        }
      }
      return useIsomorphicLayoutEffect(wrapper, ...args)
    },
    [isValidConfig]
  )
  effect(() => {
    // SSR will never invoke request() due to the following cases:
    // 1. There is a cacheData for the cacheKey
    // 2. Feeding the data come from the cache (using defaultState)
    // 3. Calling API forcibly due to useCache=false
    // For non-SSR, cacheData will be undefined if cacheKey has been changed

    if (!isSSR && !refData.hasFed) {
      request(undefined, undefined, false)
    }
  }, [
    cacheKey,
    useCache,
    refData,
    refData.refreshFlag,
    ...(Array.isArray(watch) ? watch : []),
  ])

  if (!isValidConfig) {
    return [undefined, undefined, undefined]
  }
  return [data, state, request]
}

export const reducer = (
  state: ReactUseApi.State,
  action: ReactUseApi.Action
): ReactUseApi.State => {
  const { type, options } = action
  const cacheKey = options.$cacheKey
  const basicState = {
    $cacheKey: cacheKey,
  }
  switch (type) {
    case ACTIONS.REQUEST_START: {
      return {
        // reset the state to initState if the cacheKey is changed on the fly
        ...(cacheKey !== state.$cacheKey ? initState : state),
        loading: true,
        error: undefined,
        fromCache: false,
        ...basicState,
      }
    }
    case ACTIONS.REQUEST_END: {
      const { response, error, fromCache } = action
      const { prevState: pre, ...prevState } = state
      const { data: prevData } = prevState
      const { dependencies, $hasChangedConfig } = options
      const newState = {
        ...prevState,
        prevData,
        prevState,
        loading: false,
        response,
        dependencies,
        error,
        fromCache: !!fromCache,
        ...basicState,
      }
      if ($hasChangedConfig) {
        delete newState.prevState
        delete newState.prevData
      }
      newState.data = error ? undefined : getResponseData(options, newState)
      return newState
    }
    default:
      return state
  }
}

export const fetchApi = async (
  context: ReactUseApi.Context,
  config: ReactUseApi.Config,
  options: ReactUseApi.Options,
  dispatch: React.Dispatch<ReactUseApi.Action>,
  revalidate = false
) => {
  const {
    settings: { cache },
  } = context
  const { $cacheKey: cacheKey, useCache } = options
  const promiseKey = `${cacheKey}::promise`
  let { response, error } = {} as ReactUseApi.CacheData
  try {
    const cacheData = cache.get(cacheKey)
    let promise = cache.get(promiseKey)
    response = cacheData?.response
    error = cacheData?.error
    let fromCache = !revalidate
    if (revalidate) {
      dispatch({ type: ACTIONS.REQUEST_START, options })
      response = await axiosAll(context, config)
    } else if (useCache !== false && promise) {
      dispatch({ type: ACTIONS.REQUEST_START, options })
      response = await promise
    } else if (useCache !== false && (response || error)) {
      // skip ACTIONS.REQUEST_START
    } else if (useCache) {
      dispatch({ type: ACTIONS.REQUEST_START, options })
      promise = axiosAll(context, config)
      // save promise for next coming hooks
      cache.set(promiseKey, promise)
      response = await promise
    } else {
      fromCache = false
      dispatch({ type: ACTIONS.REQUEST_START, options })
      response = await axiosAll(context, config)
    }
    dispatch({ type: ACTIONS.REQUEST_END, response, error, options, fromCache })
  } catch (err) {
    error = err
    dispatch({
      type: ACTIONS.REQUEST_END,
      error,
      options,
    })
  } finally {
    // save the data if there is no cache data come from server
    if (useCache) {
      if (!cache.has(cacheKey)) {
        cache.set(cacheKey, {
          response,
          error,
        })
      }
      if (cache.has(promiseKey)) {
        cache.del(promiseKey)
      }
    }
  }
}

export const handleUseApiOptions = (
  opt:
    | ReactUseApi.Options
    | ReactUseApi.Options['handleData']
    | ReactUseApi.Options['watch'],
  settings: ReactUseApi.Settings,
  config: ReactUseApi.Config | string,
  cacheKey: string
) => {
  const options = isObject(opt)
    ? ({ ...opt } as ReactUseApi.Options)
    : ({
        watch: Array.isArray(opt) ? opt : [],
        handleData: isFunction(opt) ? opt : undefined,
      } as ReactUseApi.Options)

  options.$cacheKey = cacheKey
  const { alwaysUseCache, shouldUseApiCache } = settings
  const globalUseCache =
    shouldUseApiCache(config as ReactUseApi.Config, cacheKey) !== false
  if (alwaysUseCache) {
    options.useCache = true
  } else if (globalUseCache === false) {
    options.useCache = false
  }
  return options
}

export const verifyConfig = (config: ReactUseApi.Config) => {
  return isObject(config)
    ? !!(config as ReactUseApi.SingleConfig).url
    : Array.isArray(config)
    ? config.every((each) => !!each.url)
    : false
}

export default useApi
