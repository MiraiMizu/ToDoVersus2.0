import { PrismaD1 } from '@prisma/adapter-d1'
import { PrismaClient } from '@prisma/client'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  let env;
  try {
    const context = getCloudflareContext();
    env = context.env;
  } catch (err) {
    console.warn("Cloudflare context not found. Make sure you are running 'npm run dev' and next.config.ts calls initOpenNextCloudflareForDev().", err);
    throw new Error("Missing Cloudflare Context");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfEnv = env as any;

  if (!cfEnv || !cfEnv.DB) {
    throw new Error("D1 Database binding 'DB' not found in Cloudflare context.");
  }

  const adapter = new PrismaD1(cfEnv.DB);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
