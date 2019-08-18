import { useEffect, useReducer, useMemo, useContext, useCallback } from 'react'

import { ApiContext } from './context'
import {
  initState,
  ACTIONS,
  axiosAll,
  getResponseData,
  isObject,
  isFunction
} from './common'

export const useApi = (
  config: ReactUseApi.Config | string,
  opt?: ReactUseApi.Options | ReactUseApi.Options['handleData']
) => {
  if (typeof config === 'string') {
    config = {
      url: config
    }
  }
  const context = useContext(ApiContext)
  const {
    settings: { cache, debug },
    isSSR,
    collection: { ssrConfigs, cacheKeys }
  } = context
  const cacheKey = JSON.stringify(config)
  const options = useMemo(() => handleUseApiOptions(opt, cacheKey), [
    opt,
    cacheKey,
    context
  ])
  const cacheData: ReactUseApi.CacheData = cache.get(cacheKey)
  const feedKey = `feed:${cacheKey}`
  let defaultState = { ...initState }
  if (cacheData) {
    const { response, error } = cacheData
    const action = {
      type: ACTIONS.REQUEST_END,
      response,
      error,
      options
    }
    debug && console.log('[ReactUseApi][Feed]', cacheKey)
    defaultState = reducer(defaultState, action)
    if (!isSSR) {
      cache.del(cacheKey)
      cache.set(feedKey, true)
    }
  } else if (isSSR) {
    if (!cacheKeys.has(cacheKey)) {
      cacheKeys.add(cacheKey)
      debug && console.log('[ReactUseApi][Collect]', cacheKey)
    }
    ssrConfigs.push({
      config,
      cacheKey
    })
  }
  let [state, dispatch] = useReducer(reducer, defaultState)
  const request = useCallback(
    async (cfg = config as ReactUseApi.Config, keepState = true) => {
      // update state's cachekey for saving the prevState when requesting (refreshing)
      if (keepState) {
        state.$cacheKey = cacheKey
      }
      return fetchApi(context, cfg, options, dispatch)
    },
    [context, cacheKey, options, dispatch, state]
  )
  const metrics = useMemo(
    () => ({
      refreshFlag: 1
    }),
    [cacheKey]
  )
  const { shouldRequest, watch } = options
  const { loading, data } = state
  if (loading && isFunction(shouldRequest) && shouldRequest() === true) {
    metrics.refreshFlag = Date.now()
  }
  useEffect(() => {
    const isFeeding = cache.get(feedKey)
    // SSR will never invoke request() due to the following cases:
    // 1. There is a cacheData for the cacheKey
    // 2. Feeding the data come from the cache
    // For non-SSR, cacheData will be undefined if cacheKey has been changed
    if (!isSSR && !cacheData && !isFeeding) {
      request()
    }
    isFeeding && cache.del(feedKey)
  }, [cacheKey, metrics.refreshFlag, ...(Array.isArray(watch) ? watch : [])])

  return [data, state, request]
}

export const reducer = (
  state: ReactUseApi.State,
  action: ReactUseApi.Action
): ReactUseApi.State => {
  const { type, options } = action
  const cacheKey = options.$cacheKey
  const basicState = {
    $cacheKey: cacheKey
  }
  switch (type) {
    case ACTIONS.REQUEST_START: {
      return {
        // reset the state to initState if the cacheKey is changed on the fly
        ...(cacheKey !== state.$cacheKey ? initState : state),
        loading: true,
        error: undefined,
        ...basicState
      }
    }
    case ACTIONS.REQUEST_END: {
      const { response, error } = action
      const { prevState: pre, ...prevState } = state
      const { data: prevData } = prevState
      const { dependencies } = options
      const newState = {
        ...prevState,
        prevData,
        prevState,
        loading: false,
        response,
        dependencies,
        error,
        ...basicState
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
  dispatch: React.Dispatch<ReactUseApi.Action>
) => {
  const {
    settings: { cache }
  } = context
  const cacheKey = options.$cacheKey
  try {
    let { response, error } =
      cache.get(cacheKey) || ({} as ReactUseApi.CacheData)
    if (response || error) {
      cache.del(cacheKey)
    } else {
      dispatch({ type: ACTIONS.REQUEST_START, options })
      response = await axiosAll(context, config)
    }
    dispatch({ type: ACTIONS.REQUEST_END, response, error, options })
  } catch (error) {
    dispatch({
      type: ACTIONS.REQUEST_END,
      error,
      options
    })
  }
}

export const handleUseApiOptions = (
  opt:
    | ReactUseApi.Options
    | ReactUseApi.Options['handleData']
    | ReactUseApi.Options['watch'],
  cacheKey: string
) => {
  const options = isObject(opt)
    ? ({ ...opt } as ReactUseApi.Options)
    : ({
        watch: Array.isArray(opt) ? opt : [],
        handleData: isFunction(opt) ? opt : undefined,
        shouldRequest: undefined,
        dependencies: undefined
      } as ReactUseApi.Options)
  options.$cacheKey = cacheKey
  return options
}

export default useApi
