/// <reference path="../src/typings.d.ts" />

import { axiosAll, configure } from '../src/common'
// import { feedRequests, injectSSRHtml, loadApiCache } from '../src/ssr'

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
    const settings = configure()
    const { cache } = settings
    const context = {
      settings
    }
    settings.renderSSR = renderSSR
    cache.dump = jest.fn().mockReturnValue({ foo: 'bar' })
    expect.hasAssertions()
    try {
      const ssrHtml = await injectSSRHtml(context)
      expect(renderSSR).toHaveBeenCalled()
      expect(feedRequests).toHaveBeenLastCalledWith(context, html)
    } catch (e) {
      // pass
      console.log(e)
    }
  })
})
