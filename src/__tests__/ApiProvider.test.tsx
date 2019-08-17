/// <reference path="../typings.d.ts" />

import React, { useContext } from 'react'
import LRU from 'lru-cache'
import TestRenderer from 'react-test-renderer'

import { ApiProvider } from '../ApiProvider'
import { ApiContext } from '../context'
import { defaultSettings } from '../common'

describe('ApiProvider tests', () => {
  it('should default context work as expected if context does not pass to ApiProvider', () => {
    let context: ReactUseApi.Context = {}
    const App: React.FC = () => {
      context = useContext(ApiContext)
      return <div>Hello World</div>
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
    expect(testRenderer.toJSON()).toMatchSnapshot()
  })

  it('should context work as expected', () => {
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
