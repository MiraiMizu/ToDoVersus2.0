import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Global cache for development
let dbCache: any = null;

export function getDb() {
  if (dbCache) return dbCache;

  let d1Db: any = null;
  if (process.env.NODE_ENV === 'production') {
    try {
      const context = getCloudflareContext();
      const env = context.env as any;
      if (env && env.DB) {
        d1Db = env.DB;
      }
    } catch (e) {
      // Ignore
    }
  }

  if (!d1Db) {
    // Development fallback mock
    d1Db = {
      prepare: () => ({
        bind: () => ({
          all: async () => ({ results: [] }),
          run: async () => ({ success: true }),
          first: async () => null,
        }),
        all: async () => ({ results: [] }),
        run: async () => ({ success: true }),
        first: async () => null,
      })
    };
  }

  const db = drizzle(d1Db, { schema });
  
  if (process.env.NODE_ENV !== 'production') {
    dbCache = db;
  }
  
  return db;
}
