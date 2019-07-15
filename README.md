# React Use API

> [Axios](https://github.com/axios/axios)-based React hooks for async HTTP request data. Designed for diverse UI states as well as SSR (server-side rendering) and data pre-cache.

> TypeScript Support

> Not only cache api data but also feed it into React components when SSR

> Thread-safe SSR

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
    const { limit } = dependencies
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

#### Type

```ts
const [data, state, request] = useApi(
  config: ReactUseApi.Config | string,
  opt?: ReactUseApi.Options | ReactUseApi.Options['handleData']
)
```

#### Code

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

### Options [Optional]

| Name          | Type                                          | default | Description                                                                                                                                                                                                  |
| ------------- | --------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| handleData    | Function(data: any, state: ReactUseApi.State) |         | A callback function to deal with the data of the API's response. **IMPORTANT** Using any state setter in handleData is dangerous, which will cause the component re-rendering infinitely while SSR rendering |
| withLoading   | boolean                                       | true    | Set true to enable the loading state, state.loading is true before the API response.                                                                                                                         |
| dependencies  | Object                                        |         | The additional needed data using in handleData. `NOTE`: "dependencies" is supposed to immutable due to React's rendering policy.                                                                             |
| shouldRequest | Function                                      |         | A callback to decide whether useApi re-fetches the API when re-rendering. Returning true will trigger useApi to re-fetch.                                                                                    |
| watch         | any[]                                         | []      | An array of values that the effect depends on, this is the same as the second argument of useEffect.                                                                                                         |

## State

#### First State (before calling api)

The first state has only one propery `loading` before calling api.

| Name    | Type    | Default | Description                            |
| ------- | ------- | ------- | -------------------------------------- |
| loading | boolean | false   | to indicate whether calling api or not |

#### Full State

The is the full state data structure after the api has responded.

| Name          | Type              | Default   | Description                                                                                                                                                                      |
| ------------- | ----------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| loading       | boolean           | false     | to indicate whether calling api or not                                                                                                                                           |
| data          | any               | undefined | The processed data provided from `options.handleData`                                                                                                                            |
| response      | AxiosResponse     | undefined | The Axios' response                                                                                                                                                              |
| error         | AxiosError        | undefined | The Axios' error                                                                                                                                                                 |
| dependencies  | Object            | undefined | The additional needed data using in handleData. `NOTE`: "dependencies" is supposed to immutable due to React's rendering policy                                                  |
| prevData      | any               | undefined | The previous data of the previous state                                                                                                                                          |
| prevState     | ReactUseApi.State | undefined | The previous state                                                                                                                                                               |
| [custom data] | any               |           | You can add your own custom state data into the state by setting up in `options.handleData`. For example, `state.foo = 'bar'`. The data always be preserved whether re-rendering |

## TypeScript Support

All the associated types are provided by the namespace `ReactUseApi` as long as importing `react-use-api`.

> NOTE, this only works if you set up compilerOptions.typeRoots: ["node_modules/@types"] in your tsconfig.json.

> Support TypeScript v2.9+ only

## Server Side Rendering (SSR)

react-use-api guarantees that the SSR for each HTTP request is thread-safe as long as passing the api context with SSR settings to `ApiProvider`.

#### SSR and injecting the cached api data

```jsx
// server/render.js (based on Express framework)
import React from 'react'
import ReactDom from 'react-dom'
import { StaticRouter } from 'react-router-dom'
import { ApiProvider, injectSSRHtml } from 'react-use-api'

import App from '../../src/App'

export const render = async (req, axios) => {
  const { url } = req
  const apiContext = {
    settings: {
      axios, // your custom axios instance
      isSSR: () => true // we are 100% sure here is SSR mode
    }
  }
  const routerContext = {}
  const html = await injectSSRHtml(apiContext, () =>
    ReactDom.renderToString(
      <ApiProvider context={apiContext}>
        <StaticRouter location={url} context={routerContext}>
          <App />
        </StaticRouter>
      </ApiProvider>
    )
  )
  return html
}
```

#### Load the cached api data

```jsx
// loadApiCache
// TBD...
```

#### SSR Settings

TBD...

## Credits

`react-use-api` is heavily inspired by [axios-hooks](https://github.com/simoneb/axios-hooks). We appreciate it so much.

Since the code architecture and SSR support are very different from axios-hooks, we have to create this package to provide more functionality instead of filing PRs to axios-hooks.

## Test

TBD... not done yet (UT and CI)

## License

MIT
