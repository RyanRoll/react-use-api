/// <reference path="../typings.d.ts" />

import React, { useState } from 'react'
import LRU from 'lru-cache'
import { renderHook, act } from '@testing-library/react-hooks'
import MockAdapter from 'axios-mock-adapter'
import axios from 'axios'

import { ApiProvider } from '../ApiProvider'
import { useApi, reducer, fetchApi, handleUseApiOptions } from '../useApi'
import { ACTIONS, initState } from '../common'

const mock = new MockAdapter(axios)
const originalLog = console.log

beforeEach(() => {
  jest.resetModules()
  mock.reset()
})

afterEach(() => {
  console.log = originalLog
})

describe('useApi tests', () => {
  const url = '/api/v1/foo/bar'
  const apiData = {
    foo: {
      bar: true
    }
  }
  const listUrl = '/api/v1/list'
  const listData = [
    {
      foo: 'bar'
    },
    {
      abc: 123
    }
  ]
  const errorUrl = '/api/v1/500'
  const errorData = {
    msg: '500 Server Error'
  }
  beforeEach(() => {
    mock.onGet(url).reply(200, apiData)
    mock.onGet(listUrl).reply(200, listData)
    mock.onGet(errorUrl).reply(500, errorData)
  })
  const createWrapper = (context: ReactUseApi.CustomContext) => ({
    children
  }) => <ApiProvider context={context}>{children}</ApiProvider>

  it('should work well without options', async () => {
    const context = {
      settings: {
        isSSR: () => false
      }
    } as ReactUseApi.CustomContext
    const wrapper = createWrapper(context)
    const { result, waitForNextUpdate, rerender } = renderHook(
      () =>
        useApi({
          url
        }),
      { wrapper }
    )
    const [data, state, request] = result.current
    expect(data).toBeUndefined()
    expect(state).toEqual({
      loading: true,
      fromCache: false,
      $cacheKey: '{"url":"/api/v1/foo/bar"}',
      error: undefined
    })
    expect(request).toBeTruthy()

    await waitForNextUpdate()

    const [uData, uState] = result.current
    expect(uData).toEqual(apiData)
    expect(uState).toEqual({
      loading: false,
      fromCache: false,
      $cacheKey: '{"url":"/api/v1/foo/bar"}',
      error: undefined,
      prevData: undefined,
      prevState: {
        loading: true,
        fromCache: false,
        $cacheKey: '{"url":"/api/v1/foo/bar"}',
        error: undefined
      },
      response: { status: 200, data: apiData, headers: undefined },
      dependencies: undefined,
      data: apiData
    })
    const {
      collection: { ssrConfigs }
    } = context
    expect(ssrConfigs.length).toBe(0)

    rerender()

    // should be same after rerender
    const [nData, nState] = result.current
    expect(nData).toBe(uData)
    expect(nState).toBe(uState)
  })

  it('should work well by string type config without options', async () => {
    const wrapper = createWrapper({
      settings: {
        isSSR: () => false
      }
    })
    const { result, waitForNextUpdate, rerender } = renderHook(
      () => useApi(url),
      { wrapper }
    )
    const [data, state, request] = result.current
    expect(data).toBeUndefined()
    expect(state).toEqual({
      loading: true,
      fromCache: false,
      $cacheKey: '{"url":"/api/v1/foo/bar"}',
      error: undefined
    })
    expect(request).toBeTruthy()

    await waitForNextUpdate()

    const [uData, uState] = result.current
    expect(uData).toEqual(apiData)
    expect(uState).toEqual({
      loading: false,
      fromCache: false,
      $cacheKey: '{"url":"/api/v1/foo/bar"}',
      error: undefined,
      prevData: undefined,
      prevState: {
        loading: true,
        fromCache: false,
        $cacheKey: '{"url":"/api/v1/foo/bar"}',
        error: undefined
      },
      response: { status: 200, data: apiData, headers: undefined },
      dependencies: undefined,
      data: apiData
    })

    rerender()

    // should be same after rerender
    const [nData, nState] = result.current
    expect(nData).toBe(uData)
    expect(nState).toBe(uState)
  })

  it('should work well with cache data', async () => {
    console.log = jest.fn()
    const cache = new LRU<string, ReactUseApi.CacheData | any>()
    const context = {
      settings: {
        cache,
        isSSR: () => false,
        debug: true
      }
    } as ReactUseApi.CustomContext
    const cacheKey = '{"url":"/api/v1/foo/bar"}'
    cache.set(cacheKey, {
      response: {
        data: apiData
      }
    })
    const wrapper = createWrapper(context)
    const { result, waitForNextUpdate, rerender } = renderHook(
      () =>
        useApi({
          url
        }),
      { wrapper }
    )
    const [data, state] = result.current
    expect(console.log).toHaveBeenCalledWith('[ReactUseApi][Feed]', cacheKey)
    expect(data).toEqual(apiData)
    expect(state).toEqual({
      loading: false,
      fromCache: true,
      $cacheKey: cacheKey,
      error: undefined,
      prevData: undefined,
      prevState: initState,
      response: {
        data: apiData
      },
      dependencies: undefined,
      data: apiData
    })

    // cannot use waitForNextUpdate to test the non-rerender situation, use rerender instead
    // await waitForNextUpdate()
    rerender()

    const [uData, uState] = result.current
    expect(uData).toBe(data)
    expect(uState).toEqual(state)
  })

  describe('SSR tests', () => {
    const cache = new LRU<string, ReactUseApi.CacheData | any>()
    beforeEach(() => {
      cache.reset()
      console.log = jest.fn()
    })

    it('should work well with cache data', async () => {
      const context = {
        settings: {
          cache,
          isSSR: () => true,
          debug: true
        }
      } as ReactUseApi.CustomContext
      const cacheKey = '{"url":"/api/v1/foo/bar"}'
      cache.set(cacheKey, {
        response: {
          data: apiData
        }
      })
      const wrapper = createWrapper(context)
      const { result, waitForNextUpdate, rerender } = renderHook(
        () =>
          useApi({
            url
          }),
        { wrapper }
      )
      const [data, state] = result.current
      expect(console.log).toHaveBeenCalledWith('[ReactUseApi][Feed]', cacheKey)
      expect(data).toEqual(apiData)
      expect(state).toEqual({
        loading: false,
        fromCache: false,
        $cacheKey: cacheKey,
        error: undefined,
        prevData: undefined,
        prevState: initState,
        response: {
          data: apiData
        },
        dependencies: undefined,
        data: apiData
      })

      // cannot use waitForNextUpdate to test the non-rerender situation, use rerender instead
      // await waitForNextUpdate()
      rerender()

      const [uData, uState] = result.current
      expect(uData).toBe(data)
      expect(uState).toEqual(state)
      expect(cache.has(cacheKey)).toBe(false)
    })

    it('should work well without cache data', async () => {
      const context = {
        settings: {
          cache,
          isSSR: () => true,
          debug: true
        }
      } as ReactUseApi.CustomContext
      const cacheKey = '{"url":"/api/v1/foo/bar"}'
      const wrapper = createWrapper(context)
      renderHook(
        () =>
          useApi({
            url
          }),
        { wrapper }
      )
      const {
        collection: { ssrConfigs, cacheKeys }
      } = context
      expect(console.log).toHaveBeenCalledWith(
        '[ReactUseApi][Collect]',
        cacheKey
      )
      expect(ssrConfigs).toEqual([
        {
          config: {
            url
          },
          cacheKey
        }
      ])
      expect(cacheKeys.size).toBe(1)
    })
  })

  it('should request work well without options', async () => {
    const wrapper = createWrapper({
      settings: {
        isSSR: () => false
      }
    })
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useApi({
          url
        }),
      { wrapper }
    )
    const [, , request] = result.current
    await waitForNextUpdate()

    act(() => {
      request()
    })

    const [data, state] = result.current
    expect(data).toEqual(apiData)
    expect(state).toEqual({
      loading: true,
      fromCache: false,
      $cacheKey: '{"url":"/api/v1/foo/bar"}',
      error: undefined,
      prevData: undefined,
      prevState: {
        loading: true,
        fromCache: false,
        $cacheKey: '{"url":"/api/v1/foo/bar"}',
        error: undefined
      },
      response: { status: 200, data: apiData, headers: undefined },
      dependencies: undefined,
      data: apiData
    })

    await waitForNextUpdate()

    const [uData, uState] = result.current
    expect(uData).toEqual(apiData)
    expect(uState).toEqual({
      loading: false,
      fromCache: false,
      $cacheKey: '{"url":"/api/v1/foo/bar"}',
      error: undefined,
      prevData: { foo: { bar: true } },
      response: { status: 200, data: apiData, headers: undefined },
      dependencies: undefined,
      data: { foo: { bar: true } },
      prevState: {
        loading: true,
        fromCache: false,
        $cacheKey: '{"url":"/api/v1/foo/bar"}',
        error: undefined,
        prevData: undefined,
        response: { status: 200, data: apiData, headers: undefined },
        dependencies: undefined,
        data: { foo: { bar: true } }
      }
    })
  })

  it('should request work well for advanced usage', async () => {
    const apiListUrl = '/api/v1/itemList'
    const apiListData = [[1, 2], [3, 4], [5, 6]]
    mock
      .onGet(apiListUrl, {
        params: {
          start: 0,
          count: 2
        }
      })
      .reply(200, apiListData[0])
    mock
      .onGet(apiListUrl, {
        params: {
          start: 2,
          count: 4
        }
      })
      .reply(200, apiListData[1])
    mock
      .onGet(apiListUrl, {
        params: {
          start: 4,
          count: 6
        }
      })
      .reply(200, apiListData[2])

    const wrapper = createWrapper({
      settings: {
        isSSR: () => false
      }
    })
    const { result, waitForNextUpdate } = renderHook(
      () => {
        const [myState, setMyState] = useState(0)
        const options = {
          dependencies: {},
          handleData(data: ReactUseApi.Data, newState: ReactUseApi.State) {
            const { prevData = [] } = newState
            data = Array.isArray(data) ? data : []
            // since React 16.9 supports calling a state setter inside useReducer
            setMyState(1)
            return [...prevData, ...data]
          }
        }
        const result = useApi(
          {
            url: apiListUrl,
            params: {
              start: 0,
              count: 2
            }
          },
          options
        )
        return [...result, myState]
      },
      { wrapper }
    )
    await waitForNextUpdate()
    const [data, state, request] = result.current
    expect(data).toEqual(apiListData[0])

    act(() => {
      request(
        {
          url: apiListUrl,
          params: {
            start: 2,
            count: 4
          }
        },
        true
      )
    })
    await waitForNextUpdate()
    const [nData, nState, , myState] = result.current
    expect(nData).toEqual([...apiListData[0], ...apiListData[1]])
    expect(nState.$cacheKey).toEqual(state.$cacheKey)
    expect(myState).toBe(1)

    act(() => {
      request(
        {
          url: apiListUrl,
          params: {
            start: 4,
            count: 6
          }
        },
        true
      )
    })
    await waitForNextUpdate()
    const [uData, uState] = result.current
    expect(uData).toEqual([
      ...apiListData[0],
      ...apiListData[1],
      ...apiListData[2]
    ])
    expect(uState.$cacheKey).toEqual(state.$cacheKey)
  })

  it('should shouldRequest work well', async () => {
    const wrapper = createWrapper({
      settings: {
        isSSR: () => false
      }
    })
    let shouldFetchData = false
    const ref = { current: { isRequesting: false } }
    const spy = jest.spyOn(React, 'useRef').mockReturnValue(ref)
    const options = {
      shouldRequest() {
        if (shouldFetchData) {
          shouldFetchData = false
          return true
        }
        return false
      }
    }
    const { result, waitForNextUpdate, rerender } = renderHook(
      () =>
        useApi(
          {
            url
          },
          options
        ),
      { wrapper }
    )
    await waitForNextUpdate()
    expect(ref.current.isRequesting).toBe(false)

    // first rerender test
    const [, state] = result.current
    rerender()

    const [nData, nState] = result.current
    // should be same
    expect(nState).toBe(state)

    shouldFetchData = true
    rerender()
    expect(ref.current.isRequesting).toBe(true)
    await waitForNextUpdate()

    const [uData, uState] = result.current
    expect(uData).not.toBe(nData)
    expect(uData).toEqual(apiData)
    expect(uState).toEqual({
      loading: false,
      fromCache: false,
      $cacheKey: '{"url":"/api/v1/foo/bar"}',
      prevData: apiData,
      response: { status: 200, data: apiData, headers: undefined },
      dependencies: undefined,
      error: undefined,
      data: apiData,
      prevState: {
        loading: true,
        fromCache: false,
        $cacheKey: '{"url":"/api/v1/foo/bar"}',
        prevData: undefined,
        response: { status: 200, data: apiData, headers: undefined },
        dependencies: undefined,
        error: undefined,
        data: apiData
      }
    })
    expect(ref.current.isRequesting).toBe(false)
    spy.mockRestore()
  })

  it('should shouldUseApiCache work well', async () => {
    console.log = jest.fn()
    const cache = new LRU<string, ReactUseApi.CacheData | any>()
    const context = {
      settings: {
        cache,
        debug: true,
        isSSR: () => false,
        shouldUseApiCache: (config, cacheKey) => {
          if (cacheKey.includes('/no/cache')) {
            return false
          }
          return true
        }
      }
    } as ReactUseApi.CustomContext
    const cacheKey = '{"url":"/api/v1/foo/bar"}'
    cache.set(cacheKey, {
      response: {
        data: apiData
      }
    })
    const noCacheData = {
      no: 'dont touch me'
    }
    const noCacheApiUrl = '/api/v1/no/cache'
    cache.set(`{"url":"${noCacheApiUrl}"}`, {
      response: {
        data: noCacheData
      }
    })
    const wrapper = createWrapper(context)
    const { result, rerender } = renderHook(
      () => {
        const [data1] = useApi(url)
        const [data2] = useApi(noCacheApiUrl)
        return [data1, data2]
      },
      { wrapper }
    )
    // cannot use waitForNextUpdate to test the non-rerender situation, use rerender instead
    rerender()

    const [data1, data2] = result.current
    expect(data1).toEqual(apiData)
    expect(data2).not.toEqual(noCacheData)
  })

  it('should watch work well', async () => {
    const wrapper = createWrapper({
      settings: {
        isSSR: () => false
      }
    })
    const watch = [123, 456]
    const options = {
      watch
    }
    const { result, waitForNextUpdate, rerender } = renderHook(
      () =>
        useApi(
          {
            url
          },
          options
        ),
      { wrapper }
    )
    await waitForNextUpdate()

    // first rerender test
    const [, state] = result.current
    rerender()

    const [nData, nState] = result.current
    // should be same
    expect(nState).toBe(state)

    watch[1] = 123
    rerender()
    await waitForNextUpdate()

    const [uData, uState] = result.current
    expect(uData).not.toBe(nData)
    expect(uData).toEqual(apiData)
    expect(uState).toEqual({
      loading: false,
      fromCache: false,
      $cacheKey: '{"url":"/api/v1/foo/bar"}',
      prevData: apiData,
      response: { status: 200, data: apiData, headers: undefined },
      dependencies: undefined,
      error: undefined,
      data: apiData,
      prevState: {
        loading: true,
        fromCache: false,
        $cacheKey: '{"url":"/api/v1/foo/bar"}',
        prevData: undefined,
        response: { status: 200, data: apiData, headers: undefined },
        dependencies: undefined,
        error: undefined,
        data: apiData
      }
    })
  })

  it('should multiple requests work well', async () => {
    const wrapper = createWrapper({
      settings: {
        isSSR: () => false
      }
    })
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useApi([
          {
            url
          },
          { url: listUrl }
        ]),
      { wrapper }
    )
    await waitForNextUpdate()

    const [data, state] = result.current
    expect(data).toEqual([apiData, listData])
    expect(state).toEqual({
      loading: false,
      fromCache: false,
      $cacheKey: '[{"url":"/api/v1/foo/bar"},{"url":"/api/v1/list"}]',
      error: undefined,
      prevData: undefined,
      prevState: {
        loading: true,
        fromCache: false,
        $cacheKey: '[{"url":"/api/v1/foo/bar"},{"url":"/api/v1/list"}]',
        error: undefined
      },
      response: [
        { status: 200, data: apiData, headers: undefined },
        { status: 200, data: listData, headers: undefined }
      ],
      dependencies: undefined,
      data: [apiData, listData]
    })
  })

  it('should work as expected about multiple requests, even if one of them fails', async () => {
    const wrapper = createWrapper({
      settings: {
        isSSR: () => false
      }
    })
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useApi([
          {
            url
          },
          { url: errorUrl }
        ]),
      { wrapper }
    )
    await waitForNextUpdate()

    const [data, state] = result.current
    expect(data).toBeUndefined()
    expect(state.response).toBeUndefined()
    expect(state.error.response.data).toEqual(errorData)
  })

  it('should HTTP error request work as expected', async () => {
    const wrapper = createWrapper({
      settings: {
        isSSR: () => false
      }
    })
    const { result, waitForNextUpdate } = renderHook(() => useApi(errorUrl), {
      wrapper
    })
    await waitForNextUpdate()

    const [data, state] = result.current
    expect(data).toBeUndefined()
    expect(state.response).toBeUndefined()
    expect(state.error.response.data).toEqual(errorData)
  })
})

