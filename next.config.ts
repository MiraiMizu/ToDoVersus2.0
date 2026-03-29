import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  serverExternalPackages: ["@prisma/client", "prisma", 'better-sqlite3'],
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@vercel/og/dist/canvas.node.js",
      "node_modules/@vercel/og/dist/index.edge.js",
      "node_modules/@vercel/og/wasm/*.wasm",
      "node_modules/canvas/build/Release/canvas.node",
      "node_modules/sharp/build/Release/sharp-linux-x64.node",
      "node_modules/.prisma/client/libquery_engine-*.node",
      "node_modules/.prisma/client/query-engine-*.exe",
      "node_modules/prisma/libquery_engine-*.node",
      "node_modules/@prisma/engines/*.node"
    ]
  },
};

export default nextConfig;
