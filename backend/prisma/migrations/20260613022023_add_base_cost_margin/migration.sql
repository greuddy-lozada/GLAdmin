-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "dollarPrice" REAL,
    "baseCost" REAL,
    "margin" REAL NOT NULL DEFAULT 20,
    "idTax" INTEGER,
    "observation" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_idTax_fkey" FOREIGN KEY ("idTax") REFERENCES "Tax" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("available", "code", "createdAt", "dollarPrice", "id", "idTax", "image", "name", "observation", "organizationId", "price", "updatedAt", "version") SELECT "available", "code", "createdAt", "dollarPrice", "id", "idTax", "image", "name", "observation", "organizationId", "price", "updatedAt", "version" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_organizationId_idx" ON "Product"("organizationId");
CREATE INDEX "Product_organizationId_available_idx" ON "Product"("organizationId", "available");
CREATE INDEX "Product_organizationId_updatedAt_idx" ON "Product"("organizationId", "updatedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
