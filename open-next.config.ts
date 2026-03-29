import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// @ts-expect-error - Ensure compatibility with the builder's expected types regardless of the local environment
export default defineCloudflareConfig({
  edgeExternals: ["node:crypto"],
});
