-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AccountsPayable_organizationId_idx" ON "AccountsPayable"("organizationId");

-- CreateIndex
CREATE INDEX "AccountsPayable_status_idx" ON "AccountsPayable"("status");

-- CreateIndex
CREATE INDEX "AccountsReceivable_organizationId_idx" ON "AccountsReceivable"("organizationId");

-- CreateIndex
CREATE INDEX "AccountsReceivable_status_idx" ON "AccountsReceivable"("status");

-- CreateIndex
CREATE INDEX "Batch_organizationId_idx" ON "Batch"("organizationId");

-- CreateIndex
CREATE INDEX "Company_organizationId_idx" ON "Company"("organizationId");

-- CreateIndex
CREATE INDEX "Company_organizationId_updatedAt_idx" ON "Company"("organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "Customer_organizationId_idx" ON "Customer"("organizationId");

-- CreateIndex
CREATE INDEX "Customer_organizationId_available_idx" ON "Customer"("organizationId", "available");

-- CreateIndex
CREATE INDEX "Customer_organizationId_updatedAt_idx" ON "Customer"("organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "ExchangeRate_organizationId_idx" ON "ExchangeRate"("organizationId");

-- CreateIndex
CREATE INDEX "ExchangeRate_date_idx" ON "ExchangeRate"("date");

-- CreateIndex
CREATE INDEX "ExchangeRate_organizationId_updatedAt_idx" ON "ExchangeRate"("organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "Invite_organizationId_idx" ON "Invite"("organizationId");

-- CreateIndex
CREATE INDEX "PagoMovilConfig_organizationId_idx" ON "PagoMovilConfig"("organizationId");

-- CreateIndex
CREATE INDEX "PagoMovilTransaction_organizationId_idx" ON "PagoMovilTransaction"("organizationId");

-- CreateIndex
CREATE INDEX "PagoMovilTransaction_status_idx" ON "PagoMovilTransaction"("status");

-- CreateIndex
CREATE INDEX "Product_organizationId_idx" ON "Product"("organizationId");

-- CreateIndex
CREATE INDEX "Product_organizationId_available_idx" ON "Product"("organizationId", "available");

-- CreateIndex
CREATE INDEX "Product_organizationId_updatedAt_idx" ON "Product"("organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "PurchaseOrder_organizationId_idx" ON "PurchaseOrder"("organizationId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_date_idx" ON "PurchaseOrder"("date");

-- CreateIndex
CREATE INDEX "PurchaseOrder_code_idx" ON "PurchaseOrder"("code");

-- CreateIndex
CREATE INDEX "PurchaseOrderDet_organizationId_idx" ON "PurchaseOrderDet"("organizationId");

-- CreateIndex
CREATE INDEX "Sale_organizationId_idx" ON "Sale"("organizationId");

-- CreateIndex
CREATE INDEX "Sale_status_idx" ON "Sale"("status");

-- CreateIndex
CREATE INDEX "Sale_date_idx" ON "Sale"("date");

-- CreateIndex
CREATE INDEX "Sale_code_idx" ON "Sale"("code");

-- CreateIndex
CREATE INDEX "SalesDet_organizationId_idx" ON "SalesDet"("organizationId");

-- CreateIndex
CREATE INDEX "Stock_organizationId_idx" ON "Stock"("organizationId");

-- CreateIndex
CREATE INDEX "Stock_organizationId_available_idx" ON "Stock"("organizationId", "available");

-- CreateIndex
CREATE INDEX "Supplier_organizationId_idx" ON "Supplier"("organizationId");

-- CreateIndex
CREATE INDEX "Supplier_organizationId_available_idx" ON "Supplier"("organizationId", "available");

-- CreateIndex
CREATE INDEX "Supplier_organizationId_updatedAt_idx" ON "Supplier"("organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "Tax_organizationId_idx" ON "Tax"("organizationId");

-- CreateIndex
CREATE INDEX "Tax_organizationId_updatedAt_idx" ON "Tax"("organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "UserOrganization_organizationId_idx" ON "UserOrganization"("organizationId");

-- CreateIndex
CREATE INDEX "WithholdingRecord_organizationId_idx" ON "WithholdingRecord"("organizationId");
