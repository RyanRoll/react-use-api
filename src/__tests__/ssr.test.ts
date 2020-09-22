/// <reference path="../typings.d.ts" />

import LRU from 'lru-cache'
import { configure, defaultSettings } from '../common'
import * as ssrModule from '../ssr'

jest.mock('../common', () => {
  const common = jest.requireActual('../common')
  return {
    ...common,
    axiosAll: jest.fn(),
  }
})

const { feedRequests, injectSSRHtml, loadApiCache } = ssrModule
const originalLog = console.log
const originalErrorLog = console.error

beforeEach(() => {
  jest.resetModules()
})

afterEach(() => {
  console.log = originalLog
  console.error = originalErrorLog
})

const copySettings = () => ({
  ...defaultSettings,
  cache: new LRU<string, ReactUseApi.CacheData | any>(),
  isSSR: () => true,
})
const testCache = new LRU<string, ReactUseApi.CacheData | any>()
testCache.set('foo', 'bar')
testCache.set('abc', 123)
const cacheData = testCache.dump()

describe('feedRequests tests', () => {
  const { axiosAll } = require('../common')

  it('should work as expected', async () => {
    let count = 1
    const ssrConfigs = [
      {
        config: {
          url: '/api/v1/api1',
        },
        cacheKey: 'foo',
      },
    ]
    const renderSSR = jest.fn(() => {
      if (count-- > 0) {
        // for the second time
        ssrConfigs.push({
          config: {
            url: '/api/v1/api2',
          },
          cacheKey: 'abc',
        })
      }
      return '<div>Hello World!</div>'
    })
    const context = configure({
      settings: {
        ...copySettings(),
        renderSSR,
        debug: false,
      },
    })
    const {
      settings: { cache },
      collection,
    } = context
    collection.ssrConfigs = ssrConfigs
    const response = {
      data: {
        message: 'ok',
      },
    }
    axiosAll.mockReset().mockResolvedValue(response)
    const ssrHtml = await feedRequests(context, '')
    const { cacheKeys } = collection
    expect(ssrConfigs.length).toBe(0)
    expect(cacheKeys.size).toBe(0)
    expect(ssrHtml).toBe('<div>Hello World!</div>')
    expect(cache.dump()).toEqual([
      { k: 'abc', v: { response }, e: 0 },
      { k: 'foo', v: { response }, e: 0 },
    ])
    expect(renderSSR).toHaveBeenCalledTimes(2)
  })

  it('should work as expected if error', async () => {
    const ssrConfigs = [
      {
        config: {
          url: '/api/v1/api1',
        },
        cacheKey: 'foo',
      },
    ]
    const renderSSR = jest.fn().mockReturnValue('<div>Hello World!</div>')
    const context = configure({
      settings: {
        ...copySettings(),
        renderSSR,
        debug: true,
      },
    })
    const {
      settings: { cache },
      collection,
    } = context
    collection.ssrConfigs = ssrConfigs
    const error = {
      response: {
        data: {
          message: 'fail',
        },
      },
    }
    axiosAll.mockReset().mockRejectedValue(error)
    console.log = jest.fn()
    const ssrHtml = await feedRequests(context, '')
    expect(ssrConfigs.length).toBe(0)
    expect(console.log).toHaveBeenCalledWith(
      '[ReactUseApi][Collecting Requests]'
    )
    expect(console.log).toHaveBeenCalledWith('[ReactUseApi][Fetch]', 'foo')
    expect(console.log).toHaveBeenCalledWith(
      '[ReactUseApi][Requests Count] =',
      0
    )
    expect(console.log).toHaveBeenCalledWith(
      '[ReactUseApi][Executed Times] =',
      1
    )
    expect(ssrHtml).toBe('<div>Hello World!</div>')
    expect(cache.dump()).toEqual([
      { k: 'foo', v: { error: error.response }, e: 0 },
    ])
    expect(renderSSR).toHaveBeenCalledTimes(1)
  })

  it('should work as expected if throw an error', async () => {
    const ssrConfigs = [
      {
        config: {
          url: '/api/v1/api1',
        },
        cacheKey: 'foo',
      },
    ]
    const renderSSR = jest.fn().mockReturnValue('<div>Hello World!</div>')
    const context = configure({
      settings: {
        ...copySettings(),
        renderSSR,
      },
    })
    const {
      settings: { cache },
      collection,
    } = context
    collection.ssrConfigs = ssrConfigs
    const error = {
      message: 'fail',
    }
    axiosAll.mockReset().mockRejectedValue(error)
    await expect(feedRequests(context, '')).rejects.toEqual(error)
    expect(ssrConfigs.length).toBe(1)
    expect(cache.length).toBe(0)
    expect(renderSSR).not.toHaveBeenCalled()
  })

  it('should work well with no ssr configs', async () => {
    const context = configure({
      settings: {
        ...copySettings(),
        debug: true,
      },
    })
    console.log = jest.fn()
    const {
      collection: { ssrConfigs },
    } = context
    const ssrHtml = await feedRequests(context, '')
    expect(console.log).toHaveBeenCalledWith(
      '[ReactUseApi][Executed Times] =',
      0
    )
    expect(ssrConfigs.length).toBe(0)
    expect(ssrHtml).toBe('')
  })

  it('should work as expected if ssr rendering reaches max requests number', async () => {
    const context = configure({
      settings: {
        ...copySettings(),
      },
    })
    const { collection } = context
    collection.ssrConfigs = [
      {
        config: {
          url: '/api/v1/foo/bar',
        },
        cacheKey: '',
      },
    ]
    console.error = jest.fn()
    await feedRequests(context, '', 0)
    expect(console.error.mock.calls[0][0]).toEqual(
      '[ReactUseApi][ERROR] - Maximum executing times while fetching axios requests'
    )
  })
})

