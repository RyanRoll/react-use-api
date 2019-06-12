/// <reference path="../src/typings.d.ts" />

import React, { useContext } from 'react'
import LRU from 'lru-cache'
import TestRenderer from 'react-test-renderer'

import { ApiProvider } from '../src'
import { ApiContext } from '../src/context'
import { defaultSettings } from '../src/common'

describe('ApiProvider tests', () => {
  it('should default context work as expected if context does not pass to ApiProvider', () => {
    let context: ReactUseApi.Context = {}
    const App: React.FC = () => {
      context = useContext(ApiContext)
      return <>Hello World</>
    }
    const testRenderer = TestRenderer.create(
      <ApiProvider>
        <App />
      </ApiProvider>
    )
    const { settings, isSSR } = context
    expect(settings).toMatchObject({
      ...defaultSettings,
      cache: new LRU()
    })
    expect(isSSR).toBe(false) // window exists in jest
  })
  it('should context work as expected ', () => {
    const context: ReactUseApi.Context = {}
    const testRenderer = TestRenderer.create(<ApiProvider context={context} />)
    const { root } = testRenderer
    const instance = root.findByType(ApiProvider)
    const { settings, isSSR } = context
    expect(instance.props.context).toBe(context)
    expect(settings).toMatchObject({
      ...defaultSettings,
      cache: new LRU()
    })
    expect(isSSR).toBe(false) // window exists in jest
  })
})
