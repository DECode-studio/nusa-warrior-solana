import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prismaClientInstance?: PrismaClient;
};

export function isPrismaDriverEnabled(): boolean {
  return process.env.NUSANTARA_STORAGE_DRIVER === "prisma";
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be configured when Prisma storage is enabled.");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prismaClientInstance) {
      globalForPrisma.prismaClientInstance = createPrismaClient();
    }
    const client = globalForPrisma.prismaClientInstance as unknown as Record<
      string,
      unknown
    >;
    const val = client[prop as string];
    return typeof val === "function"
      ? (val as (...args: unknown[]) => unknown).bind(client)
      : val;
  },
});

