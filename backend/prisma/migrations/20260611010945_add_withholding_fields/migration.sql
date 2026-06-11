-- AlterTable
ALTER TABLE "Sale" ADD COLUMN "totalTax" REAL;
ALTER TABLE "Sale" ADD COLUMN "totalTaxUsd" REAL;
ALTER TABLE "Sale" ADD COLUMN "withholdingAmount" REAL;
ALTER TABLE "Sale" ADD COLUMN "withholdingAmountUsd" REAL;
ALTER TABLE "Sale" ADD COLUMN "withholdingPercentage" REAL;

-- AlterTable
ALTER TABLE "SalesDet" ADD COLUMN "taxAmount" REAL;
ALTER TABLE "SalesDet" ADD COLUMN "taxAmountUsd" REAL;
ALTER TABLE "SalesDet" ADD COLUMN "taxName" TEXT;
ALTER TABLE "SalesDet" ADD COLUMN "taxPercentage" REAL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idCardNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "address" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "isWithholdingAgent" BOOLEAN NOT NULL DEFAULT false,
    "withholdingPercentage" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("address", "available", "createdAt", "email", "firstName", "id", "idCardNumber", "lastName", "organizationId", "phoneNumber", "updatedAt", "version") SELECT "address", "available", "createdAt", "email", "firstName", "id", "idCardNumber", "lastName", "organizationId", "phoneNumber", "updatedAt", "version" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE INDEX "Customer_organizationId_idx" ON "Customer"("organizationId");
CREATE INDEX "Customer_organizationId_available_idx" ON "Customer"("organizationId", "available");
CREATE INDEX "Customer_organizationId_updatedAt_idx" ON "Customer"("organizationId", "updatedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
