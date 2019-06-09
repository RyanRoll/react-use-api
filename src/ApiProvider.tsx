import React, { useMemo } from 'react'

import { ApiContext, createContextData } from './context'

export const ApiProvider: React.FC<ReactUseApi.ApiProviderProps> = ({
  context = {},
  children
}) => {
  const apiContext = useMemo(() => createContextData(context), [context])
  return (
    <ApiContext.Provider value={apiContext}>{children}</ApiContext.Provider>
  )
}
