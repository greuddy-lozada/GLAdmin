-- CreateTable
CREATE TABLE "Brand" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "Brand_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "idParent" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "Category_idParent_fkey" FOREIGN KEY ("idParent") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "idBrand" INTEGER,
    "idCategory" INTEGER,
    "observation" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_idTax_fkey" FOREIGN KEY ("idTax") REFERENCES "Tax" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_idBrand_fkey" FOREIGN KEY ("idBrand") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_idCategory_fkey" FOREIGN KEY ("idCategory") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("available", "baseCost", "code", "createdAt", "dollarPrice", "id", "idTax", "image", "margin", "name", "observation", "organizationId", "price", "updatedAt", "version") SELECT "available", "baseCost", "code", "createdAt", "dollarPrice", "id", "idTax", "image", "margin", "name", "observation", "organizationId", "price", "updatedAt", "version" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_organizationId_idx" ON "Product"("organizationId");
CREATE INDEX "Product_organizationId_available_idx" ON "Product"("organizationId", "available");
CREATE INDEX "Product_organizationId_updatedAt_idx" ON "Product"("organizationId", "updatedAt");
CREATE TABLE "new_PurchaseOrderDet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idPurchaseOrder" INTEGER NOT NULL,
    "idProduct" INTEGER NOT NULL,
    "quantity" INTEGER,
    "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" REAL,
    "unitPriceUsd" REAL,
    "subtotal" REAL,
    "subtotalUsd" REAL,
    "observation" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "PurchaseOrderDet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrderDet_idPurchaseOrder_fkey" FOREIGN KEY ("idPurchaseOrder") REFERENCES "PurchaseOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrderDet_idProduct_fkey" FOREIGN KEY ("idProduct") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseOrderDet" ("createdAt", "id", "idProduct", "idPurchaseOrder", "observation", "organizationId", "quantity", "subtotal", "subtotalUsd", "unitPrice", "unitPriceUsd", "updatedAt", "version") SELECT "createdAt", "id", "idProduct", "idPurchaseOrder", "observation", "organizationId", "quantity", "subtotal", "subtotalUsd", "unitPrice", "unitPriceUsd", "updatedAt", "version" FROM "PurchaseOrderDet";
DROP TABLE "PurchaseOrderDet";
ALTER TABLE "new_PurchaseOrderDet" RENAME TO "PurchaseOrderDet";
CREATE INDEX "PurchaseOrderDet_organizationId_idx" ON "PurchaseOrderDet"("organizationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Brand_organizationId_idx" ON "Brand"("organizationId");

-- CreateIndex
CREATE INDEX "Brand_organizationId_available_idx" ON "Brand"("organizationId", "available");

-- CreateIndex
CREATE INDEX "Category_organizationId_idx" ON "Category"("organizationId");

-- CreateIndex
CREATE INDEX "Category_organizationId_available_idx" ON "Category"("organizationId", "available");

-- CreateIndex
CREATE INDEX "Category_idParent_idx" ON "Category"("idParent");
