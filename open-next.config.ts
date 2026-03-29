import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Splitting configuration for ToDoVersus.
 * This splits the application into 5 specialized workers to stay below the 3MiB limit.
 */
const rawConfig: any = {
  incrementalCache: "dummy",
  tagCache: "dummy",
  queue: "dummy",
  functions: {
    // Authentication logic (NextAuth, Login, Register)
    auth: {
      routes: ["app/api/auth/[...nextauth]/route", "app/api/auth/register/route", "app/login/page", "app/register/page"],
      patterns: ["/api/auth/*", "/login", "/register"],
    },
    // Main Data APIs (Achievements, Activities, Categories, Leaderboard, Users)
    api_core: {
      routes: [
        "app/api/achievements/route",
        "app/api/activities/route",
        "app/api/categories/route",
        "app/api/scores/daily/route",
        "app/api/scores/leaderboard/route",
        "app/api/users/search/route",
        "app/api/users/[id]/route"
      ],
      patterns: ["/api/achievements", "/api/activities", "/api/categories", "/api/scores/daily", "/api/scores/leaderboard", "/api/users/*"],
    },
    // Match logic (Active matches, creating matches, betting)
    matches: {
      routes: [
        "app/(main)/matches/page",
        "app/(main)/matches/new/page",
        "app/(main)/matches/[id]/page",
        "app/api/matches/route",
        "app/api/matches/[id]/route",
        "app/api/matches/[id]/respond/route",
        "app/api/matches/[id]/bet/route"
      ],
      patterns: ["/matches*", "/api/matches*"],
    },
    // Social and Achievement pages
    social_profile: {
      routes: ["app/(main)/leaderboard/page", "app/(main)/profile/[id]/page", "app/(main)/achievements/page"],
      patterns: ["/leaderboard", "/profile/*", "/achievements"],
    },
    // Dashboard and Landing page
    dashboard_main: {
      routes: ["app/(main)/dashboard/page", "app/page"],
      patterns: ["/dashboard", "/"],
    }
  },
  default: {
    minify: true,
  }
};

export default defineCloudflareConfig(rawConfig);
