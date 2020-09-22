## [2.5.1](https://github.com/RyanRoll/react-use-api/compare/v2.5.0...v2.5.1) (2020-09-22)


### Bug Fixes

* **SSR:** show console error instead of throw errors for Maximum executing times while fetching axio ([ea839f4](https://github.com/RyanRoll/react-use-api/commit/ea839f4a8e6127bba912d51ada50c1a98efa4fcb))

# [2.5.0](https://github.com/RyanRoll/react-use-api/compare/v2.4.1...v2.5.0) (2020-09-14)


### Features

* **useCache:** update readme and provide more details ([#19](https://github.com/RyanRoll/react-use-api/issues/19)) ([e1485ac](https://github.com/RyanRoll/react-use-api/commit/e1485ac71d3595f71b1dab8fb8dafb9115960bea))

## [2.4.1](https://github.com/RyanRoll/react-use-api/compare/v2.4.0...v2.4.1) (2020-09-01)


### Bug Fixes

* **pre-release:** add new option - useCache ([75e9222](https://github.com/RyanRoll/react-use-api/commit/75e92221e7e51c1b59dcd547f18a05a57db7a260))

# [2.4.0](https://github.com/RyanRoll/react-use-api/compare/v2.3.1...v2.4.0) (2020-08-06)


### Features

* **TypeScript:** Custom data type support ([#17](https://github.com/RyanRoll/react-use-api/issues/17)) ([366a7de](https://github.com/RyanRoll/react-use-api/commit/366a7de95c94b1d46d46fda61d0caba0e06ccc0e))

## [2.3.1](https://github.com/RyanRoll/react-use-api/compare/v2.3.0...v2.3.1) (2020-06-29)


### Bug Fixes

* **hotfix:** make ssr work ([713a103](https://github.com/RyanRoll/react-use-api/commit/713a10375c6da9d9508e08e70e59b7f087c8509a))

# [2.3.0](https://github.com/RyanRoll/react-use-api/compare/v2.2.0...v2.3.0) (2020-06-29)


### Features

* **options:** add a new option "skip" to avoid calling API ([8f25d60](https://github.com/RyanRoll/react-use-api/commit/8f25d6008f800c562e9239b84538f7698d80538d))

# [2.2.0](https://github.com/RyanRoll/react-use-api/compare/v2.1.2...v2.2.0) (2019-11-25)


### Features

* **#7:** add an argument postProcess for injectSSRHtml ([48f78b4](https://github.com/RyanRoll/react-use-api/commit/48f78b4)), closes [#7](https://github.com/RyanRoll/react-use-api/issues/7)

## [2.1.2](https://github.com/RyanRoll/react-use-api/compare/v2.1.1...v2.1.2) (2019-11-07)


### Bug Fixes

* **injectSSRHtml:** bug fix where the arguments of shouldUseApiCache were wrong ([d7d6d13](https://github.com/RyanRoll/react-use-api/commit/d7d6d13))

## [2.1.1](https://github.com/RyanRoll/react-use-api/compare/v2.1.0...v2.1.1) (2019-11-07)


### Bug Fixes

* **injectSSRHtml:** rule the uncached data out by shouldUseApiCache() ([6702a6c](https://github.com/RyanRoll/react-use-api/commit/6702a6c))

# [2.1.0](https://github.com/RyanRoll/react-use-api/compare/v2.0.0...v2.1.0) (2019-09-28)


### Features

* **useApi:** add shouldUseApiCache to enable/disable the particular requests ([8ee5e0e](https://github.com/RyanRoll/react-use-api/commit/8ee5e0e))

# [2.0.0](https://github.com/RyanRoll/react-use-api/compare/v1.1.0...v2.0.0) (2019-09-23)


### Features

* **useApi:** Bug fix and trigger CI again ([634b612](https://github.com/RyanRoll/react-use-api/commit/634b612))


### BREAKING CHANGES

* **useApi:** revert keepState=false for request()

# [1.1.0](https://github.com/RyanRoll/react-use-api/compare/v1.0.8...v1.1.0) (2019-09-22)


### Features

* **useApi:** add a new property `fromCache` for state data ([cacecf8](https://github.com/RyanRoll/react-use-api/commit/cacecf8))

## [1.0.8](https://github.com/RyanRoll/react-use-api/compare/v1.0.7...v1.0.8) (2019-08-21)


### Bug Fixes

* **npm:** try to publish a new npm version since 1.0.7 has been swallowed by npm ([476d2c9](https://github.com/RyanRoll/react-use-api/commit/476d2c9))

## [1.0.7](https://github.com/RyanRoll/react-use-api/compare/v1.0.6...v1.0.7) (2019-08-20)


### Bug Fixes

* **shouldRequest:** A bug fix, the option shouldRequest did not work properly due to the previous fi ([8b5aa6a](https://github.com/RyanRoll/react-use-api/commit/8b5aa6a))

## [1.0.6](https://github.com/RyanRoll/react-use-api/compare/v1.0.5...v1.0.6) (2019-08-18)


### Bug Fixes

* **Unit Test:** add more info logs for debugging and adjust the associated test codes ([9fb6504](https://github.com/RyanRoll/react-use-api/commit/9fb6504))

## [1.0.5](https://github.com/RyanRoll/react-use-api/compare/v1.0.4...v1.0.5) (2019-08-18)


### Bug Fixes

* **readme:** update readme and code fix ([fb6ff87](https://github.com/RyanRoll/react-use-api/commit/fb6ff87))

## [1.0.4](https://github.com/RyanRoll/react-use-api/compare/v1.0.3...v1.0.4) (2019-08-17)


### Bug Fixes

* **readme:** amend readme and add threshold for coverage ([008f3b0](https://github.com/RyanRoll/react-use-api/commit/008f3b0))

## [1.0.3](https://github.com/RyanRoll/react-use-api/compare/v1.0.2...v1.0.3) (2019-08-17)


### Bug Fixes

* update readme ([e77eaf3](https://github.com/RyanRoll/react-use-api/commit/e77eaf3))

## [1.0.2](https://github.com/RyanRoll/react-use-api/compare/v1.0.1...v1.0.2) (2019-08-17)


### Bug Fixes

* **semantic-release:** Add two plugins of semantic-release ([5f1f54d](https://github.com/RyanRoll/react-use-api/commit/5f1f54d))
