import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3'],
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@vercel/og/**',
      'node_modules/next/dist/compiled/@vercel/og/resvg.wasm',
      'node_modules/next/dist/compiled/@vercel/og/yoga.wasm',
      'node_modules/next/dist/compiled/@vercel/og/index.edge.js'
    ],
  },
};

export default nextConfig;
