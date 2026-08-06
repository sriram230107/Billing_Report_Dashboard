import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const dbUrl = `file:${dbPath}`;
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Settings
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      invoicePrefix: "INV-2026-",
      invoiceStartNo: 1,
      defaultGstRate: 5.0,
      enableEwayBill: true,
      ewayThreshold: 50000.0,
      trackInventory: true
    }
  });

  // 2. Business Profile
  await prisma.businessProfile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "ASP SILKS",
      address: "123, Handloom Bazaar, Coimbatore",
      phone: "9876543210, 0422-2345678",
      email: "contact@aspsilks.com",
      gstin: "33BVNPP6530P1ZW",
      state: "33-Tamil Nadu",
      bankName: "State Bank of India",
      bankBranch: "Coimbatore Main Branch",
      bankAccountNo: "30012345678",
      bankIfsc: "SBIN0001234",
      bankHolderName: "ASP SILKS",
      terms: "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged after due date.\n3. Subject to Coimbatore Jurisdiction.",
      logo: "" // Empty logo initially
    }
  });

  // 3. Customer Master (R.K. SILKS)
  await prisma.customer.create({
    data: {
      name: "R.K. SILKS",
      address: "456, Textile Street, Coimbatore",
      contact: "9443212345",
      gstin: "33ABKFR6818E1Z4",
      state: "33-Tamil Nadu",
      balance: 0.0
    }
  });

  await prisma.customer.create({
    data: {
      name: "MYSORE SAREE HOUSE",
      address: "789, Silk Palace Road, Bangalore",
      contact: "9887766554",
      gstin: "29AAAAA1111A1Z1",
      state: "29-Karnataka",
      balance: 0.0
    }
  });

  // 4. Item Master
  const items = [
    {
      name: "SOFT SILK BUTT ALBUM FOLD",
      designNo: "D-1024",
      hsnCode: "500720",
      unit: "Pcs",
      price: 2450.00,
      gstRate: 5.0,
      stock: 120.0,
      trackStock: true,
      minStock: 10.0
    },
    {
      name: "KANCHIPURAM PATTU SAREE",
      designNo: "KP-789",
      hsnCode: "500720",
      unit: "Pcs",
      price: 6800.00,
      gstRate: 5.0,
      stock: 45.0,
      trackStock: true,
      minStock: 5.0
    },
    {
      name: "BANARASI GEORGETTE SILK",
      designNo: "BG-512",
      hsnCode: "500720",
      unit: "Pcs",
      price: 4200.00,
      gstRate: 5.0,
      stock: 30.0,
      trackStock: true,
      minStock: 5.0
    },
    {
      name: "SILK THREADS EMBROIDERY",
      designNo: "STE-05",
      hsnCode: "500720",
      unit: "Mtr",
      price: 180.00,
      gstRate: 12.0,
      stock: 500.0,
      trackStock: true,
      minStock: 50.0
    }
  ];

  for (const item of items) {
    await prisma.item.create({ data: item });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
