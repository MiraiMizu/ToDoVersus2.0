import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export function getDb() {
  try {
    const context = getCloudflareContext();
    const env = context.env as any;
    if (env && env.DB) {
      return drizzle(env.DB, { schema });
    }
  } catch (e) {
    // Falls back to error if not in CF context
    console.error('Failed to get D1 database context:', e);
  }

  throw new Error('Database connection failed: D1 binding not found. Ensure you are running in a Cloudflare environment.');
}



