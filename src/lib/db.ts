import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  // Database URL is file:./dev.db
  const rawUrl = process.env.DATABASE_URL || "file:./dev.db";
  const dbFilename = rawUrl.replace("file:", "");
  const dbPath = path.isAbsolute(dbFilename) 
    ? dbFilename 
    : path.resolve(process.cwd(), dbFilename);

  const dbUrl = `file:${dbPath}`;
  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  prisma = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
}

export { prisma };
