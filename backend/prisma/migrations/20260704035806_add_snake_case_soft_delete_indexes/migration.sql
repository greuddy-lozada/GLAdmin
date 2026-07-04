/*
  Warnings:

  - You are about to drop the `AccountsPayable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AccountsReceivable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Batch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Brand` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Currency` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Customer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExchangeRate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Invite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `License` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Module` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Organization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PagoMovilConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PagoMovilTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Plan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductsExchangeRates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchaseOrder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchaseOrderDet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RefreshToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Sale` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SalePayment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SalesDet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Stock` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockDet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubscriptionPayment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Supplier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SyncConflict` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SyncCursor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tax` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserOrganization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WithholdingRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `createdAt` on the `exchange_rate_days` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `exchange_rate_days` table. All the data in the column will be lost.
  - You are about to drop the column `rateBcvUsd` on the `exchange_rate_days` table. All the data in the column will be lost.
  - You are about to drop the column `rateParalelo` on the `exchange_rate_days` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `exchange_rate_days` table. All the data in the column will be lost.
  - Added the required column `organization_id` to the `exchange_rate_days` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `exchange_rate_days` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AccountsPayable_status_idx";

-- DropIndex
DROP INDEX "AccountsPayable_organizationId_idx";

-- DropIndex
DROP INDEX "AccountsReceivable_status_idx";

-- DropIndex
DROP INDEX "AccountsReceivable_organizationId_idx";

-- DropIndex
DROP INDEX "AuditLog_entity_entityId_idx";

-- DropIndex
DROP INDEX "AuditLog_organizationId_createdAt_idx";

-- DropIndex
DROP INDEX "AuditLog_organizationId_idx";

-- DropIndex
DROP INDEX "Batch_organizationId_idx";

-- DropIndex
DROP INDEX "Brand_organizationId_available_idx";

-- DropIndex
DROP INDEX "Brand_organizationId_idx";

-- DropIndex
DROP INDEX "Category_idParent_idx";

-- DropIndex
DROP INDEX "Category_organizationId_available_idx";

-- DropIndex
DROP INDEX "Category_organizationId_idx";

-- DropIndex
DROP INDEX "Company_organizationId_updatedAt_idx";

-- DropIndex
DROP INDEX "Company_organizationId_idx";

-- DropIndex
DROP INDEX "Customer_organizationId_updatedAt_idx";

-- DropIndex
DROP INDEX "Customer_organizationId_available_idx";

-- DropIndex
DROP INDEX "Customer_organizationId_idx";

-- DropIndex
DROP INDEX "ExchangeRate_organizationId_updatedAt_idx";

-- DropIndex
DROP INDEX "ExchangeRate_date_idx";

-- DropIndex
DROP INDEX "ExchangeRate_organizationId_idx";

-- DropIndex
DROP INDEX "Invite_organizationId_idx";

-- DropIndex
DROP INDEX "Invite_code_key";

-- DropIndex
DROP INDEX "Organization_slug_key";

-- DropIndex
DROP INDEX "PagoMovilConfig_organizationId_idx";

-- DropIndex
DROP INDEX "PagoMovilConfig_organizationId_key";

-- DropIndex
DROP INDEX "PagoMovilTransaction_status_idx";

-- DropIndex
DROP INDEX "PagoMovilTransaction_organizationId_idx";

-- DropIndex
DROP INDEX "Plan_name_key";

-- DropIndex
DROP INDEX "Product_organizationId_updatedAt_idx";

-- DropIndex
DROP INDEX "Product_organizationId_available_idx";

-- DropIndex
DROP INDEX "Product_organizationId_idx";

-- DropIndex
DROP INDEX "PurchaseOrder_code_idx";

-- DropIndex
DROP INDEX "PurchaseOrder_date_idx";

-- DropIndex
DROP INDEX "PurchaseOrder_status_idx";

-- DropIndex
DROP INDEX "PurchaseOrder_organizationId_idx";

-- DropIndex
DROP INDEX "PurchaseOrderDet_organizationId_idx";

-- DropIndex
DROP INDEX "RefreshToken_tokenId_key";

-- DropIndex
DROP INDEX "Role_slug_key";

-- DropIndex
DROP INDEX "Sale_code_idx";

-- DropIndex
DROP INDEX "Sale_date_idx";

-- DropIndex
DROP INDEX "Sale_status_idx";

-- DropIndex
DROP INDEX "Sale_organizationId_idx";

-- DropIndex
DROP INDEX "SalePayment_saleId_idx";

-- DropIndex
DROP INDEX "SalePayment_organizationId_idx";

-- DropIndex
DROP INDEX "SalesDet_organizationId_idx";

-- DropIndex
DROP INDEX "Stock_organizationId_available_idx";

-- DropIndex
DROP INDEX "Stock_organizationId_idx";

-- DropIndex
DROP INDEX "SubscriptionPayment_status_idx";

-- DropIndex
DROP INDEX "SubscriptionPayment_organizationId_idx";

-- DropIndex
DROP INDEX "Supplier_organizationId_updatedAt_idx";

-- DropIndex
DROP INDEX "Supplier_organizationId_available_idx";

-- DropIndex
DROP INDEX "Supplier_organizationId_idx";

-- DropIndex
DROP INDEX "SyncCursor_organizationId_key";

-- DropIndex
DROP INDEX "Tax_organizationId_updatedAt_idx";

-- DropIndex
DROP INDEX "Tax_organizationId_idx";

-- DropIndex
DROP INDEX "User_userName_key";

-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "UserOrganization_organizationId_idx";

-- DropIndex
DROP INDEX "WithholdingRecord_organizationId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AccountsPayable";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AccountsReceivable";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AuditLog";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Batch";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Brand";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Category";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Company";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Currency";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Customer";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ExchangeRate";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Invite";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "License";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Module";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Organization";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PagoMovilConfig";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PagoMovilTransaction";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Permission";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Plan";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Product";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProductsExchangeRates";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PurchaseOrder";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PurchaseOrderDet";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RefreshToken";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Role";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Sale";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SalePayment";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SalesDet";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Stock";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "StockDet";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SubscriptionPayment";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Supplier";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SyncConflict";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SyncCursor";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Tax";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UserOrganization";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "WithholdingRecord";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "id_role" INTEGER NOT NULL,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "last_login" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "current_organization_id" INTEGER,
    CONSTRAINT "users_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "users_current_organization_id_fkey" FOREIGN KEY ("current_organization_id") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "device_info" TEXT,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "slug" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "settings" TEXT,
    "plan_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "organizations_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plans" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "interval" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "max_users" INTEGER NOT NULL DEFAULT 5,
    "version" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "subscription_payments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "amount_usd" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "bank_id" TEXT,
    "phone_number" TEXT,
    "reference" TEXT,
    "proof_image" TEXT,
    "reviewed_by" INTEGER,
    "reviewed_at" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "subscription_payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "subscription_payments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "subscription_payments_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_organizations" (
    "user_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    PRIMARY KEY ("user_id", "organization_id"),
    CONSTRAINT "user_organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_organizations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invites" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "invited_by_id" INTEGER NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invites_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invites_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pago_movil_configs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "phone_number" TEXT NOT NULL,
    "bank_id" TEXT NOT NULL,
    "id_number" TEXT NOT NULL,
    "exchange_rate" REAL NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pago_movil_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pago_movil_transactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount_ves" REAL NOT NULL,
    "amount_usd" REAL NOT NULL,
    "bank_id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "proof_image" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pago_movil_transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pago_movil_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_card_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "address" TEXT,
    "phone_number" TEXT,
    "email" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "is_withholding_agent" BOOLEAN NOT NULL DEFAULT false,
    "withholding_percentage" REAL,
    "withholding_proof" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "customers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "company_name" TEXT NOT NULL,
    "business_name" TEXT,
    "fiscal_address" TEXT,
    "tax_id" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "address" TEXT,
    "phone_number" TEXT,
    "email" TEXT,
    "tax_withholding_agent" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "suppliers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "companies" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tax_id" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "is_withholding_agent" BOOLEAN NOT NULL DEFAULT false,
    "withholding_percentage" REAL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "companies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT,
    "id_company" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN,
    "expiry_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "licenses_id_company_fkey" FOREIGN KEY ("id_company") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "currencies" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT,
    "name" TEXT,
    "symbol" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rate" REAL NOT NULL,
    "currency_id" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'official',
    "date" DATETIME NOT NULL,
    "source" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "exchange_rates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exchange_rates_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "modules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "available" BOOLEAN,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "taxes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "percentage" INTEGER NOT NULL,
    "formula" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "taxes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "brands" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "brands_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "id_parent" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "categories_id_parent_fkey" FOREIGN KEY ("id_parent") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "dollar_price" REAL,
    "base_cost" REAL,
    "margin" REAL NOT NULL DEFAULT 20,
    "total_existence" INTEGER NOT NULL DEFAULT 0,
    "id_tax" INTEGER,
    "id_brand" INTEGER,
    "id_category" INTEGER,
    "observation" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "image" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "products_id_tax_fkey" FOREIGN KEY ("id_tax") REFERENCES "taxes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "products_id_brand_fkey" FOREIGN KEY ("id_brand") REFERENCES "brands" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "products_id_category_fkey" FOREIGN KEY ("id_category") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "batches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "batches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_product" INTEGER NOT NULL,
    "id_supplier" INTEGER,
    "id_batch" INTEGER,
    "id_purchase_order" INTEGER,
    "existence" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "stocks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stocks_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stocks_id_supplier_fkey" FOREIGN KEY ("id_supplier") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stocks_id_batch_fkey" FOREIGN KEY ("id_batch") REFERENCES "batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stocks_id_purchase_order_fkey" FOREIGN KEY ("id_purchase_order") REFERENCES "purchase_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_details" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_stock" INTEGER NOT NULL,
    "type" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expiry_date" DATETIME,
    "observation" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "stock_details_id_stock_fkey" FOREIGN KEY ("id_stock") REFERENCES "stocks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_supplier" INTEGER NOT NULL,
    "code" TEXT,
    "date" DATETIME,
    "amount" REAL,
    "amount_usd" REAL,
    "base_amount" REAL,
    "base_amount_usd" REAL,
    "iva_amount" REAL,
    "iva_amount_usd" REAL,
    "exchange_rate" REAL,
    "exchange_rate_id" INTEGER,
    "exchange_rate_day_id" INTEGER,
    "official_exchange_rate" REAL,
    "official_exchange_rate_id" INTEGER,
    "payment_method" INTEGER,
    "status" TEXT DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "annulled_at" DATETIME,
    "annulment_reason" TEXT,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "purchase_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_orders_id_supplier_fkey" FOREIGN KEY ("id_supplier") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_orders_exchange_rate_id_fkey" FOREIGN KEY ("exchange_rate_id") REFERENCES "exchange_rates" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "purchase_orders_exchange_rate_day_id_fkey" FOREIGN KEY ("exchange_rate_day_id") REFERENCES "exchange_rate_days" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "purchase_orders_official_exchange_rate_id_fkey" FOREIGN KEY ("official_exchange_rate_id") REFERENCES "exchange_rates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchase_order_details" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_purchase_order" INTEGER NOT NULL,
    "id_product" INTEGER NOT NULL,
    "quantity" INTEGER,
    "received_quantity" INTEGER NOT NULL DEFAULT 0,
    "unit_price" REAL,
    "unit_price_usd" REAL,
    "subtotal" REAL,
    "subtotal_usd" REAL,
    "observation" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "purchase_order_details_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_order_details_id_purchase_order_fkey" FOREIGN KEY ("id_purchase_order") REFERENCES "purchase_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_order_details_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounts_payable" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_purchase_order" INTEGER NOT NULL,
    "due_date" DATETIME,
    "issue_date" DATETIME,
    "amount" REAL,
    "amount_usd" REAL,
    "exchange_rate" REAL,
    "credit" REAL,
    "status" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "accounts_payable_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "accounts_payable_id_purchase_order_fkey" FOREIGN KEY ("id_purchase_order") REFERENCES "purchase_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "withholding_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_supplier" INTEGER NOT NULL,
    "id_purchase_order" INTEGER,
    "type" TEXT NOT NULL,
    "percentage" REAL NOT NULL,
    "base_amount" REAL NOT NULL,
    "base_amount_usd" REAL,
    "withheld_amount" REAL NOT NULL,
    "withheld_amount_usd" REAL,
    "exchange_rate" REAL,
    "document_number" TEXT,
    "period" TEXT,
    "withholding_proof" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "withholding_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "withholding_records_id_supplier_fkey" FOREIGN KEY ("id_supplier") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "withholding_records_id_purchase_order_fkey" FOREIGN KEY ("id_purchase_order") REFERENCES "purchase_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sales" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_customer" INTEGER,
    "code" TEXT,
    "date" DATETIME,
    "amount" REAL,
    "amount_usd" REAL,
    "exchange_rate" REAL,
    "exchange_rate_id" INTEGER,
    "official_exchange_rate" REAL,
    "official_exchange_rate_id" INTEGER,
    "total_tax" REAL,
    "total_tax_usd" REAL,
    "withholding_percentage" REAL,
    "withholding_amount" REAL,
    "withholding_amount_usd" REAL,
    "payment_method" INTEGER,
    "status" TEXT DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "annulled_at" DATETIME,
    "annulment_reason" TEXT,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "sales_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sales_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sales_exchange_rate_id_fkey" FOREIGN KEY ("exchange_rate_id") REFERENCES "exchange_rates" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sales_official_exchange_rate_id_fkey" FOREIGN KEY ("official_exchange_rate_id") REFERENCES "exchange_rates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sale_details" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_sale" INTEGER NOT NULL,
    "id_product" INTEGER NOT NULL,
    "quantity" INTEGER,
    "unit_price" REAL,
    "unit_price_usd" REAL,
    "subtotal" REAL,
    "subtotal_usd" REAL,
    "tax_name" TEXT,
    "tax_percentage" REAL,
    "tax_amount" REAL,
    "tax_amount_usd" REAL,
    "observation" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "sale_details_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sale_details_id_sale_fkey" FOREIGN KEY ("id_sale") REFERENCES "sales" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sale_details_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sale_payments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sale_id" INTEGER NOT NULL,
    "method" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "sale_payments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sale_payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounts_receivable" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_sale" INTEGER,
    "due_date" DATETIME,
    "issue_date" DATETIME,
    "amount" REAL,
    "amount_usd" REAL,
    "exchange_rate" REAL,
    "credit" REAL,
    "status" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "organization_id" INTEGER NOT NULL,
    CONSTRAINT "accounts_receivable_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "accounts_receivable_id_sale_fkey" FOREIGN KEY ("id_sale") REFERENCES "sales" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products_exchange_rates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_product" INTEGER NOT NULL,
    "id_exchange_rate" INTEGER NOT NULL,
    "value" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "products_exchange_rates_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "products_exchange_rates_id_exchange_rate_fkey" FOREIGN KEY ("id_exchange_rate") REFERENCES "exchange_rates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sync_cursors" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "last_pull_at" DATETIME NOT NULL,
    "last_push_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sync_cursors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sync_conflicts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "table" TEXT NOT NULL,
    "record_id" INTEGER,
    "local_data" TEXT NOT NULL,
    "server_data" TEXT NOT NULL,
    "local_timestamp" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolved_by" INTEGER,
    "resolved_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sync_conflicts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organization_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" INTEGER,
    "metadata" TEXT,
    "ip_address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_exchange_rate_days" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "rate_bcv_usd" REAL,
    "rate_paralelo" REAL,
    "source" TEXT DEFAULT 'dolarapi',
    "organization_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "exchange_rate_days_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_exchange_rate_days" ("date", "id", "source") SELECT "date", "id", "source" FROM "exchange_rate_days";
DROP TABLE "exchange_rate_days";
ALTER TABLE "new_exchange_rate_days" RENAME TO "exchange_rate_days";
CREATE INDEX "exchange_rate_days_organization_id_idx" ON "exchange_rate_days"("organization_id");
CREATE UNIQUE INDEX "exchange_rate_days_organization_id_date_key" ON "exchange_rate_days"("organization_id", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_name_key" ON "users"("user_name");

-- CreateIndex
CREATE INDEX "users_id_role_idx" ON "users"("id_role");

-- CreateIndex
CREATE INDEX "users_current_organization_id_idx" ON "users"("current_organization_id");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_id_key" ON "refresh_tokens"("token_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_plan_id_idx" ON "organizations"("plan_id");

-- CreateIndex
CREATE INDEX "organizations_deleted_at_idx" ON "organizations"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

-- CreateIndex
CREATE INDEX "plans_deleted_at_idx" ON "plans"("deleted_at");

-- CreateIndex
CREATE INDEX "subscription_payments_organization_id_idx" ON "subscription_payments"("organization_id");

-- CreateIndex
CREATE INDEX "subscription_payments_plan_id_idx" ON "subscription_payments"("plan_id");

-- CreateIndex
CREATE INDEX "subscription_payments_reviewed_by_idx" ON "subscription_payments"("reviewed_by");

-- CreateIndex
CREATE INDEX "subscription_payments_status_idx" ON "subscription_payments"("status");

-- CreateIndex
CREATE INDEX "subscription_payments_deleted_at_idx" ON "subscription_payments"("deleted_at");

-- CreateIndex
CREATE INDEX "user_organizations_organization_id_idx" ON "user_organizations"("organization_id");

-- CreateIndex
CREATE INDEX "user_organizations_role_id_idx" ON "user_organizations"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "invites_code_key" ON "invites"("code");

-- CreateIndex
CREATE INDEX "invites_organization_id_idx" ON "invites"("organization_id");

-- CreateIndex
CREATE INDEX "invites_role_id_idx" ON "invites"("role_id");

-- CreateIndex
CREATE INDEX "invites_invited_by_id_idx" ON "invites"("invited_by_id");

-- CreateIndex
CREATE INDEX "invites_email_idx" ON "invites"("email");

-- CreateIndex
CREATE INDEX "invites_expires_at_idx" ON "invites"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "pago_movil_configs_organization_id_key" ON "pago_movil_configs"("organization_id");

-- CreateIndex
CREATE INDEX "pago_movil_configs_organization_id_idx" ON "pago_movil_configs"("organization_id");

-- CreateIndex
CREATE INDEX "pago_movil_transactions_organization_id_idx" ON "pago_movil_transactions"("organization_id");

-- CreateIndex
CREATE INDEX "pago_movil_transactions_user_id_idx" ON "pago_movil_transactions"("user_id");

-- CreateIndex
CREATE INDEX "pago_movil_transactions_reviewed_by_idx" ON "pago_movil_transactions"("reviewed_by");

-- CreateIndex
CREATE INDEX "pago_movil_transactions_status_idx" ON "pago_movil_transactions"("status");

-- CreateIndex
CREATE INDEX "customers_organization_id_idx" ON "customers"("organization_id");

-- CreateIndex
CREATE INDEX "customers_organization_id_available_idx" ON "customers"("organization_id", "available");

-- CreateIndex
CREATE INDEX "customers_organization_id_updated_at_idx" ON "customers"("organization_id", "updated_at");

-- CreateIndex
CREATE INDEX "customers_deleted_at_idx" ON "customers"("deleted_at");

-- CreateIndex
CREATE INDEX "suppliers_organization_id_idx" ON "suppliers"("organization_id");

-- CreateIndex
CREATE INDEX "suppliers_organization_id_available_idx" ON "suppliers"("organization_id", "available");

-- CreateIndex
CREATE INDEX "suppliers_organization_id_updated_at_idx" ON "suppliers"("organization_id", "updated_at");

-- CreateIndex
CREATE INDEX "suppliers_deleted_at_idx" ON "suppliers"("deleted_at");

-- CreateIndex
CREATE INDEX "companies_organization_id_idx" ON "companies"("organization_id");

-- CreateIndex
CREATE INDEX "companies_organization_id_updated_at_idx" ON "companies"("organization_id", "updated_at");

-- CreateIndex
CREATE INDEX "companies_deleted_at_idx" ON "companies"("deleted_at");

-- CreateIndex
CREATE INDEX "licenses_id_company_idx" ON "licenses"("id_company");

-- CreateIndex
CREATE INDEX "exchange_rates_organization_id_idx" ON "exchange_rates"("organization_id");

-- CreateIndex
CREATE INDEX "exchange_rates_currency_id_idx" ON "exchange_rates"("currency_id");

-- CreateIndex
CREATE INDEX "exchange_rates_date_idx" ON "exchange_rates"("date");

-- CreateIndex
CREATE INDEX "exchange_rates_organization_id_updated_at_idx" ON "exchange_rates"("organization_id", "updated_at");

-- CreateIndex
CREATE INDEX "taxes_organization_id_idx" ON "taxes"("organization_id");

-- CreateIndex
CREATE INDEX "taxes_organization_id_updated_at_idx" ON "taxes"("organization_id", "updated_at");

-- CreateIndex
CREATE INDEX "taxes_deleted_at_idx" ON "taxes"("deleted_at");

-- CreateIndex
CREATE INDEX "brands_organization_id_idx" ON "brands"("organization_id");

-- CreateIndex
CREATE INDEX "brands_organization_id_available_idx" ON "brands"("organization_id", "available");

-- CreateIndex
CREATE INDEX "brands_deleted_at_idx" ON "brands"("deleted_at");

-- CreateIndex
CREATE INDEX "categories_organization_id_idx" ON "categories"("organization_id");

-- CreateIndex
CREATE INDEX "categories_organization_id_available_idx" ON "categories"("organization_id", "available");

-- CreateIndex
CREATE INDEX "categories_id_parent_idx" ON "categories"("id_parent");

-- CreateIndex
CREATE INDEX "categories_deleted_at_idx" ON "categories"("deleted_at");

-- CreateIndex
CREATE INDEX "products_organization_id_idx" ON "products"("organization_id");

-- CreateIndex
CREATE INDEX "products_organization_id_available_idx" ON "products"("organization_id", "available");

-- CreateIndex
CREATE INDEX "products_organization_id_updated_at_idx" ON "products"("organization_id", "updated_at");

-- CreateIndex
CREATE INDEX "products_id_tax_idx" ON "products"("id_tax");

-- CreateIndex
CREATE INDEX "products_id_brand_idx" ON "products"("id_brand");

-- CreateIndex
CREATE INDEX "products_id_category_idx" ON "products"("id_category");

-- CreateIndex
CREATE INDEX "products_code_idx" ON "products"("code");

-- CreateIndex
CREATE INDEX "products_deleted_at_idx" ON "products"("deleted_at");

-- CreateIndex
CREATE INDEX "batches_organization_id_idx" ON "batches"("organization_id");

-- CreateIndex
CREATE INDEX "batches_code_idx" ON "batches"("code");

-- CreateIndex
CREATE INDEX "batches_deleted_at_idx" ON "batches"("deleted_at");

-- CreateIndex
CREATE INDEX "stocks_organization_id_idx" ON "stocks"("organization_id");

-- CreateIndex
CREATE INDEX "stocks_organization_id_available_idx" ON "stocks"("organization_id", "available");

-- CreateIndex
CREATE INDEX "stocks_id_product_idx" ON "stocks"("id_product");

-- CreateIndex
CREATE INDEX "stocks_id_supplier_idx" ON "stocks"("id_supplier");

-- CreateIndex
CREATE INDEX "stocks_id_batch_idx" ON "stocks"("id_batch");

-- CreateIndex
CREATE INDEX "stocks_id_purchase_order_idx" ON "stocks"("id_purchase_order");

-- CreateIndex
CREATE INDEX "stocks_deleted_at_idx" ON "stocks"("deleted_at");

-- CreateIndex
CREATE INDEX "stock_details_id_stock_idx" ON "stock_details"("id_stock");

-- CreateIndex
CREATE INDEX "purchase_orders_organization_id_idx" ON "purchase_orders"("organization_id");

-- CreateIndex
CREATE INDEX "purchase_orders_id_supplier_idx" ON "purchase_orders"("id_supplier");

-- CreateIndex
CREATE INDEX "purchase_orders_exchange_rate_id_idx" ON "purchase_orders"("exchange_rate_id");

-- CreateIndex
CREATE INDEX "purchase_orders_exchange_rate_day_id_idx" ON "purchase_orders"("exchange_rate_day_id");

-- CreateIndex
CREATE INDEX "purchase_orders_official_exchange_rate_id_idx" ON "purchase_orders"("official_exchange_rate_id");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "purchase_orders_date_idx" ON "purchase_orders"("date");

-- CreateIndex
CREATE INDEX "purchase_orders_code_idx" ON "purchase_orders"("code");

-- CreateIndex
CREATE INDEX "purchase_orders_deleted_at_idx" ON "purchase_orders"("deleted_at");

-- CreateIndex
CREATE INDEX "purchase_order_details_organization_id_idx" ON "purchase_order_details"("organization_id");

-- CreateIndex
CREATE INDEX "purchase_order_details_id_purchase_order_idx" ON "purchase_order_details"("id_purchase_order");

-- CreateIndex
CREATE INDEX "purchase_order_details_id_product_idx" ON "purchase_order_details"("id_product");

-- CreateIndex
CREATE INDEX "accounts_payable_organization_id_idx" ON "accounts_payable"("organization_id");

-- CreateIndex
CREATE INDEX "accounts_payable_id_purchase_order_idx" ON "accounts_payable"("id_purchase_order");

-- CreateIndex
CREATE INDEX "accounts_payable_status_idx" ON "accounts_payable"("status");

-- CreateIndex
CREATE INDEX "accounts_payable_deleted_at_idx" ON "accounts_payable"("deleted_at");

-- CreateIndex
CREATE INDEX "withholding_records_organization_id_idx" ON "withholding_records"("organization_id");

-- CreateIndex
CREATE INDEX "withholding_records_id_supplier_idx" ON "withholding_records"("id_supplier");

-- CreateIndex
CREATE INDEX "withholding_records_id_purchase_order_idx" ON "withholding_records"("id_purchase_order");

-- CreateIndex
CREATE INDEX "withholding_records_deleted_at_idx" ON "withholding_records"("deleted_at");

-- CreateIndex
CREATE INDEX "sales_organization_id_idx" ON "sales"("organization_id");

-- CreateIndex
CREATE INDEX "sales_id_customer_idx" ON "sales"("id_customer");

-- CreateIndex
CREATE INDEX "sales_exchange_rate_id_idx" ON "sales"("exchange_rate_id");

-- CreateIndex
CREATE INDEX "sales_official_exchange_rate_id_idx" ON "sales"("official_exchange_rate_id");

-- CreateIndex
CREATE INDEX "sales_status_idx" ON "sales"("status");

-- CreateIndex
CREATE INDEX "sales_date_idx" ON "sales"("date");

-- CreateIndex
CREATE INDEX "sales_code_idx" ON "sales"("code");

-- CreateIndex
CREATE INDEX "sales_deleted_at_idx" ON "sales"("deleted_at");

-- CreateIndex
CREATE INDEX "sale_details_organization_id_idx" ON "sale_details"("organization_id");

-- CreateIndex
CREATE INDEX "sale_details_id_sale_idx" ON "sale_details"("id_sale");

-- CreateIndex
CREATE INDEX "sale_details_id_product_idx" ON "sale_details"("id_product");

-- CreateIndex
CREATE INDEX "sale_payments_organization_id_idx" ON "sale_payments"("organization_id");

-- CreateIndex
CREATE INDEX "sale_payments_sale_id_idx" ON "sale_payments"("sale_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_organization_id_idx" ON "accounts_receivable"("organization_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_id_sale_idx" ON "accounts_receivable"("id_sale");

-- CreateIndex
CREATE INDEX "accounts_receivable_status_idx" ON "accounts_receivable"("status");

-- CreateIndex
CREATE INDEX "accounts_receivable_deleted_at_idx" ON "accounts_receivable"("deleted_at");

-- CreateIndex
CREATE INDEX "products_exchange_rates_id_product_idx" ON "products_exchange_rates"("id_product");

-- CreateIndex
CREATE INDEX "products_exchange_rates_id_exchange_rate_idx" ON "products_exchange_rates"("id_exchange_rate");

-- CreateIndex
CREATE UNIQUE INDEX "sync_cursors_organization_id_key" ON "sync_cursors"("organization_id");

-- CreateIndex
CREATE INDEX "sync_conflicts_organization_id_idx" ON "sync_conflicts"("organization_id");

-- CreateIndex
CREATE INDEX "sync_conflicts_resolved_by_idx" ON "sync_conflicts"("resolved_by");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_idx" ON "audit_logs"("organization_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");
