import { PrismaD1 } from '@prisma/adapter-d1'
import { PrismaClient } from '@prisma/client'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  try {
    const context = getCloudflareContext();
    const env = context.env as any;

    if (env && env.DB) {
      const adapter = new PrismaD1(env.DB);
      return new PrismaClient({ adapter });
    }
  } catch (err) {
    // This catches cases where getCloudflareContext() is called during 'next build'
    // or in other Node.js environments where the Cloudflare context is unavailable.
    console.warn(
      "Cloudflare context not found during Prisma initialization. " +
      "Using a mock adapter for build-time compatibility."
    );
  }

  // Fallback for build-time: Prisma v7 with driverAdapters requires an adapter.
  // We provide a minimal mock adapter that satisfies the constructor but does nothing.
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