describe('injectSSRHtml tests', () => {
  const html = '<div>Hello World</>'
  const feedRequests = jest
    .spyOn(ssrModule, 'feedRequests')
    .mockResolvedValue(html)

  const apiTestCache = new LRU<string, ReactUseApi.CacheData | any>()
  apiTestCache.set(JSON.stringify({ url: 'foo' }), 'bar')
  const apiTestCacheJson = JSON.stringify(apiTestCache.dump()).replace(
    /</g,
    '\\u003c'
  )

  it('should injectSSRHtml work  well with settings.renderSSR', async () => {
    const renderSSR = jest.fn().mockReturnValue(html)
    const context = configure({
      settings: {
        ...copySettings(),
        renderSSR,
      },
    })
    const { settings, isSSR } = context
    const { cache } = settings
    cache.reset = jest.fn()
    cache.set(JSON.stringify({ url: 'foo' }), 'bar')
    expect.hasAssertions()
    const ssrHtml = await injectSSRHtml(context)
    expect(isSSR).toBe(true)
    expect(renderSSR).toHaveBeenCalled()
    expect(cache.reset).toHaveBeenCalled()
    expect(feedRequests).toHaveBeenLastCalledWith(context, html)
    expect(ssrHtml).toEqual(
      `${html}<script>window.__USE_API_CACHE__ = ${apiTestCacheJson}</script>`
    )
  })

  it('should injectSSRHtml work well without the html of the api cache script', async () => {
    const renderSSR = jest.fn().mockReturnValue(html)
    const context = configure({
      settings: {
        ...copySettings(),
        renderSSR,
        useCacheData: false,
      },
    })
    const { settings } = context
    const { cache } = settings
    cache.reset = jest.fn()
    cache.dump = jest.fn()
    expect.hasAssertions()
    const ssrHtml = await injectSSRHtml(context)
    expect(renderSSR).toHaveBeenCalled()
    expect(cache.reset).toHaveBeenCalled()
    expect(feedRequests).toHaveBeenLastCalledWith(context, html)
    expect(ssrHtml).toEqual(html)
  })

  it('should injectSSRHtml work well with postProcess', async () => {
    const renderSSR = jest.fn().mockReturnValue(html)
    const context = configure({
      settings: {
        ...copySettings(),
      },
    })
    const { settings } = context
    const { cache } = settings
    cache.reset = jest.fn()
    cache.set(JSON.stringify({ url: 'foo' }), 'bar')
    expect.hasAssertions()
    let originSSRHtml = ''
    const postProcess = jest.fn((ssrHtml: string, apiCacheScript: string) => {
      originSSRHtml = ssrHtml + apiCacheScript
      return '404'
    })
    const ssrHtml = await injectSSRHtml(context, renderSSR, postProcess)
    expect(renderSSR).toHaveBeenCalled()
    expect(cache.reset).toHaveBeenCalled()
    expect(postProcess).toHaveBeenCalled()
    expect(feedRequests).toHaveBeenLastCalledWith(context, html)
    expect(originSSRHtml).toEqual(
      `${html}<script>window.__USE_API_CACHE__ = ${apiTestCacheJson}</script>`
    )
    expect(ssrHtml).toEqual('404')
  })

  it('should rule the uncached data out by shouldUseApiCache()', async () => {
    const renderSSR = jest.fn().mockReturnValue(html)
    const context = configure({
      settings: {
        ...copySettings(),
        renderSSR,
        shouldUseApiCache(config: ReactUseApi.SingleConfig, cacheKey) {
          if (
            cacheKey.includes('/no/cache') ||
            config.url.includes('/nodata')
          ) {
            return false
          }
        },
      },
    })
    const { settings } = context
    const { cache } = settings
    cache.reset = jest.fn()
    cache.set(JSON.stringify({ url: '/no/cache' }), 'no cache')
    cache.set(JSON.stringify({ url: '/nodata' }), 'no data')
    cache.set(JSON.stringify({ url: 'foo' }), 'bar')
    expect.hasAssertions()
    const ssrHtml = await injectSSRHtml(context)
    expect(renderSSR).toHaveBeenCalled()
    expect(ssrHtml).toEqual(
      `${html}<script>window.__USE_API_CACHE__ = ${apiTestCacheJson}</script>`
    )
  })
})

describe('loadApiCache tests', () => {
  it('should work well with cache data', () => {
    const { clientCacheVar, cache } = defaultSettings
    Object.assign(window, {
      [clientCacheVar]: cacheData,
    })
    loadApiCache()
    expect(cache.dump()).toEqual(cacheData)
    expect(window.hasOwnProperty(clientCacheVar)).toBe(false)
  })

  it('should nothing happen if there is no cache data', () => {
    const context = configure({
      settings: {
        ...copySettings(),
      },
    })
    const {
      settings: { clientCacheVar, cache },
    } = context
    delete window[clientCacheVar]
    loadApiCache(context)
    expect(cache.length).toBe(0)
  })
})

// TODO: an integration test
