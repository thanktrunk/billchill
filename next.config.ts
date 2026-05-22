import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'; connect-src 'self' https://*.auth0.com" },
        ],
      },
    ];
  },
};

const config = withNextIntl(nextConfig);

// next-intl's webpack fallback is registered when the TURBOPACK env var is not
// set at config-evaluation time (e.g. Vercel's build environment). Vercel's
// modifyConfig may invoke the webpack function with config.context = undefined,
// which causes path.resolve(undefined, …) to throw ERR_INVALID_ARG_TYPE.
// Guard against that here so those incidental invocations are safely skipped.
if (config.webpack) {
  const originalWebpack = config.webpack;
  config.webpack = (webpackConfig, ctx) => {
    if (!webpackConfig.context) return webpackConfig;
    return originalWebpack(webpackConfig, ctx);
  };
}

export default config;
