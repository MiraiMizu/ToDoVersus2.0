import { PrismaD1 } from '@prisma/adapter-d1'
import { PrismaClient } from '@prisma/client'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  try {
    // getCloudflareContext() works at runtime on Cloudflare and during 'next dev'
    const context = getCloudflareContext();
    const env = context.env as any;

    if (env && env.DB) {
      const adapter = new PrismaD1(env.DB);
      return new PrismaClient({ adapter });
    }
  } catch (err) {
    // This block catches cases where getCloudflareContext() is called during 'next build' 
    // or in other Node.js environments where the Cloudflare context is unavailable.
    console.warn(
      "Cloudflare context not found during Prisma initialization. " +
      "This is expected during 'next build'. Using default PrismaClient."
    );
  }

  // Fallback to standard PrismaClient (uses provider/url from schema or prisma.config.ts)
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
