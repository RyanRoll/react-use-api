import { configure, axiosAll, defaultSettings, isFunction } from './common'

export const feedRequests = async (
  context: ReactUseApi.Context,
  ssrHtml: string,
  maxRequests = context.settings.maxRequests
) => {
  const {
    settings,
    collection: { ssrConfigs, cacheKeys },
  } = context
  const { cache, renderSSR, debug } = settings
  if (!ssrConfigs.length) {
    if (debug) {
      console.log('[ReactUseApi][Requests Count] =', cacheKeys.size)
      console.log(
        '[ReactUseApi][Executed Times] =',
        settings.maxRequests - maxRequests
      )
    }
    cacheKeys.clear()
    return ssrHtml // done
  }
  debug && console.log('[ReactUseApi][Collecting Requests]')
  if (maxRequests === 0) {
    console.error(
      '[ReactUseApi][ERROR] - Maximum executing times while fetching axios requests',
      '[congis]:',
      ssrConfigs,
      '[Executed Times]:',
      settings.maxRequests - maxRequests
    )
    cacheKeys.clear()
    return ssrHtml // done
  }

  // The algorithm is collecting the unobtained API request config from the previous renderSSR()
  // , but here only fetches the API data from the first config and again uses renderSSR() to feed the data to its components.
  // This approach may look like inefficient but rather stable, since each config may rely on the data from useApi().
  // However,  it is possible that no one request config that depends on another one, only one renderSSR() is needed
  // , but who can guarantee that every developer is able to consider this dependency?
  // react-apollo uses the similar algorithm
  // https://github.com/apollographql/react-apollo/blob/master/packages/ssr/src/getDataFromTree.ts
  const { config, cacheKey } = ssrConfigs[0] // fetch the first
  const cacheData = cache.get(cacheKey)
  if (!cacheData) {
    try {
      debug && console.log('[ReactUseApi][Fetch]', cacheKey)
      const response = await axiosAll(context, config)
      cache.set(cacheKey, {
        response,
      })
    } catch (error) {
      // is an axios error
      if (error?.response?.data) {
        cache.set(cacheKey, {
          // should not be error (Error) object in SSR, it will lead an error: Converting circular structure to JSON
          error: error.response,
        })
      } else {
        throw error
      }
    }
  }
  // execute renderSSR one after another to get more ssrConfigs
  ssrConfigs.length = 0
  ssrHtml = renderSSR()
  return await feedRequests(context, ssrHtml, --maxRequests)
}

export const injectSSRHtml = async (
  context: ReactUseApi.CustomContext,
  renderSSR?: ReactUseApi.Settings['renderSSR'],
  postProcess?: (ssrHtml: string, apiCacheScript: string) => string
) => {
  context = configure(context, true)
  const { settings } = context
  settings.renderSSR = renderSSR || settings.renderSSR
  const { cache, useCacheData, clientCacheVar, shouldUseApiCache } = settings
  cache.reset()
  // collect API requests first
  let ssrHtml = settings.renderSSR()
  ssrHtml = await exports.feedRequests(context, ssrHtml)
  if (useCacheData) {
    const cacheJson = cache.dump().filter(({ k: cacheKey }) => {
      let config: ReactUseApi.Config
      try {
        config = JSON.parse(cacheKey)
      } catch (e) {
        config = {}
      }
      return shouldUseApiCache(config, cacheKey) !== false
    })
    const apiCacheScript = Object.keys(cacheJson)
      ? `<script>window.${clientCacheVar} = ${JSON.stringify(cacheJson).replace(
          /</g,
          '\\u003c'
        )}</script>`
      : ''
    return isFunction(postProcess)
      ? postProcess(ssrHtml, apiCacheScript)
      : ssrHtml + apiCacheScript
  }
  return ssrHtml
}

export const loadApiCache = (
  context: ReactUseApi.Context = { settings: defaultSettings }
) => {
  const { settings } = context
  const { clientCacheVar } = settings
  const data = window[clientCacheVar]
  if (Array.isArray(data)) {
    settings.cache.load(data)
    delete window[clientCacheVar]
  }
}