describe('fetchApi tests', () => {
  const cache = new LRU<string, ReactUseApi.CacheData | any>()
  const context = {
    settings: { axios, cache }
  } as ReactUseApi.Context
  const url = '/api/v1/user'
  const config = {
    url
  }
  const options = {
    $cacheKey: url
  }
  beforeEach(() => {
    jest.restoreAllMocks()
    cache.reset()
  })

  it('should loading and success work well', async () => {
    const apiData = {
      message: 'ok'
    }
    mock.onGet(url).reply(200, apiData)
    const dispatch = jest.fn()
    await fetchApi(context, config, options, dispatch)
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTIONS.REQUEST_START,
      options
    })
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTIONS.REQUEST_END,
      response: {
        data: apiData,
        headers: undefined,
        status: 200
      },
      error: undefined,
      options
    })
  })

  it('should loading and success work well by cache data', async () => {
    const apiData = {
      message: 'ok'
    }
    cache.set(url, {
      response: {
        data: apiData
      }
    })
    const dispatch = jest.fn()
    await fetchApi(context, config, options, dispatch)
    expect(cache.has(url)).toBe(false)
    expect(dispatch).not.toHaveBeenCalledWith({
      type: ACTIONS.REQUEST_START,
      options
    })
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTIONS.REQUEST_END,
      response: {
        data: apiData
      },
      error: undefined,
      options
    })
  })

  it('should loading and error work well', async () => {
    const apiData = {
      message: 'fail'
    }
    mock.onGet(url).reply(500, apiData)
    const dispatch = jest.fn()
    await fetchApi(context, config, options, dispatch)
    expect(dispatch).toHaveBeenCalledWith({
      type: ACTIONS.REQUEST_START,
      options
    })
    const args = dispatch.mock.calls[1][0]
    expect(args.type).toEqual(ACTIONS.REQUEST_END)
    expect(args.error.response).toEqual({
      data: apiData,
      headers: undefined,
      status: 500
    })
    expect(args.response).toBeUndefined()
    expect(args.options).toEqual(options)
  })

  it('should loading and error work well by cache data', async () => {
    const apiData = {
      message: 'fail'
    }
    cache.set(url, {
      error: {
        data: apiData
      }
    })
    const dispatch = jest.fn()
    await fetchApi(context, config, options, dispatch)
    expect(cache.has(url)).toBe(false)
    expect(dispatch).not.toHaveBeenCalledWith({
      type: ACTIONS.REQUEST_START,
      options
    })
    const args = dispatch.mock.calls[0][0]
    expect(args.type).toEqual(ACTIONS.REQUEST_END)
    expect(args.error).toEqual({
      data: apiData
    })
    expect(args.response).toBeUndefined()
    expect(args.options).toEqual(options)
  })
})

