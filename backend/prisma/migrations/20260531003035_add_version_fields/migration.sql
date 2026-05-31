-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AccountsPayable" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idPurchaseOrder" INTEGER NOT NULL,
    "dueDate" DATETIME,
    "issueDate" DATETIME,
    "amount" REAL,
    "amountUsd" REAL,
    "exchangeRate" REAL,
    "credit" REAL,
    "status" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "AccountsPayable_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccountsPayable_idPurchaseOrder_fkey" FOREIGN KEY ("idPurchaseOrder") REFERENCES "PurchaseOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AccountsPayable" ("amount", "amountUsd", "createdAt", "credit", "dueDate", "exchangeRate", "id", "idPurchaseOrder", "issueDate", "organizationId", "status", "updatedAt") SELECT "amount", "amountUsd", "createdAt", "credit", "dueDate", "exchangeRate", "id", "idPurchaseOrder", "issueDate", "organizationId", "status", "updatedAt" FROM "AccountsPayable";
DROP TABLE "AccountsPayable";
ALTER TABLE "new_AccountsPayable" RENAME TO "AccountsPayable";
CREATE INDEX "AccountsPayable_organizationId_idx" ON "AccountsPayable"("organizationId");
CREATE INDEX "AccountsPayable_status_idx" ON "AccountsPayable"("status");
CREATE TABLE "new_AccountsReceivable" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idSale" INTEGER,
    "dueDate" DATETIME,
    "issueDate" DATETIME,
    "amount" REAL,
    "amountUsd" REAL,
    "exchangeRate" REAL,
    "credit" REAL,
    "status" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "AccountsReceivable_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccountsReceivable_idSale_fkey" FOREIGN KEY ("idSale") REFERENCES "Sale" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AccountsReceivable" ("amount", "amountUsd", "createdAt", "credit", "dueDate", "exchangeRate", "id", "idSale", "issueDate", "organizationId", "status", "updatedAt") SELECT "amount", "amountUsd", "createdAt", "credit", "dueDate", "exchangeRate", "id", "idSale", "issueDate", "organizationId", "status", "updatedAt" FROM "AccountsReceivable";
DROP TABLE "AccountsReceivable";
ALTER TABLE "new_AccountsReceivable" RENAME TO "AccountsReceivable";
CREATE INDEX "AccountsReceivable_organizationId_idx" ON "AccountsReceivable"("organizationId");
CREATE INDEX "AccountsReceivable_status_idx" ON "AccountsReceivable"("status");
CREATE TABLE "new_Batch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "Batch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Batch" ("code", "createdAt", "description", "id", "organizationId", "updatedAt") SELECT "code", "createdAt", "description", "id", "organizationId", "updatedAt" FROM "Batch";
DROP TABLE "Batch";
ALTER TABLE "new_Batch" RENAME TO "Batch";
CREATE INDEX "Batch_organizationId_idx" ON "Batch"("organizationId");
CREATE TABLE "new_Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taxId" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "Company_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Company" ("address", "createdAt", "email", "id", "name", "organizationId", "phoneNumber", "taxId", "updatedAt", "website") SELECT "address", "createdAt", "email", "id", "name", "organizationId", "phoneNumber", "taxId", "updatedAt", "website" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE INDEX "Company_organizationId_idx" ON "Company"("organizationId");
CREATE INDEX "Company_organizationId_updatedAt_idx" ON "Company"("organizationId", "updatedAt");
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("address", "available", "createdAt", "email", "firstName", "id", "idCardNumber", "lastName", "organizationId", "phoneNumber", "updatedAt") SELECT "address", "available", "createdAt", "email", "firstName", "id", "idCardNumber", "lastName", "organizationId", "phoneNumber", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE INDEX "Customer_organizationId_idx" ON "Customer"("organizationId");
CREATE INDEX "Customer_organizationId_available_idx" ON "Customer"("organizationId", "available");
CREATE INDEX "Customer_organizationId_updatedAt_idx" ON "Customer"("organizationId", "updatedAt");
CREATE TABLE "new_Invite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "invitedById" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invite_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invite_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invite" ("code", "createdAt", "email", "expiresAt", "id", "invitedById", "organizationId", "roleId", "used") SELECT "code", "createdAt", "email", "expiresAt", "id", "invitedById", "organizationId", "roleId", "used" FROM "Invite";
DROP TABLE "Invite";
ALTER TABLE "new_Invite" RENAME TO "Invite";
CREATE UNIQUE INDEX "Invite_code_key" ON "Invite"("code");
CREATE INDEX "Invite_organizationId_idx" ON "Invite"("organizationId");
CREATE TABLE "new_License" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT,
    "idCompany" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN,
    "expiryDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "License_idCompany_fkey" FOREIGN KEY ("idCompany") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_License" ("available", "code", "createdAt", "expiryDate", "id", "idCompany", "updatedAt") SELECT "available", "code", "createdAt", "expiryDate", "id", "idCompany", "updatedAt" FROM "License";
