import { PrismaClient } from '@prisma/client/edge'
import { PrismaD1 } from '@prisma/adapter-d1'
import { getCloudflareContext } from '@opennextjs/cloudflare'

// Global interface for Prisma instance
interface CustomNodeGlobal extends Global {
  prisma: PrismaClient
}

declare const global: CustomNodeGlobal

function createPrismaClient(): PrismaClient {
  // 1. Try Cloudflare Context (Production D1)
  try {
    const context = getCloudflareContext();
    const env = context.env as any;

    if (env && env.DB) {
      console.log("Initializing Prisma with Cloudflare D1 adapter");
      const adapter = new PrismaD1(env.DB);
      return new PrismaClient({ 
        adapter,
        log: ['error', 'warn']
      });
    }
  } catch (err) {
    // Expected during build or local dev without bindings
  }

  // 2. Try Local SQLite (Development)
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { PrismaBetterSqlite3 } = eval('require')('@prisma/adapter-better-sqlite3');
      const Database = eval('require')('better-sqlite3');
      const path = eval('require')('path');
      
      const dbFile = process.env.DATABASE_URL?.replace('file:', '') ?? './dev.db';
      const resolvedPath = path.resolve(process.cwd(), dbFile);
      const sqlite = new Database(resolvedPath);
      const adapter = new PrismaBetterSqlite3(sqlite);
      return new PrismaClient({ adapter });
    } catch (err) {
      console.warn("Local SQLite adapter not found or failed.", err);
    }
  }

  // 3. Fallback for Build-time
  const mockAdapter = {
    provider: 'sqlite',
    adapterName: 'mock-build-adapter',
    queryRaw: async () => ({ columns: [], rows: [] }),
    executeRaw: async () => 0,
  } as any;

  return new PrismaClient({ adapter: mockAdapter });
}

// Ensure Prisma client is a singleton in production (Edge) and development
export const prisma = (globalThis as any).prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  (globalThis as any).prisma = prisma;
} else if (!(globalThis as any).prisma) {
  // Even in Edge, we can try to cache the instance in globalThis
  (globalThis as any).prisma = prisma;
}
