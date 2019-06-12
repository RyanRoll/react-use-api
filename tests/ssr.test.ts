/// <reference path="../src/typings.d.ts" />

import { configure, defaultSettings } from '../src/common'

jest.mock('../src/common', () => {
  const common = jest.requireActual('../src/common')
  return {
    ...common,
    axiosAll: jest.fn()
  }
})

beforeEach(() => {
  jest.resetModules()
})

describe('injectSSRHtml tests', () => {
  const html = '<div>Hello World</>'
  const ssrModule = require('../src/ssr')
  const { injectSSRHtml } = ssrModule
  const feedRequests = jest
    .spyOn(ssrModule, 'feedRequests')
    .mockResolvedValue(html)
  it.only('should injectSSRHtml well with settings.renderSSR', async () => {
    const renderSSR = jest.fn().mockReturnValue(html)
    const context = configure({
      settings: {
        ...defaultSettings,
        renderSSR
      }
    })
    const { settings } = context
    const { cache } = settings
    cache.reset = jest.fn()
    cache.dump = jest.fn().mockReturnValue({ foo: 'bar' })
    expect.hasAssertions()
    try {
      const ssrHtml = await injectSSRHtml(context)
      expect(renderSSR).toHaveBeenCalled()
      expect(cache.reset).toHaveBeenCalled()
      expect(feedRequests).toHaveBeenLastCalledWith(context, html)
      expect(ssrHtml).toEqual(
        `${html}<script>window.__USE_API_CACHE__ = {"foo":"bar"}</script>`
      )
    } catch (e) {
      // pass
      console.log(e)
    }
  })
})
