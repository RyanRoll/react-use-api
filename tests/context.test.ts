/// <reference path="../src/typings.d.ts" />

import { defaultSettings } from '../src/common'
import { injectSSRHtml, loadApiCache } from '../src/ssr'
import { createContextData } from '../src/context'

jest.mock('../src/ssr', () => {
  const ssr = jest.requireActual('../src/ssr')
  return {
    ...ssr,
    injectSSRHtml: jest.fn(),
    loadApiCache: jest.fn()
  }
})

describe('createContextData tests', () => {
  it('should createContextData work well', () => {
    const context = {}
    const mutatedContext = createContextData(context)
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
  it('should createContextData work well with custom isSSR()', () => {
    const context = {
      settings: {
        isSSR: jest.fn().mockReturnValue(true)
      }
    }
    const mutatedContext = createContextData(context)
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
