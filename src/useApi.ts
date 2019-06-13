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
  config: string | ReactUseApi.Config,
  opt: ReactUseApi.Options
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
    ssrConfigs
  } = context
  const cacheKey = JSON.stringify(config)
  const options = handleUseApiOptions(opt, cacheKey, context)
  let [state, dispatch] = useReducer(reducer, initState)
  const request = useCallback(
    async (cfg = config as ReactUseApi.Config, keepState = false) => {
      // update state's cachekey for saving the prevState when requesting (refreshing)
      if (keepState) {
        state.$cacheKey = cacheKey
      }
      return fetchApi(context, cfg, options, dispatch)
    },
    [context, config, options, dispatch, state]
  )

  const cacheData: ReactUseApi.CacheData = cache.get(cacheKey)
  const feedKey = `feed:${cacheKey}`
  if (cacheData) {
    const { response, error } = cacheData
    const action = {
      type: ACTIONS.REQUEST_END,
      response,
      error,
      options
    }
    debug && console.log('[ReactUseApi][Feed]', cacheKey)
    if (isSSR) {
      state = reducer(state, action)
    } else {
      cache.del(cacheKey)
      cache.set(feedKey, true)
      dispatch(action)
    }
  } else if (isSSR) {
    debug && console.log('[ReactUseApi][Collect]', cacheKey)
    ssrConfigs.push({
      config,
      cacheKey
    })
  }
  const metrics = useMemo(
    () => ({
      refreshFlag: 1
    }),
    [cacheKey]
  )
  const { shouldRequest, watch } = options
  if (isFunction(shouldRequest) && shouldRequest() === true) {
    metrics.refreshFlag = Date.now()
  }
  useEffect(() => {
    const isFeeding = cache.get(feedKey)
    // For SSR: never invoke request() if
    // 1. There is a cacheData for the cacheKey
    // 2. Feeding the data come from the cache
    // For non-SSR: cacheData will be undefined if cacheKey has been changed
    if (!isSSR && !cacheData && !isFeeding) {
      request()
    }
    isFeeding && cache.del(feedKey)
  }, [cacheKey, metrics.refreshFlag, ...(Array.isArray(watch) ? watch : [])])

  return [state.data, state, request]
}
export const reducer = (
  state: ReactUseApi.State,
  action: ReactUseApi.Action
): ReactUseApi.State => {
  const { type, options } = action
  switch (type) {
    case ACTIONS.REQUEST_START: {
      const cacheKey = options.$cacheKey
      return {
        // reset the state to initState if the cacheKey is changed on the fly
        ...(cacheKey !== state.$cacheKey ? initState : state),
        loading: true,
        $cacheKey: cacheKey
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
        error
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
  const { withLoading } = options
  const cacheKey = options.$cacheKey
  try {
    let { response, error } =
      cache.get(cacheKey) || ({} as ReactUseApi.CacheData)
    if (response) {
      cache.del(cacheKey)
    } else {
      withLoading && dispatch({ type: ACTIONS.REQUEST_START, options })
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
  opt: ReactUseApi.Options,
  cacheKey: string,
  context: ReactUseApi.Context
) => {
  const {
    settings: { withLoading }
  } = context
  const options = isObject(opt)
    ? { withLoading, ...opt }
    : ({
        watch: Array.isArray(opt) ? opt : [],
        handleData: isFunction(opt) ? opt : undefined,
        withLoading,
        shouldRequest: undefined,
        dependencies: undefined
      } as ReactUseApi.Options)
  options.$cacheKey = cacheKey
  return options
}

export default useApi
