# React Use API

> [Axios](https://github.com/axios/axios)-based React hooks for async HTTP request data. Designed for diverse UI states as well as SSR (server-side rendering) and data pre-cache.

> TypeScript Support

> Thread safety

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

## Usage

### Provider

```jsx
import React from 'react'
import ReactDom from 'react-dom'
import useApi, { ApiProvider } from 'react-use-api'

import App from './App'

// theres is only one prop parameter "context", which is must given for SSR,
// the client side can omit it
ReactDom.render(
  <ApiProvider>
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
      {data && (
        <>
          <div>Hello! {data.username}</div>
          <button onClick={request}>Reload</button>
        </>
      )}
    </>
  )
}
```

### Advanced Usage

```jsx
import React, { useState, useCallback } from 'react'
import useApi from 'react-use-api'

export const Main = () => {
  const [offset, setOffset] = useState(0)
  const limit = 10
  const dependencies = {
    limit
  }
  // hasMore is a custom state here
  const [data, { loading, error, hasMore = true }, request] = useApi(
    getAPiList(),
    {
      handleData,
      dependencies
    }
  )
  const loadMore = useCallback(() => {
    const nextOffset = offset + limit
    // fetch the data and keep the state and prevData
    request(getAPiList(nextOffset, limit), true)
    setOffset(nextOffset)
  }, [offset, setOffset])

  return (
    <>
      {loading && <div>Loading...</div>}
      {error && <div>{error.response.data.errMsg}</div>}
      {data && (
        <>
          {data.list.map(({ name }) => (
            <div key={name}>{name}</div>
          ))}
          {hasMore && <button onClick={loadMore}>Load More</button>}
        </>
      )}
    </>
  )
}

export const getAPiList = (offset, limit) => ({
  url: '/api/list',
  params: {
    offset,
    limit
  }
})

// [IMPORTANT] Using any state setter in handleData is not allowed,
// it will cause the component re-rendering infinitely while SSR rendering.
export const handleData = state => {
  const { prevData = [], response, dependencies, error } = state
  if (!error) {
    const {
      data: { userList }
    } = response
    const { limit, hasMore } = dependencies
    if (userList.length < limit) {
      state.hasMore = false
    }
    return [...prevData, ...userList]
  } else {
    // show an error message from the api
    console.log(error.response.data.msg)
  }
}
```

## Parameters

```jsx
const [data, state, request] = useApi(config, options)
```

### Config

The config can be an [Axios Request Config](https://github.com/axios/axios#request-config) or a url string.

```jsx
const [data, state] = useApi('/api/foo/bar')
// equals to
const [data, state] = useApi({
  url: '/api/foo/bar'
})
```

### Options

| Name          | Type                                          | default | Description                                                                                                                      |
| ------------- | --------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| handleData    | Function(data: any, state: ReactUseApi.State) |         | A callback function to deal with the data of the API's response.                                                                 |
| withLoading   | boolean                                       | true    | Set true to enable the loading state, state.loading is true before the API response.                                             |
| dependencies  | Object                                        |         | The additional needed data using in handleData. `NOTE`: "dependencies" is supposed to immutable due to React's rendering policy. |
| shouldRequest | Function                                      |         | A callback to decide whether useApi re-fetches the API when re-rendering. Returning true will trigger useApi to re-fetch.        |
| watch         | any[]                                         | []      | An array of values that the effect depends on, this is the same as the second argument of useEffect.                             |

## State

TBD

### TBD...
