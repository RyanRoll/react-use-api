/// <reference path="../src/typings.d.ts" />

import { defaultSettings, configure } from '../src/common'
import { injectSSRHtml, loadApiCache } from '../src/ssr'

jest.mock('../src/ssr', () => {
  const ssr = jest.requireActual('../src/ssr')
  return {
    ...ssr,
    injectSSRHtml: jest.fn(),
    loadApiCache: jest.fn()
  }
})

describe('configure tests', () => {
  it('should configure work well', () => {
    const context = {}
    const mutatedContext = configure(context)
    expect(mutatedContext.isSSR).toBe(false)
    expect(mutatedContext.injectSSRHtml).toBeTruthy()
    expect(mutatedContext.loadApiCache).toBeTruthy()
    mutatedContext.injectSSRHtml()
    mutatedContext.loadApiCache()
    expect(injectSSRHtml).toHaveBeenLastCalledWith(context)
    expect(loadApiCache).toHaveBeenLastCalledWith(context)
    expect(mutatedContext).toBe(context)
    mutatedContext.settings.cache = null // try to make equal
    expect(mutatedContext.settings).toEqual(defaultSettings)
  })
  it('should configure work well with custom isSSR()', () => {
    const context = {
      settings: {
        isSSR: jest.fn().mockReturnValue(true)
      }
    }
    const mutatedContext = configure(context)
    expect(context.settings.isSSR).toHaveBeenCalled()
    expect(mutatedContext.isSSR).toBe(true)
    expect(mutatedContext.injectSSRHtml).toBeTruthy()
    expect(mutatedContext.loadApiCache).toBeTruthy()
    mutatedContext.injectSSRHtml()
    mutatedContext.loadApiCache()
    expect(injectSSRHtml).toHaveBeenLastCalledWith(context)
    expect(loadApiCache).toHaveBeenLastCalledWith(context)
    expect(mutatedContext).toBe(context)
  })
})
