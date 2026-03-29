import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  dangerousDisableConfigValidation: true,
  edgeExternals: ["node:crypto"],
});
