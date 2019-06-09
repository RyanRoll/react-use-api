import { createContext } from 'react'

import { configure, isFunction } from './common'
import { injectSSRHtml, loadApiCache } from './ssr'

export const ApiContext = createContext<ReactUseApi.Context>({})

export const createContextData = (context: ReactUseApi.CustomContext) => {
  // apply to the reference directly
  context.settings = configure(context.settings)
  const { settings } = context
  Object.assign(context, {
    isSSR: isFunction(settings.isSSR) ? settings.isSSR() : false,
    injectSSRHtml: injectSSRHtml.bind(this, context),
    loadApiCache: loadApiCache.bind(this, context)
  })
  return context as ReactUseApi.Context
}
