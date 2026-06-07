-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Stock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idProduct" INTEGER NOT NULL,
    "idSupplier" INTEGER,
    "idBatch" INTEGER,
    "idPurchaseOrder" INTEGER,
    "existence" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "Stock_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Stock_idProduct_fkey" FOREIGN KEY ("idProduct") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Stock_idSupplier_fkey" FOREIGN KEY ("idSupplier") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Stock_idBatch_fkey" FOREIGN KEY ("idBatch") REFERENCES "Batch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Stock_idPurchaseOrder_fkey" FOREIGN KEY ("idPurchaseOrder") REFERENCES "PurchaseOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Stock" ("available", "createdAt", "existence", "id", "idBatch", "idProduct", "idSupplier", "organizationId", "updatedAt", "version") SELECT "available", "createdAt", "existence", "id", "idBatch", "idProduct", "idSupplier", "organizationId", "updatedAt", "version" FROM "Stock";
DROP TABLE "Stock";
ALTER TABLE "new_Stock" RENAME TO "Stock";
CREATE INDEX "Stock_organizationId_idx" ON "Stock"("organizationId");
CREATE INDEX "Stock_organizationId_available_idx" ON "Stock"("organizationId", "available");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
