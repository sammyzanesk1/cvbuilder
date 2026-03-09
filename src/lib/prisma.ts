import { PrismaClient } from "@prisma/client";

/*This prevents Prisma from creating too many connections during hot reload in development (Next.js reloads a lot)*/

const PrismaClientSingleton = () => {
  return new PrismaClient({
    log: ["query", "warn", "error"],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof PrismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? PrismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