describe('reducer tests', () => {
  it('should get initState from REQUEST_START', () => {
    const state = { ...initState }
    const action = {
      type: ACTIONS.REQUEST_START,
      options: {
        $cacheKey: '/foo/bar'
      }
    }
    const newState = reducer(state, action)
    expect(newState).not.toBe(state)
    expect(newState).toEqual({
      ...state,
      loading: true,
      fromCache: false,
      error: undefined,
      $cacheKey: '/foo/bar'
    })
  })

  it('should get previous state with loading = true from REQUEST_START', () => {
    const state = {
      myData: '123',
      fromCache: false,
      loading: false,
      $cacheKey: '/foo/bar'
    } as ReactUseApi.State
    const action = {
      type: ACTIONS.REQUEST_START,
      options: {
        $cacheKey: '/foo/bar'
      }
    }
    const newState = reducer(state, action)
    expect(newState).not.toBe(state)
    expect(newState).toEqual({
      ...state,
      loading: true,
      fromCache: false,
      error: undefined,
      $cacheKey: '/foo/bar'
    })
  })

  it('should reset to initState from REQUEST_START if cacheKey changes', () => {
    const state = {
      myData: '123',
      fromCache: false,
      loading: false,
      $cacheKey: '/foo/bar'
    } as ReactUseApi.State
    const action = {
      type: ACTIONS.REQUEST_START,
      options: {
        $cacheKey: '/abc/def'
      }
    }
    const newState = reducer(state, action)
    expect(newState).not.toBe(state)
    expect(newState).toEqual({
      loading: true,
      fromCache: false,
      error: undefined,
      $cacheKey: '/abc/def'
    })
  })

  it('should REQUEST_END work well if response', () => {
    const state = { ...initState }
    const action = {
      type: ACTIONS.REQUEST_END,
      response: {
        data: {
          message: 'ok'
        }
      } as any,
      options: {
        dependencies: {
          foo: 'bar'
        },
        $cacheKey: '/foo/bar'
      }
    } as ReactUseApi.Action
    const newState = reducer(state, action)
    expect(newState).not.toBe(state)
    expect(newState).toEqual({
      loading: false,
      fromCache: false,
      prevData: undefined,
      prevState: initState,
      response: { data: { message: 'ok' } },
      dependencies: { foo: 'bar' },
      error: undefined,
      data: { message: 'ok' },
      $cacheKey: '/foo/bar'
    })
  })

  it('should REQUEST_END work well if error', () => {
    const state = { ...initState }
    const action = {
      type: ACTIONS.REQUEST_END,
      error: {
        data: {
          message: 'fail'
        }
      } as any,
      options: {
        dependencies: {
          foo: 'bar'
        },
        $cacheKey: '/foo/bar'
      }
    } as ReactUseApi.Action
    const newState = reducer(state, action)
    expect(newState).not.toBe(state)
    expect(newState).toEqual({
      loading: false,
      fromCache: false,
      prevData: undefined,
      prevState: initState,
      response: undefined,
      dependencies: { foo: 'bar' },
      error: { data: { message: 'fail' } },
      data: undefined,
      $cacheKey: '/foo/bar'
    })
  })

  it('should get the same state if the action is not found', () => {
    const state = { ...initState }
    const action = {
      type: 'NOT_FOUND',
      options: {
        $cacheKey: '/foo/bar'
      }
    }
    const newState = reducer(state, action)
    expect(newState).toBe(state)
  })
})

describe('handleUseApiOptions tests', () => {
  it('should work well with object options', () => {
    const opt = {
      watch: [123, 456],
      handleData: () => null,
      shouldRequest: () => false,
      dependencies: {}
    }
    const options = handleUseApiOptions(opt, '/foo/bar')
    expect(options).toEqual({
      ...opt,
      $cacheKey: '/foo/bar'
    })
  })
  it('should work well with watch options', () => {
    const watch = [123, 456]
    const options = handleUseApiOptions(watch, '/foo/bar')
    expect(options).toEqual({
      watch,
      handleData: undefined,
      $cacheKey: '/foo/bar'
    })
  })
  it('should work well with handleData options', () => {
    const handleData = jest.fn()
    const options = handleUseApiOptions(handleData, '/foo/bar')
    expect(options).toEqual({
      watch: [],
      handleData,
      $cacheKey: '/foo/bar'
    })
  })
})
