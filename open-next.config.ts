import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config: any = defineCloudflareConfig({
  // No overrides here, just use the defaults
});

config.cloudflare = {
  ...config.cloudflare,
  dangerousDisableConfigValidation: true,
};

config.functions = {
  og: {
    routes: ["app/api/og/match/[id]/route"],
    patterns: ["api/og/match/*"],
    runtime: "edge",
  },
  dashboard: {
    routes: ["app/(main)/dashboard/page"],
    patterns: ["dashboard"],
    runtime: "edge",
  },
};

export default config;
