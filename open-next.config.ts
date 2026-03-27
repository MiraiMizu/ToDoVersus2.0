import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig({
  // Disable unused caching features to save space and reduce complexity
  incrementalCache: "dummy",
  tagCache: "dummy",
  queue: "dummy",
});

// Enable global minification for all functions
config.default.minify = true;

// Configure Function Splitting to stay under the 3MB limit on Free plan
// Each function will be a separate Worker version
config.functions = {
  auth: {
    // Routes for login, registration and authentication
    routes: [
      "app/login/page",
      "app/register/page",
      "app/api/auth/[...nextauth]/route",
      "app/api/auth/register/route"
    ],
    patterns: ["/login", "/register", "/api/auth/*"],
    minify: true,
  },
  main: {
    // Core dashboard, landing and system pages
    routes: [
      "app/(main)/dashboard/page",
      "app/(main)/achievements/page",
      "app/(main)/leaderboard/page",
      "app/page",
      "app/_not-found/page",
      "app/_global-error/page",
      "app/favicon.ico/route"
    ],
    patterns: ["/dashboard", "/achievements", "/leaderboard", "/", "/_not-found", "/_global-error", "/favicon.ico"],
    minify: true,
  },
  social: {
    // Matches, profiles and user search
    routes: [
      "app/(main)/matches/page",
      "app/(main)/matches/new/page",
      "app/(main)/matches/[id]/page",
      "app/(main)/profile/[id]/page",
      "app/api/users/search/route",
      "app/api/users/[id]/route"
    ],
    patterns: ["/matches*", "/profile*", "/api/users/*"],
    minify: true,
  },
  api: {
    // Core data APIs
    routes: [
      "app/api/activities/route",
      "app/api/categories/route",
      "app/api/scores/daily/route",
      "app/api/scores/leaderboard/route",
      "app/api/matches/route",
      "app/api/matches/[id]/route",
      "app/api/matches/[id]/respond/route",
      "app/api/matches/[id]/bet/route",
      "app/api/achievements/route"
    ],
    patterns: ["/api/activities", "/api/categories", "/api/scores/*", "/api/matches/*", "/api/achievements"],
    minify: true,
  }
};

// Aggressively disable internal caches in dangerous options
config.dangerous = {
  disableTagCache: true,
  disableIncrementalCache: true,
};

export default config;
