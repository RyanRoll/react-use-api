/// <reference path="../src/typings.d.ts" />

import axios from 'axios'
import LRU from 'lru-cache'
import MockAdapter from 'axios-mock-adapter'

import {
  defaultSettings,
  configure,
  axiosAll,
  tidyResponse,
  getResponseData,
  isObject,
  isFunction,
  isNil
} from '../src/common'
import { createContextData } from '../src/context'

const noop = function() {}

describe('configure tests', () => {
  it('should configure work without custom settings', () => {
    const settings = configure()
    expect(settings).toMatchObject({
      ...defaultSettings,
      cache: new LRU()
    })
    expect(settings).not.toBe(defaultSettings)
  })
  it('should configure work with custom settings', () => {
    const custom = {
      clientCacheVar: '__FOO_BAR__',
      axios: axios.create(),
      cache: new LRU<string, ReactUseApi.CacheData>(),
      maxRequests: 100,
      renderSSR: noop,
      isSSR: noop,
      deleteAfterLoading: false
    }
    const settings = configure(custom)
    expect(settings).toMatchObject({
      ...defaultSettings,
      ...custom
    })
    expect(settings).not.toBe(defaultSettings)
  })
})

describe('axiosAll tests', () => {
  const mock = new MockAdapter(axios)
  const context = createContextData({})
  const url = '/foo'
  const data = {
    foo: 'bar'
  }
  mock.onGet(url).reply(() => {
    return [200, data]
  })

  it('should a single api request work well', async () => {
    const config: ReactUseApi.Config = {
      url
    }
    const response = await axiosAll(context, config)
    expect(Array.isArray(response)).toBe(false)
    expect(response.data).toEqual(data)
  })
  it('should the multiple api requests work well', async () => {
    const config: ReactUseApi.MultiConfigs = [
      {
        url
      },
      {
        url
      }
    ]
    const responses = await axiosAll(context, config)
    expect(Array.isArray(responses)).toBe(true)
    expect(responses[0].data).toEqual(data)
    expect(responses[1].data).toEqual(data)
  })
  it('should an api request work failed', async () => {
    const errorData = {
      message: 'Error!'
    }
    mock.onGet(url).reply(() => {
      return [500, errorData]
    })
    const config: ReactUseApi.Config = {
      url
    }
    expect.assertions(1)
    try {
      await axiosAll(context, config)
    } catch (error) {
      expect(error.response.data).toEqual(errorData)
    }
  })
})

it('should tidyResponse work well', () => {
  const response = {
    config: {},
    request: {},
    data: {},
    status: 200,
    statusText: 'ok',
    headers: {}
  }
  const tidied = tidyResponse(response)
  expect(tidied.config).toBeUndefined()
  expect(tidied.request).toBeUndefined()
})

describe('getResponseData tests', () => {
  it('should getResponseData work well with single response', () => {
    const data = {
      foo: 'bar'
    }
    const newData = {
      abc: 'def'
    }
    const options: ReactUseApi.Options = {
      handleData: jest.fn().mockReturnValue(newData)
    }
    const state: ReactUseApi.State = {
      response: {
        data,
        config: {},
        request: {},
        status: 200,
        statusText: 'ok',
        headers: {}
      },
      loading: false
    }
    const returnedData = getResponseData(options, state)
    expect(options.handleData).toHaveBeenLastCalledWith(data, state)
    expect(returnedData).toEqual(newData)
  })
  it('should getResponseData work well with multiple responses', () => {
    const data = [
      {
        foo: 'bar'
      },
      {
        foo: 'bar'
      }
    ]
    const newData = [
      {
        abc: 'def'
      },
      {
        abc: 'def'
      }
    ]
    const options: ReactUseApi.Options = {
      handleData: jest.fn().mockReturnValue(newData)
    }
    const state: ReactUseApi.State = {
      response: {
        data,
        config: {},
        request: {},
        status: 200,
        statusText: 'ok',
        headers: {}
      },
      loading: false
    }
    const returnedData = getResponseData(options, state)
    expect(options.handleData).toHaveBeenLastCalledWith(data, state)
    expect(returnedData).toEqual(newData)
  })
})

it('should isObject work well', () => {
  expect(isObject({})).toBe(true)
  expect(isObject(new noop())).toBe(true)
  expect(isObject(Object.create({}))).toBe(true)
  expect(isObject([])).toBe(false)
  expect(isObject(noop)).toBe(false)
  expect(isObject(/^$/)).toBe(false)
  expect(isObject(123)).toBe(false)
  expect(isObject('foo')).toBe(false)
  expect(isObject(null)).toBe(false)
  expect(isObject(undefined)).toBe(false)
})

it('should isFunction work well', () => {
  expect(isFunction(noop)).toBe(true)
  expect(isFunction({})).toBe(false)
  expect(isFunction([])).toBe(false)
  expect(isFunction(/^$/)).toBe(false)
  expect(isFunction(123)).toBe(false)
  expect(isFunction('foo')).toBe(false)
  expect(isFunction(null)).toBe(false)
  expect(isFunction(undefined)).toBe(false)
})

it('should isNil work well', () => {
  expect(isNil(undefined)).toBe(true)
  expect(isNil(null)).toBe(true)
  expect(isNil('')).toBe(true)
  expect(isNil(noop)).toBe(false)
  expect(isNil({})).toBe(false)
  expect(isNil([])).toBe(false)
  expect(isNil(/^$/)).toBe(false)
  expect(isNil(123)).toBe(false)
  expect(isNil('foo')).toBe(false)
  expect(isNil(0)).toBe(false)
})
