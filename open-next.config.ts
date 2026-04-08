import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config: any = defineCloudflareConfig({
  // Use the defaults, everything is now Edge runtime
});

config.cloudflare = {
  ...config.cloudflare,
  dangerousDisableConfigValidation: true,
  nodeBuiltins: true,
};

// We don't need manual functions anymore because 
// everything is now 'edge' runtime at the page level.
// OpenNext will automatically create bundles for them.

export default config;
