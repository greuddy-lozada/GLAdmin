-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PurchaseOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idSupplier" INTEGER NOT NULL,
    "code" TEXT,
    "date" DATETIME,
    "amount" REAL,
    "amountUsd" REAL,
    "baseAmount" REAL,
    "baseAmountUsd" REAL,
    "ivaAmount" REAL,
    "ivaAmountUsd" REAL,
    "exchangeRate" REAL,
    "exchangeRateId" INTEGER,
    "exchangeRateDayId" INTEGER,
    "officialExchangeRate" REAL,
    "officialExchangeRateId" INTEGER,
    "paymentMethod" INTEGER,
    "status" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "PurchaseOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_idSupplier_fkey" FOREIGN KEY ("idSupplier") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_exchangeRateId_fkey" FOREIGN KEY ("exchangeRateId") REFERENCES "ExchangeRate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_exchangeRateDayId_fkey" FOREIGN KEY ("exchangeRateDayId") REFERENCES "exchange_rate_days" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_officialExchangeRateId_fkey" FOREIGN KEY ("officialExchangeRateId") REFERENCES "ExchangeRate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseOrder" ("amount", "amountUsd", "baseAmount", "baseAmountUsd", "code", "createdAt", "date", "exchangeRate", "exchangeRateId", "id", "idSupplier", "ivaAmount", "ivaAmountUsd", "officialExchangeRate", "officialExchangeRateId", "organizationId", "paymentMethod", "status", "updatedAt", "version") SELECT "amount", "amountUsd", "baseAmount", "baseAmountUsd", "code", "createdAt", "date", "exchangeRate", "exchangeRateId", "id", "idSupplier", "ivaAmount", "ivaAmountUsd", "officialExchangeRate", "officialExchangeRateId", "organizationId", "paymentMethod", "status", "updatedAt", "version" FROM "PurchaseOrder";
DROP TABLE "PurchaseOrder";
ALTER TABLE "new_PurchaseOrder" RENAME TO "PurchaseOrder";
CREATE INDEX "PurchaseOrder_organizationId_idx" ON "PurchaseOrder"("organizationId");
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");
CREATE INDEX "PurchaseOrder_date_idx" ON "PurchaseOrder"("date");
CREATE INDEX "PurchaseOrder_code_idx" ON "PurchaseOrder"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
