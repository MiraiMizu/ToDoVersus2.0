import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // This explicitly defines the configuration to avoid interactive prompts during CI build
  edgeExternals: ["node:crypto"],
});