DROP TABLE "License";
ALTER TABLE "new_License" RENAME TO "License";
CREATE TABLE "new_Organization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" TEXT,
    "planId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Organization_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Organization" ("createdAt", "id", "isActive", "name", "planId", "settings", "slug", "updatedAt") SELECT "createdAt", "id", "isActive", "name", "planId", "settings", "slug", "updatedAt" FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE TABLE "new_PagoMovilConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "exchangeRate" REAL NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PagoMovilConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PagoMovilConfig" ("bankId", "createdAt", "exchangeRate", "id", "idNumber", "isActive", "organizationId", "phoneNumber", "updatedAt") SELECT "bankId", "createdAt", "exchangeRate", "id", "idNumber", "isActive", "organizationId", "phoneNumber", "updatedAt" FROM "PagoMovilConfig";
DROP TABLE "PagoMovilConfig";
ALTER TABLE "new_PagoMovilConfig" RENAME TO "PagoMovilConfig";
CREATE UNIQUE INDEX "PagoMovilConfig_organizationId_key" ON "PagoMovilConfig"("organizationId");
CREATE INDEX "PagoMovilConfig_organizationId_idx" ON "PagoMovilConfig"("organizationId");
CREATE TABLE "new_PagoMovilTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "amountVes" REAL NOT NULL,
    "amountUsd" REAL NOT NULL,
    "bankId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "proofImage" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" INTEGER,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PagoMovilTransaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PagoMovilTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PagoMovilTransaction" ("amountUsd", "amountVes", "bankId", "createdAt", "id", "organizationId", "phoneNumber", "proofImage", "reference", "reviewedAt", "reviewedBy", "status", "updatedAt", "userId") SELECT "amountUsd", "amountVes", "bankId", "createdAt", "id", "organizationId", "phoneNumber", "proofImage", "reference", "reviewedAt", "reviewedBy", "status", "updatedAt", "userId" FROM "PagoMovilTransaction";
DROP TABLE "PagoMovilTransaction";
ALTER TABLE "new_PagoMovilTransaction" RENAME TO "PagoMovilTransaction";
CREATE INDEX "PagoMovilTransaction_organizationId_idx" ON "PagoMovilTransaction"("organizationId");
CREATE INDEX "PagoMovilTransaction_status_idx" ON "PagoMovilTransaction"("status");
CREATE TABLE "new_Plan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "interval" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "version" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Plan" ("amount", "createdAt", "currency", "features", "id", "interval", "isActive", "label", "maxUsers", "name", "updatedAt") SELECT "amount", "createdAt", "currency", "features", "id", "interval", "isActive", "label", "maxUsers", "name", "updatedAt" FROM "Plan";
DROP TABLE "Plan";
ALTER TABLE "new_Plan" RENAME TO "Plan";
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "dollarPrice" REAL,
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
INSERT INTO "new_Product" ("available", "code", "createdAt", "dollarPrice", "id", "idTax", "image", "name", "observation", "organizationId", "price", "updatedAt") SELECT "available", "code", "createdAt", "dollarPrice", "id", "idTax", "image", "name", "observation", "organizationId", "price", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_organizationId_idx" ON "Product"("organizationId");
CREATE INDEX "Product_organizationId_available_idx" ON "Product"("organizationId", "available");
CREATE INDEX "Product_organizationId_updatedAt_idx" ON "Product"("organizationId", "updatedAt");
CREATE TABLE "new_PurchaseOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idSupplier" INTEGER NOT NULL,
    "code" TEXT,
    "date" DATETIME,
    "amount" REAL,
    "amountUsd" REAL,
    "exchangeRate" REAL,
    "exchangeRateId" INTEGER,
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
    CONSTRAINT "PurchaseOrder_officialExchangeRateId_fkey" FOREIGN KEY ("officialExchangeRateId") REFERENCES "ExchangeRate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseOrder" ("amount", "amountUsd", "code", "createdAt", "date", "exchangeRate", "exchangeRateId", "id", "idSupplier", "officialExchangeRate", "officialExchangeRateId", "organizationId", "paymentMethod", "status", "updatedAt") SELECT "amount", "amountUsd", "code", "createdAt", "date", "exchangeRate", "exchangeRateId", "id", "idSupplier", "officialExchangeRate", "officialExchangeRateId", "organizationId", "paymentMethod", "status", "updatedAt" FROM "PurchaseOrder";
