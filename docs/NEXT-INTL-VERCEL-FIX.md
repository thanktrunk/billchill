# next-intl Vercel Build Fix

## Problem

Vercel builds fail with:

```
TypeError: The "path" argument must be of type string. Received undefined
  code: 'ERR_INVALID_ARG_TYPE'
```

## Root Cause

`next-intl`'s plugin (`next-intl/plugin`) registers a webpack fallback function when the `TURBOPACK` environment variable is not set at config-evaluation time. On Vercel, `TURBOPACK` isn't set when `next.config.ts` is loaded, even though Turbopack is used for the actual build (Next.js 16 default).

Inside the webpack function, `next-intl` calls:

```js
path.resolve(config.context, resolveI18nPath(...))
```

Vercel's internal `modifyConfig` step invokes this webpack function with `config.context = undefined`, causing `path.resolve(undefined, ...)` to throw `ERR_INVALID_ARG_TYPE`.

## Resolution

Wrap the webpack function in `next.config.ts` to guard against undefined `config.context`:

```ts
const config = withNextIntl(nextConfig);

if (config.webpack) {
  const originalWebpack = config.webpack;
  config.webpack = (webpackConfig, ctx) => {
    if (!webpackConfig.context) return webpackConfig;
    return originalWebpack(webpackConfig, ctx);
  };
}

export default config;
```

Alternatively (or additionally), set `TURBOPACK=1` in Vercel's environment variables so `next-intl` skips registering the webpack fallback entirely.

## Affected Version

- `next-intl` 4.12.0
- `next` 16.2.6
