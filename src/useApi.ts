import {
  useEffect,
  useReducer,
  useMemo,
  useContext,
  useCallback,
  useRef
} from 'react'
import invariant from 'invariant'

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
  const rawConfig = config
  if (typeof config === 'string') {
    config = {
      url: config
    }
  }
  invariant(verifyConfig(config), `API config "${rawConfig}" is invalid.`)
  const context = useContext(ApiContext)
  const {
    settings: { cache, debug, shouldUseApiCache },
    isSSR,
    collection: { ssrConfigs, cacheKeys }
  } = context
  const cacheKey = JSON.stringify(config)
  const options = useMemo(() => handleUseApiOptions(opt, cacheKey), [
    opt,
    cacheKey
  ])
  const ref = useRef({
    isRequesting: false,
    isFeeding: false,
    refreshFlag: 1
  })
  const { current: refData } = ref
  const cacheData: ReactUseApi.CacheData = cache.get(cacheKey)
  let defaultState = { ...initState }
  if (cacheData && (isSSR || !!shouldUseApiCache(config, cacheKey))) {
    const { response, error } = cacheData
    const action = {
      type: ACTIONS.REQUEST_END,
      response,
      error,
      options
    } as ReactUseApi.Action
    debug && console.log('[ReactUseApi][Feed]', cacheKey)
    if (!isSSR) {
      action.fromCache = true
      refData.isFeeding = true
    }
    defaultState = reducer(defaultState, action)
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
  const [state, dispatch] = useReducer(reducer, defaultState)

  const request = useCallback(
    async (cfg = config as ReactUseApi.Config, keepState = false) => {
      // update state's cachekey for saving the prevState when requesting (refreshing)
      // it's good to set true for pagination
      if (keepState) {
        state.$cacheKey = cacheKey
      }
      refData.isRequesting = true
      return fetchApi(context, cfg, options, dispatch)
    },
    [context, cacheKey, options, dispatch, state, refData]
  )
  const { shouldRequest, watch } = options
  // for each re-rendering
  if (
    !refData.isRequesting &&
    isFunction(shouldRequest) &&
    shouldRequest() === true
  ) {
    refData.refreshFlag = Date.now()
  }
  const { loading, data } = state
  if (!loading && refData.isRequesting) {
    refData.isRequesting = false
  }
  useEffect(() => {
    // SSR will never invoke request() due to the following cases:
    // 1. There is a cacheData for the cacheKey
    // 2. Feeding the data come from the cache
    // For non-SSR, cacheData will be undefined if cacheKey has been changed
    if (!isSSR && !cacheData && !refData.isFeeding) {
      request()
    }
    if (refData.isFeeding) {
      refData.isFeeding = false
    }
  }, [cacheKey, refData.refreshFlag, ...(Array.isArray(watch) ? watch : [])])

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
        fromCache: false,
        ...basicState
      }
    }
    case ACTIONS.REQUEST_END: {
      const { response, error, fromCache } = action
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
        fromCache: !!fromCache,
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

export const verifyConfig = (config: ReactUseApi.Config) => {
  return isObject(config)
    ? !!(config as ReactUseApi.SingleConfig).url
    : Array.isArray(config)
    ? config.every(each => !!each.url)
    : false
}

export default useApi
