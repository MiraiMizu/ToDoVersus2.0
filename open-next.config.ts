import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Force rebuild - 5e842ad cleanup
export default defineCloudflareConfig({
  edgeExternals: ["node:crypto"],
});
