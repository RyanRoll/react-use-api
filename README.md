# React Use API

> [Axios](https://github.com/axios/axios)-based React hooks for async HTTP request data for diverse UI states, as well as SSR (server-side rendering) and pre-cached data.

> TypeScript Support

## Installation

_Axios is a peer dependency (prerequisite) and it has to be installed_

#### NPM

```sh
npm i react-use-api axios
```

#### Yarn

```sh
yarn add react-use-api axios
```

## Getting Started

### Provider

```jsx
import React from 'react'
import ReactDom from 'react-dom'
import useApi, { ApiProvider } from 'react-use-api'

import App from './App'

// context must be given for SSR, the client side can omit it
ReactDom.render(
  <ApiProvider context={{}}>
    <App />
  </ApiProvider>,
  document.getElementById('root')
)
```

### Basic Usage

```jsx
import React from 'react'
import useApi from 'react-use-api'

export const Main = () => {
  const [data, { loading, error }, request] = useApi({
    url: '/api/foo/bar'
  })

  return (
    <>
      {loading && <div>Loading...</div>}
      {error && <div>{error.response.data.errMsg}</div>}
      {data && <div>Hello! {data.username}</div>}
      <button onClick={request}>Reload</button>
    </>
  )
}
```

### Advanced Usage

```jsx
import React, { useState, useCallback } from 'react'
import useApi from 'react-use-api'

export const getAPiList = (offset, limit) => ({
  url: '/api/list',
  params: {
    offset,
    limit
  }
})

export const Main = () => {
  const [offset, setOffset] = useState(0)
  const limit = 10
  const [data, { loading, error }, request] = useApi(getAPiList())
  const loadMore = useCallback(() => {
    const nextOffset = offset + limit
    request(getAPiList(nextOffset, limit), true)
    setOffset(nextOffset)
  }, [offset, setOffset])

  return (
    <>
      {loading && <div>Loading...</div>}
      {error && <div>{error.response.data.errMsg}</div>}
      {data && data.list.map(({ name }) => <div key={name}>{name}</div>)}
      <button onClick={loadMore}>Load More</button>
    </>
  )
}
```

### TBD...
