import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig({
  // Disable caching features that aren't being used to save space
  incrementalCache: "dummy",
  tagCache: "dummy",
  queue: "dummy",
});

// Enable minification - this is the most important step for stays under 3MB
config.default.minify = true;

// Aggressively disable internal caches
config.dangerous = {
  disableTagCache: true,
  disableIncrementalCache: true,
};

export default config;