DROP TABLE "PurchaseOrder";
ALTER TABLE "new_PurchaseOrder" RENAME TO "PurchaseOrder";
CREATE INDEX "PurchaseOrder_organizationId_idx" ON "PurchaseOrder"("organizationId");
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");
CREATE INDEX "PurchaseOrder_date_idx" ON "PurchaseOrder"("date");
CREATE INDEX "PurchaseOrder_code_idx" ON "PurchaseOrder"("code");
CREATE TABLE "new_PurchaseOrderDet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idPurchaseOrder" INTEGER NOT NULL,
    "idProduct" INTEGER NOT NULL,
    "quantity" INTEGER,
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
INSERT INTO "new_PurchaseOrderDet" ("createdAt", "id", "idProduct", "idPurchaseOrder", "observation", "organizationId", "quantity", "subtotal", "subtotalUsd", "unitPrice", "unitPriceUsd", "updatedAt") SELECT "createdAt", "id", "idProduct", "idPurchaseOrder", "observation", "organizationId", "quantity", "subtotal", "subtotalUsd", "unitPrice", "unitPriceUsd", "updatedAt" FROM "PurchaseOrderDet";
DROP TABLE "PurchaseOrderDet";
ALTER TABLE "new_PurchaseOrderDet" RENAME TO "PurchaseOrderDet";
CREATE INDEX "PurchaseOrderDet_organizationId_idx" ON "PurchaseOrderDet"("organizationId");
CREATE TABLE "new_Sale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idCustomer" INTEGER,
    "code" TEXT,
    "date" DATETIME,
    "amount" REAL,
    "amountUsd" REAL,
    "exchangeRate" REAL,
    "exchangeRateId" INTEGER,
    "officialExchangeRate" REAL,
    "officialExchangeRateId" INTEGER,
    "paymentMethod" INTEGER,
    "status" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "Sale_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_idCustomer_fkey" FOREIGN KEY ("idCustomer") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_exchangeRateId_fkey" FOREIGN KEY ("exchangeRateId") REFERENCES "ExchangeRate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_officialExchangeRateId_fkey" FOREIGN KEY ("officialExchangeRateId") REFERENCES "ExchangeRate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("amount", "amountUsd", "code", "createdAt", "date", "exchangeRate", "exchangeRateId", "id", "idCustomer", "officialExchangeRate", "officialExchangeRateId", "organizationId", "paymentMethod", "status", "updatedAt") SELECT "amount", "amountUsd", "code", "createdAt", "date", "exchangeRate", "exchangeRateId", "id", "idCustomer", "officialExchangeRate", "officialExchangeRateId", "organizationId", "paymentMethod", "status", "updatedAt" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE INDEX "Sale_organizationId_idx" ON "Sale"("organizationId");
CREATE INDEX "Sale_status_idx" ON "Sale"("status");
CREATE INDEX "Sale_date_idx" ON "Sale"("date");
CREATE INDEX "Sale_code_idx" ON "Sale"("code");
CREATE TABLE "new_SalesDet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idSale" INTEGER NOT NULL,
    "idProduct" INTEGER NOT NULL,
    "quantity" INTEGER,
    "unitPrice" REAL,
    "unitPriceUsd" REAL,
    "subtotal" REAL,
    "subtotalUsd" REAL,
    "observation" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "SalesDet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesDet_idSale_fkey" FOREIGN KEY ("idSale") REFERENCES "Sale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesDet_idProduct_fkey" FOREIGN KEY ("idProduct") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SalesDet" ("createdAt", "id", "idProduct", "idSale", "observation", "organizationId", "quantity", "subtotal", "subtotalUsd", "unitPrice", "unitPriceUsd", "updatedAt") SELECT "createdAt", "id", "idProduct", "idSale", "observation", "organizationId", "quantity", "subtotal", "subtotalUsd", "unitPrice", "unitPriceUsd", "updatedAt" FROM "SalesDet";
DROP TABLE "SalesDet";
ALTER TABLE "new_SalesDet" RENAME TO "SalesDet";
CREATE INDEX "SalesDet_organizationId_idx" ON "SalesDet"("organizationId");
CREATE TABLE "new_Stock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idProduct" INTEGER NOT NULL,
    "idSupplier" INTEGER,
    "idBatch" INTEGER,
    "existence" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "Stock_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Stock_idProduct_fkey" FOREIGN KEY ("idProduct") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Stock_idSupplier_fkey" FOREIGN KEY ("idSupplier") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Stock_idBatch_fkey" FOREIGN KEY ("idBatch") REFERENCES "Batch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Stock" ("available", "createdAt", "existence", "id", "idBatch", "idProduct", "idSupplier", "organizationId", "updatedAt") SELECT "available", "createdAt", "existence", "id", "idBatch", "idProduct", "idSupplier", "organizationId", "updatedAt" FROM "Stock";
