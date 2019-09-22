import React, { useEffect, useMemo } from 'react'

import { ApiContext } from './context'
import { configure } from './common'

export const ApiProvider: React.FC<ReactUseApi.ApiProviderProps> = ({
  context = {},
  children
}) => {
  const apiContext = useMemo(() => configure(context), [context])
  useEffect(() => {
    const {
      settings: { cache }
    } = apiContext
    cache && cache.reset()
  }, [apiContext])
  return (
    <ApiContext.Provider value={apiContext}>{children}</ApiContext.Provider>
  )
}
