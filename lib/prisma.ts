import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // 1. Try Cloudflare Context (Production D1)
  try {
    const context = getCloudflareContext();
    const env = context.env as any;

    if (env && env.DB) {
      const adapter = new PrismaD1(env.DB);
      return new PrismaClient({ adapter });
    }
  } catch (err) {
    // Context not found (expected during build or local dev without bindings)
  }

  // 2. Try Local SQLite (Development)
  if (process.env.NODE_ENV !== 'production') {
    try {
      // We use eval('require') to hide these native modules from the Cloudflare/OpenNext bundler.
      // These are only used in local development.
      const { PrismaBetterSqlite3 } = eval('require')('@prisma/adapter-better-sqlite3');
      const Database = eval('require')('better-sqlite3');
      const path = eval('require')('path');
      
      const dbFile = process.env.DATABASE_URL?.replace('file:', '') ?? './dev.db';
      const resolvedPath = path.resolve(process.cwd(), dbFile);
      const sqlite = new Database(resolvedPath);
      const adapter = new PrismaBetterSqlite3(sqlite);
      return new PrismaClient({ adapter });
    } catch (err) {
      console.warn("Local SQLite adapter not found or failed to initialize.", err);
    }
  }

  // 3. Fallback for Build-time: Prisma v7 requires an adapter if driverAdapters is enabled.
  // We provide a minimal mock adapter to satisfy the constructor during 'next build'.
  const mockAdapter = {
    provider: 'sqlite',
    adapterName: 'mock-build-adapter',
    queryRaw: async () => ({ columns: [], rows: [] }),
    executeRaw: async () => 0,
  } as any;

  return new PrismaClient({ adapter: mockAdapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
