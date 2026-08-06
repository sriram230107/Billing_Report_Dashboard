-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "gstin" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankBranch" TEXT NOT NULL,
    "bankAccountNo" TEXT NOT NULL,
    "bankIfsc" TEXT NOT NULL,
    "bankHolderName" TEXT NOT NULL,
    "logo" TEXT,
    "upiId" TEXT,
    "terms" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "gstin" TEXT,
    "state" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "designNo" TEXT,
    "hsnCode" TEXT NOT NULL DEFAULT '500720',
    "unit" TEXT NOT NULL DEFAULT 'Pcs',
    "price" REAL NOT NULL DEFAULT 0.0,
    "gstRate" REAL NOT NULL DEFAULT 5.0,
    "stock" REAL NOT NULL DEFAULT 0.0,
    "trackStock" BOOLEAN NOT NULL DEFAULT false,
    "minStock" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNo" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "ewayBillNo" TEXT,
    "placeOfSupply" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Unpaid',
    "paymentMode" TEXT,
    "paymentDate" DATETIME,
    "amountPaid" REAL NOT NULL DEFAULT 0.0,
    "subTotal" REAL NOT NULL,
    "totalTax" REAL NOT NULL,
    "roundOff" REAL NOT NULL DEFAULT 0.0,
    "grandTotal" REAL NOT NULL,
    "grandTotalWords" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerAddress" TEXT NOT NULL,
    "customerContact" TEXT NOT NULL,
    "customerGstin" TEXT,
    "customerState" TEXT NOT NULL,
    "terms" TEXT NOT NULL,
    "bankDetails" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "itemId" TEXT,
    "name" TEXT NOT NULL,
    "designNo" TEXT,
    "hsnCode" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "gstRate" REAL NOT NULL,
    "gstAmount" REAL NOT NULL,
    "lineTotal" REAL NOT NULL,
    CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvoiceItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV-2026-',
    "invoiceStartNo" INTEGER NOT NULL DEFAULT 1,
    "defaultGstRate" REAL NOT NULL DEFAULT 5.0,
    "enableEwayBill" BOOLEAN NOT NULL DEFAULT true,
    "ewayThreshold" REAL NOT NULL DEFAULT 50000.0,
    "trackInventory" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");
