import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// @ts-ignore - Bypass strict property check for dangerousDisableConfigValidation
export default defineCloudflareConfig({
  // @ts-ignore
  dangerousDisableConfigValidation: true,
  edgeExternals: ["node:crypto"],
});
