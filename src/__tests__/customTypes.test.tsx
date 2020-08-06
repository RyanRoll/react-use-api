/// <reference path="../typings.d.ts" />

import React from 'react'
import { renderHook } from '@testing-library/react-hooks'
import MockAdapter from 'axios-mock-adapter'
import axios from 'axios'

import { ApiProvider } from '../ApiProvider'
import { useApi } from '../useApi'

const mock = new MockAdapter(axios)

beforeEach(() => {
  jest.resetModules()
  mock.reset()
})

// This unit test is only for manual inspection
describe('Custom Types tests', () => {
  const url = '/api/v1/foo/bar'
  const apiData = {
    foo: {
      bar: true,
    },
  }
  const listUrl = '/api/v1/list'
  const listData = [
    {
      foo: 'bar',
    },
    {
      abc: 123,
    },
  ]
  beforeEach(() => {
    mock.onGet(url).reply(200, apiData)
    mock.onGet(listUrl).reply(200, listData)
  })
  const createWrapper = (context: ReactUseApi.CustomContext) => ({
    children,
  }) => <ApiProvider context={context}>{children}</ApiProvider>
  const context = {
    settings: {
      isSSR: () => false,
    },
  } as ReactUseApi.CustomContext

  it('should data type work fine - single config', async () => {
    const wrapper = createWrapper(context)
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useApi({
          url,
        }),
      { wrapper }
    )
    await waitForNextUpdate()
    const [data, state, request] = result.current
    expect(data.foo.bar).toBeTruthy()
  })

  it('should data type work fine - multi config', async () => {
    const wrapper = createWrapper(context)
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useApi([
          {
            url,
          },
          { url: listUrl },
        ]),
      { wrapper }
    )
    await waitForNextUpdate()
    const [data, state, request] = result.current
    expect(data[0].foo.bar).toBeTruthy()
    expect(data[1][0].foo).toBeTruthy()
    expect(data[1][1].abc).toBeTruthy()
  })

  it('should csutom data type work fine - object config', async () => {
    const wrapper = createWrapper(context)
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useApi<typeof apiData>({
          url,
        }),
      { wrapper }
    )
    await waitForNextUpdate()
    const [data, state, request] = result.current
    expect(data.foo.bar).toBeTruthy()
  })

  it('should csutom data type work fine - string config', async () => {
    const wrapper = createWrapper(context)
    const { result, waitForNextUpdate } = renderHook(
      () => useApi<typeof apiData>(url),
      {
        wrapper,
      }
    )
    await waitForNextUpdate()
    const [data, state, request] = result.current
    expect(data.foo.bar).toBeTruthy()
  })

  it('should csutom multi data type work fine', async () => {
    const wrapper = createWrapper(context)
    const { result, waitForNextUpdate } = renderHook(
      () =>
        useApi<[typeof apiData, typeof listData]>([
          {
            url,
          },
          { url: listUrl },
        ]),
      { wrapper }
    )
    await waitForNextUpdate()
    const [data, state, request] = result.current
    expect(data[0].foo.bar).toBeTruthy()
    expect(data[1][0].foo).toBeTruthy()
    expect(data[1][1].abc).toBeTruthy()
  })
})
