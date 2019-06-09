import { axiosAll } from './common'

export const feedRequests = async (
  context: ReactUseApi.Context,
  ssrHtml: string,
  maxRequests = context.settings.maxRequests
) => {
  const { settings, ssrConfigs } = context
  const { cache, renderSSR, debug } = settings
  const currentConfigs = ssrConfigs
  ssrConfigs.length = 0
  if (!currentConfigs.length) {
    debug &&
      console.log(
        '[ReactUseApi][Executed times] =',
        settings.maxRequests - maxRequests
      )
    return ssrHtml // done
  }
  if (maxRequests === 0) {
    throw new Error('Maximum executing times while fetching axios requests')
  }
  const { config, cacheKey } = currentConfigs[0] // fetch the first
  const cacheData = cache.get(cacheKey)
  if (!cacheData) {
    try {
      debug && console.log('[ReactUseApi][Fetch]', cacheKey)
      const response = await axiosAll(context, config)
      cache.set(cacheKey, {
        response
      })
    } catch (error) {
      // is an axios error
      if (error.response && error.response.data) {
        cache.set(cacheKey, {
          error
        })
      } else {
        throw error
      }
    }
  }
  // execute renderSSR one after another to get more ssrConfigs
  ssrHtml = renderSSR()
  return await feedRequests(context, ssrHtml, --maxRequests)
}

export const injectSSRHtml = async (
  context: ReactUseApi.Context,
  renderSSR?: ReactUseApi.Settings['renderSSR']
) => {
  // collect axios calls first
  const { settings } = context
  settings.renderSSR = renderSSR || settings.renderSSR
  const { cache, clientCacheVar } = settings
  cache.reset()
  let ssrHtml = settings.renderSSR()
  ssrHtml = await (exports.feedRequests || feedRequests)(context, ssrHtml)
  const cacheJson = cache.dump()
  const axiosHooksScript = `<script>window.${clientCacheVar} = ${JSON.stringify(
    cacheJson
  ).replace(/</g, '\\u003c')}</script>`
  return ssrHtml + axiosHooksScript
}

export const loadApiCache = (context: ReactUseApi.Context) => {
  const { settings } = context
  const { clientCacheVar, deleteAfterLoading } = settings
  const data = window[clientCacheVar]
  if (Array.isArray(data)) {
    settings.cache.load(data)
    if (deleteAfterLoading) {
      delete window[clientCacheVar]
    }
  }
}