DROP TABLE "Stock";
ALTER TABLE "new_Stock" RENAME TO "Stock";
CREATE INDEX "Stock_organizationId_idx" ON "Stock"("organizationId");
CREATE INDEX "Stock_organizationId_available_idx" ON "Stock"("organizationId", "available");
CREATE TABLE "new_Supplier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyName" TEXT NOT NULL,
    "businessName" TEXT,
    "fiscalAddress" TEXT,
    "taxId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "address" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "taxWithholdingAgent" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Supplier" ("address", "available", "businessName", "companyName", "createdAt", "email", "firstName", "fiscalAddress", "id", "lastName", "organizationId", "phoneNumber", "taxId", "taxWithholdingAgent", "updatedAt") SELECT "address", "available", "businessName", "companyName", "createdAt", "email", "firstName", "fiscalAddress", "id", "lastName", "organizationId", "phoneNumber", "taxId", "taxWithholdingAgent", "updatedAt" FROM "Supplier";
DROP TABLE "Supplier";
ALTER TABLE "new_Supplier" RENAME TO "Supplier";
CREATE INDEX "Supplier_organizationId_idx" ON "Supplier"("organizationId");
CREATE INDEX "Supplier_organizationId_available_idx" ON "Supplier"("organizationId", "available");
CREATE INDEX "Supplier_organizationId_updatedAt_idx" ON "Supplier"("organizationId", "updatedAt");
CREATE TABLE "new_Tax" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "percentage" INTEGER NOT NULL,
    "formula" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "Tax_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tax" ("createdAt", "formula", "id", "name", "organizationId", "percentage", "updatedAt") SELECT "createdAt", "formula", "id", "name", "organizationId", "percentage", "updatedAt" FROM "Tax";
DROP TABLE "Tax";
ALTER TABLE "new_Tax" RENAME TO "Tax";
CREATE INDEX "Tax_organizationId_idx" ON "Tax"("organizationId");
CREATE INDEX "Tax_organizationId_updatedAt_idx" ON "Tax"("organizationId", "updatedAt");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "idRole" INTEGER NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "currentOrganizationId" INTEGER,
    CONSTRAINT "User_idRole_fkey" FOREIGN KEY ("idRole") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_currentOrganizationId_fkey" FOREIGN KEY ("currentOrganizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "currentOrganizationId", "email", "firstName", "id", "idRole", "isActive", "lastLogin", "lastName", "mustChangePassword", "password", "updatedAt", "userName") SELECT "createdAt", "currentOrganizationId", "email", "firstName", "id", "idRole", "isActive", "lastLogin", "lastName", "mustChangePassword", "password", "updatedAt", "userName" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_userName_key" ON "User"("userName");
CREATE TABLE "new_WithholdingRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idSupplier" INTEGER NOT NULL,
    "idPurchaseOrder" INTEGER,
    "type" TEXT NOT NULL,
    "percentage" REAL NOT NULL,
    "baseAmount" REAL NOT NULL,
    "baseAmountUsd" REAL,
    "withheldAmount" REAL NOT NULL,
    "withheldAmountUsd" REAL,
    "exchangeRate" REAL,
    "documentNumber" TEXT,
    "period" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    CONSTRAINT "WithholdingRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WithholdingRecord_idSupplier_fkey" FOREIGN KEY ("idSupplier") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WithholdingRecord_idPurchaseOrder_fkey" FOREIGN KEY ("idPurchaseOrder") REFERENCES "PurchaseOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WithholdingRecord" ("baseAmount", "baseAmountUsd", "createdAt", "documentNumber", "exchangeRate", "id", "idPurchaseOrder", "idSupplier", "organizationId", "percentage", "period", "type", "updatedAt", "withheldAmount", "withheldAmountUsd") SELECT "baseAmount", "baseAmountUsd", "createdAt", "documentNumber", "exchangeRate", "id", "idPurchaseOrder", "idSupplier", "organizationId", "percentage", "period", "type", "updatedAt", "withheldAmount", "withheldAmountUsd" FROM "WithholdingRecord";
DROP TABLE "WithholdingRecord";
ALTER TABLE "new_WithholdingRecord" RENAME TO "WithholdingRecord";
CREATE INDEX "WithholdingRecord_organizationId_idx" ON "WithholdingRecord"("organizationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
