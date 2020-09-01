<div align="center">
  <h1>
    <img width="120" src="./icon.svg">
    <br/>
    React Use API
    <br />
    <br />
  </h1>
</div>

[![npm](https://img.shields.io/npm/v/react-use-api?style=for-the-badge&label=version&color=e56565)](https://www.npmjs.com/package/react-use-api)
[![Build Status](https://img.shields.io/travis/ryanroll/react-use-api/master?style=for-the-badge)](https://travis-ci.org/RyanRoll/react-use-api)
[![Coverage Status](https://img.shields.io/coveralls/github/RyanRoll/react-use-api/master?style=for-the-badge)](https://coveralls.io/github/RyanRoll/react-use-api?branch=master)
![npm type definitions](https://img.shields.io/npm/types/react-use-api?style=for-the-badge&color=0277BD)
![GitHub](https://img.shields.io/github/license/RyanRoll/react-use-api?style=for-the-badge&color=5C6BC0)

[Axios](https://github.com/axios/axios)-based React hooks for async HTTP request data. `react-use-api` feeds API data to React components when SSR (Server-Side Rendering), and caches the data to Front-End. This is designed for diverse UI states and also a good solution if your app is based on [create-react-app](https://create-react-app.dev).

> TypeScript Support

> Thread-safe SSR

## Installation

❗*Axios is a peer dependency (prerequisite) and it has to be installed*

#### NPM

```sh
$ npm i react-use-api axios
```

#### Yarn

```sh
$ yarn add react-use-api axios
```

## Gitbook Document

[https://react-use-api.gitbook.io/react-use-api/](https://react-use-api.gitbook.io/react-use-api/)

## Usage

### With ApiProvider

```jsx
import React from 'react'
import ReactDom from 'react-dom'
import useApi, { ApiProvider } from 'react-use-api'

import App from './App'

// there is only one props "context", which is must given for SSR,
// client side can omit it
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
    url: '/api/foo/bar',
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
import React, { useState, useMemo, useCallback } from 'react'
import useApi from 'react-use-api'

export const Main = () => {
  const [offset, setOffset] = useState(0)
  const limit = 10
  const options = useMemo(
    () => ({
      handleData,
      dependencies: {
        limit,
      },
    }),
    [limit]
  )
  // hasMore is a custom state here
  const [data, { loading, error, hasMore = true }, request] = useApi(
    getAPiList(),
    options
  )
  const loadMore = useCallback(() => {
    const nextOffset = offset + limit
    // fetch the data and keep the state and prevData
    request(getAPiList(nextOffset, limit), true)
    setOffset(nextOffset)
  }, [offset])

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
    limit,
  },
})

// [IMPORTANT] Using any state setter in handleData is not allowed,
// it will cause the component re-rendering infinitely while SSR rendering.
export const handleData = (state) => {
  const { prevData = [], response, dependencies, error } = state
  if (!error) {
    const {
      data: { userList },
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

#### Types

```ts
const [data, state, request] = useApi<D = ReactUseApi.Data>(
  config: string | ReactUseApi.SingleConfig | ReactUseApi.MultiConfigs,
  opt?: ReactUseApi.Options | ReactUseApi.Options['handleData']
)
```

#### Code

```jsx
const [data, state, request] = useApi(config, options)

// request the API data again
request(config?: ReactUseApi.Config, keepState = false)
```

With a custom TypeScript data type

```tsx
interface IMyData {
  foo: string
  bar: string
}
const [data, state, request] = useApi<IMyData>(config, options)
```

### Config

The config can be an [Axios Request Config](https://github.com/axios/axios#request-config) or a URL string.

```jsx
const [data, state] = useApi('/api/foo/bar')
// equals to
const [data, state] = useApi({
  url: '/api/foo/bar',
})
```

### Options [Optional]

| Name          | Type                                          | default | Description                                                                                                                                                                                                          |
| ------------- | --------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| handleData    | Function(data: any, state: ReactUseApi.State) |         | A callback function to deal with the data of the API's response. **IMPORTANT** Using any state setter in handleData is dangerous, which will cause the component re-rendering infinitely while SSR rendering.        |
| dependencies  | Object                                        |         | The additional needed data using in handleData. `NOTE`: "dependencies" is supposed to immutable due to React's rendering policy.                                                                                     |
| shouldRequest | Function                                      |         | A callback to decide whether useApi re-fetches the API when `only re-rendering`. Returning true will trigger useApi to re-fetch. This option is helpful if you want to re-request an API when a route change occurs. |
| watch         | any[]                                         | []      | An array of values that the effect depends on, this is the same as the second argument of useEffect.                                                                                                                 |
| skip          | Boolean                                       | false   | Sets true to skip API call.                                                                                                                                                                                          |

## State

#### First State (before calling API)

The first state has only one property `loading` before calling API.

| Name      | Type    | Default | Description                                       |
| --------- | ------- | ------- | ------------------------------------------------- |
| loading   | boolean | false   | To indicate whether calling api or not.           |
| fromCache | boolean | false   | To tell whether the data come from SSR API cache. |

#### Full State

The is the full state data structure after the api has responded.

| Name          | Type              | Default   | Description                                                                                                                                                                       |
| ------------- | ----------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| loading       | boolean           | false     | To indicate whether calling api or not.                                                                                                                                           |
| fromCache     | boolean           | false     | To tell whether the data come from SSR API cache.                                                                                                                                 |
| data          | any               | undefined | The processed data provided from `options.handleData`.                                                                                                                            |
| response      | AxiosResponse     | undefined | The Axios' response.                                                                                                                                                              |
| error         | AxiosError        | undefined | The Axios' error.                                                                                                                                                                 |
| dependencies  | Object            | undefined | The additional needed data using in handleData. `NOTE`: "dependencies" is supposed to immutable due to React's rendering policy.                                                  |
| prevData      | any               | undefined | The previous data of the previous state.                                                                                                                                          |
| prevState     | ReactUseApi.State | undefined | The previous state.                                                                                                                                                               |
| [custom data] | any               |           | You can add your own custom state data into the state by setting up in `options.handleData`. For example, `state.foo = 'bar'`. The data always be preserved whether re-rendering. |

#### Request Function

A function allows requesting API data again. This function will trigger re-render.

| Name      | Type               | Default                         | Description                                                                                                                       |
| --------- | ------------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| config    | ReactUseApi.Config | The config passed from useApi() | An axios' config object to fetch API data.                                                                                        |
| keepState | boolean            | false                           | Set to true to maintain current state data, which facilitates combining previous data with current data, such as table list data. |

## TypeScript Support

All the associated types are provided by the namespace [ReactUseApi](src/typings.d.ts) as long as importing `react-use-api`.

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
    // configure your global options or SSR settings
    settings: {
      axios, // your custom axios instance
      isSSR: () => true, // we are 100% sure here is SSR mode
    },
  }
  const routerContext = {}
  const renderSSR = () =>
    ReactDom.renderToString(
      <ApiProvider context={apiContext}>
        <StaticRouter location={url} context={routerContext}>
          <App />
        </StaticRouter>
      </ApiProvider>
    )
  const html = await injectSSRHtml(apiContext, renderSSR)
  return html
}
```

**The cache data is inserted into the html text as well.**

> The cache data will be cleaned up after calling loadApiCache() by default

```html
<script>
  window.__USE_API_CACHE__ = '[{ ... }]' // the cache data
</script>
```

#### SSR Settings of apiContext (ReactUseApi.CustomSettings)

_Each property is optional_

| Name              | Type                                      | Default                                                   | Description                                                                                                          |
| ----------------- | ----------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| cache             | LRU<String, ReactUseApi.CacheData \| any> | new LRU()                                                 | The cache instance based on lru-cache                                                                                |
| axios             | AxiosStatic \| AxiosInstance              | axios                                                     | axios instance (http client)                                                                                         |
| maxRequests       | number                                    | 50                                                        | The maximum of API requests when SSR                                                                                 |
| useCacheData      | boolean                                   | true                                                      | Set true to inject JS cache data into html when calling `injectSSRHtml()`                                            |
| debug             | boolean                                   | true                                                      | Set true to get debug message from console                                                                           |
| clientCacheVar    | string                                    | 'USE_API_CACHE'                                           | The JS variable name of cache data                                                                                   |
| renderSSR         | Function                                  | () => ''                                                  | A callback to render SSR string for injectSSRHtml()                                                                  |
| isSSR             | Function                                  | () => typeof window === 'undefined'                       | A function to determine if the current environment is server                                                         |
| shouldUseApiCache | Function                                  | (config?: ReactUseApi.Config, cacheKey?: string): boolean | Returns true to enable useApi to get the API data from API cache, which is loaded by `loadApiCache`. Default is true |

#### Arguments of injectSSRHtml

```ts
injectSSRHtml(
  context: ReactUseApi.CustomContext,
  renderSSR?: () => string,
  postProcess?: (ssrHtml: string, apiCacheScript: string) => string,
): string

```

#### SSR: Load cached API data

```jsx
// src/index.jsx
import React from 'react'
import ReactDOM from 'react-dom'
import { ApiProvider, loadApiCache } from 'react-use-api'

import App from './components/App'

const rootElement = document.getElementById('root')
const method = rootElement.hasChildNodes() ? 'hydrate' : 'render'

loadApiCache()

ReactDOM[method](
  <ApiProvider>
    <App />
  </ApiProvider>,
  rootElement
)
```

## Test

```bash
$ npm test
```

## License

MIT

## Credits

`react-use-api` is heavily inspired by [axios-hooks](https://github.com/simoneb/axios-hooks). We appreciate it so much.

Since the code architecture and SSR support are very different from axios-hooks, we have to create this package to provide more functionality instead of filing PRs to axios-hooks.

Icons made by [Eucalyp](https://www.flaticon.com/authors/eucalyp) from [www.flaticon.com](https://www.flaticon.com) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0).
