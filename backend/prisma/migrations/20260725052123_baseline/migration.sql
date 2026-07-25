-- CreateEnum
CREATE TYPE "CajaAperturaStatus" AS ENUM ('abierta', 'cerrada');

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "id_role" UUID NOT NULL,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "last_login" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "current_organization_id" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "device_info" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "slug" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "settings" TEXT,
    "plan_id" UUID,
    "subscription_status" TEXT NOT NULL DEFAULT 'inactive',
    "subscription_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "interval" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "max_users" INTEGER NOT NULL DEFAULT 5,
    "version" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_payments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "method" TEXT NOT NULL,
    "amount_usd" DECIMAL(18,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "bank_id" TEXT,
    "phone_number" TEXT,
    "reference" TEXT,
    "proof_image" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_organizations" (
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "user_organizations_pkey" PRIMARY KEY ("user_id","organization_id")
);

-- CreateTable
CREATE TABLE "invites" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organization_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "invited_by_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago_movil_configs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "phone_number" TEXT NOT NULL,
    "bank_id" TEXT NOT NULL,
    "id_number" TEXT NOT NULL,
    "exchange_rate" DOUBLE PRECISION NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pago_movil_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago_movil_transactions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount_ves" DECIMAL(18,4) NOT NULL,
    "amount_usd" DECIMAL(18,4) NOT NULL,
    "bank_id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "proof_image" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pago_movil_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "id_card_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "address" TEXT,
    "phone_number" TEXT,
    "email" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "is_withholding_agent" BOOLEAN NOT NULL DEFAULT false,
    "withholding_percentage" DOUBLE PRECISION,
    "withholding_proof" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "organization_id" UUID NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "organization_id" UUID NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "tax_id" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "is_withholding_agent" BOOLEAN NOT NULL DEFAULT false,
    "withholding_percentage" DOUBLE PRECISION,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "organization_id" UUID NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" UUID NOT NULL,
    "code" TEXT,
    "id_company" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN,
    "expiry_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "id" UUID NOT NULL,
    "code" TEXT,
    "name" TEXT,
    "symbol" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" UUID NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "currency_id" UUID,
    "type" TEXT NOT NULL DEFAULT 'official',
    "date" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rate_days" (
    "id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "rate_bcv_usd" DOUBLE PRECISION,
    "rate_paralelo" DOUBLE PRECISION,
    "source" TEXT DEFAULT 'dolarapi',
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rate_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "available" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxes" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "percentage" INTEGER NOT NULL,
    "formula" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "organization_id" UUID NOT NULL,

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "organization_id" UUID NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "id_parent" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "organization_id" UUID NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(18,4) NOT NULL,
    "dollar_price" DECIMAL(18,4),
    "base_cost" DECIMAL(18,4),
    "margin" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "total_existence" INTEGER NOT NULL DEFAULT 0,
    "id_tax" UUID,
    "id_brand" UUID,
    "id_category" UUID,
    "observation" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "organization_id" UUID NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "organization_id" UUID NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" UUID NOT NULL,
    "id_product" UUID NOT NULL,
    "id_supplier" UUID,
    "id_batch" UUID,
    "id_purchase_order" UUID,
    "existence" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "organization_id" UUID NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_details" (
    "id" UUID NOT NULL,
    "id_stock" UUID NOT NULL,
    "type" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "observation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "id_supplier" UUID NOT NULL,
    "code" TEXT,
    "date" TIMESTAMP(3),
    "amount" DECIMAL(18,4),
    "amount_usd" DECIMAL(18,4),
    "base_amount" DECIMAL(18,4),
    "base_amount_usd" DECIMAL(18,4),
    "iva_amount" DECIMAL(18,4),
    "iva_amount_usd" DECIMAL(18,4),
    "exchange_rate" DOUBLE PRECISION,
    "exchange_rate_id" UUID,
    "exchange_rate_day_id" UUID,
    "official_exchange_rate" DOUBLE PRECISION,
    "official_exchange_rate_id" UUID,
    "payment_method" INTEGER,
    "status" TEXT DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "annulled_at" TIMESTAMP(3),
    "annulment_reason" TEXT,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_details" (
    "id" UUID NOT NULL,
    "id_purchase_order" UUID NOT NULL,
    "id_product" UUID NOT NULL,
    "quantity" INTEGER,
    "received_quantity" INTEGER NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(18,4),
    "unit_price_usd" DECIMAL(18,4),
    "subtotal" DECIMAL(18,4),
    "subtotal_usd" DECIMAL(18,4),
    "observation" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "purchase_order_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_payable" (
    "id" UUID NOT NULL,
    "id_purchase_order" UUID NOT NULL,
    "due_date" TIMESTAMP(3),
    "issue_date" TIMESTAMP(3),
    "amount" DECIMAL(18,4),
    "amount_usd" DECIMAL(18,4),
    "exchange_rate" DOUBLE PRECISION,
    "credit" DECIMAL(18,4),
    "status" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "organization_id" UUID NOT NULL,

    CONSTRAINT "accounts_payable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withholding_records" (
    "id" UUID NOT NULL,
    "id_supplier" UUID NOT NULL,
    "id_purchase_order" UUID,
    "type" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "base_amount" DECIMAL(18,4) NOT NULL,
    "base_amount_usd" DECIMAL(18,4),
    "withheld_amount" DECIMAL(18,4) NOT NULL,
    "withheld_amount_usd" DECIMAL(18,4),
    "exchange_rate" DOUBLE PRECISION,
    "document_number" TEXT,
    "period" TEXT,
    "withholding_proof" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "organization_id" UUID NOT NULL,

    CONSTRAINT "withholding_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" UUID NOT NULL,
    "id_customer" UUID,
    "code" TEXT,
    "date" TIMESTAMP(3),
    "amount" DECIMAL(18,4),
    "amount_usd" DECIMAL(18,4),
    "exchange_rate" DOUBLE PRECISION,
    "exchange_rate_id" UUID,
    "official_exchange_rate" DOUBLE PRECISION,
    "official_exchange_rate_id" UUID,
    "total_tax" DECIMAL(18,4),
    "total_tax_usd" DECIMAL(18,4),
    "withholding_percentage" DOUBLE PRECISION,
    "withholding_amount" DECIMAL(18,4),
    "withholding_amount_usd" DECIMAL(18,4),
    "payment_method" INTEGER,
    "status" TEXT DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "annulled_at" TIMESTAMP(3),
    "annulment_reason" TEXT,
    "organization_id" UUID NOT NULL,
    "caja_apertura_id" UUID,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_details" (
    "id" UUID NOT NULL,
    "id_sale" UUID NOT NULL,
    "id_product" UUID NOT NULL,
    "quantity" INTEGER,
    "unit_price" DECIMAL(18,4),
    "unit_price_usd" DECIMAL(18,4),
    "subtotal" DECIMAL(18,4),
    "subtotal_usd" DECIMAL(18,4),
    "tax_name" TEXT,
    "tax_percentage" DOUBLE PRECISION,
    "tax_amount" DECIMAL(18,4),
    "tax_amount_usd" DECIMAL(18,4),
    "observation" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "sale_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_payments" (
    "id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "method" INTEGER NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "sale_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_receivable" (
    "id" UUID NOT NULL,
    "id_sale" UUID,
    "due_date" TIMESTAMP(3),
    "issue_date" TIMESTAMP(3),
    "amount" DECIMAL(18,4),
    "amount_usd" DECIMAL(18,4),
    "exchange_rate" DOUBLE PRECISION,
    "credit" DECIMAL(18,4),
    "status" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "organization_id" UUID NOT NULL,

    CONSTRAINT "accounts_receivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products_exchange_rates" (
    "id" UUID NOT NULL,
    "id_product" UUID NOT NULL,
    "id_exchange_rate" UUID NOT NULL,
    "value" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_cursors" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "last_pull_at" TIMESTAMP(3) NOT NULL,
    "last_push_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_cursors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_conflicts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "table" TEXT NOT NULL,
    "record_id" UUID,
    "local_data" TEXT NOT NULL,
    "server_data" TEXT NOT NULL,
    "local_timestamp" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolved_by" UUID,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" UUID,
    "metadata" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_reports" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "results" JSONB,
    "html_snapshot" TEXT,
    "format" TEXT NOT NULL DEFAULT 'json',
    "status" TEXT NOT NULL DEFAULT 'generating',
    "error_message" TEXT,
    "generated_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "generated_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caja_aperturas" (
    "id" UUID NOT NULL,
    "caja_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "initial_cash" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "status" "CajaAperturaStatus" NOT NULL DEFAULT 'abierta',
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caja_aperturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corte_cajas" (
    "id" UUID NOT NULL,
    "caja_apertura_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "expected_cash" DECIMAL(18,4) NOT NULL,
    "counted_cash" DECIMAL(18,4) NOT NULL,
    "difference" DECIMAL(18,4) NOT NULL,
    "closed_by_id" UUID NOT NULL,
    "notes" TEXT,
    "closed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corte_cajas_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "pago_movil_configs_deleted_at_idx" ON "pago_movil_configs"("deleted_at");

-- CreateIndex
CREATE INDEX "pago_movil_transactions_user_id_idx" ON "pago_movil_transactions"("user_id");

-- CreateIndex
CREATE INDEX "pago_movil_transactions_reviewed_by_idx" ON "pago_movil_transactions"("reviewed_by");

-- CreateIndex
CREATE INDEX "pago_movil_transactions_status_idx" ON "pago_movil_transactions"("status");

-- CreateIndex
CREATE INDEX "pago_movil_transactions_deleted_at_idx" ON "pago_movil_transactions"("deleted_at");

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
CREATE INDEX "exchange_rate_days_organization_id_idx" ON "exchange_rate_days"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rate_days_organization_id_date_key" ON "exchange_rate_days"("organization_id", "date");

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
CREATE UNIQUE INDEX "categories_name_organization_id_key" ON "categories"("name", "organization_id");

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
CREATE INDEX "stocks_id_product_organization_id_idx" ON "stocks"("id_product", "organization_id");

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
CREATE INDEX "purchase_orders_organization_id_date_idx" ON "purchase_orders"("organization_id", "date");

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
CREATE INDEX "sales_organization_id_created_at_idx" ON "sales"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "sales_organization_id_date_idx" ON "sales"("organization_id", "date");

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
CREATE INDEX "sales_caja_apertura_id_idx" ON "sales"("caja_apertura_id");

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
CREATE INDEX "sync_conflicts_organization_id_status_idx" ON "sync_conflicts"("organization_id", "status");

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

-- CreateIndex
CREATE INDEX "generated_reports_organization_id_category_idx" ON "generated_reports"("organization_id", "category");

-- CreateIndex
CREATE INDEX "generated_reports_organization_id_type_idx" ON "generated_reports"("organization_id", "type");

-- CreateIndex
CREATE INDEX "generated_reports_organization_id_created_at_idx" ON "generated_reports"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "generated_reports_user_id_idx" ON "generated_reports"("user_id");

-- CreateIndex
CREATE INDEX "cajas_organization_id_idx" ON "cajas"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "cajas_organization_id_code_key" ON "cajas"("organization_id", "code");

-- CreateIndex
CREATE INDEX "caja_aperturas_caja_id_idx" ON "caja_aperturas"("caja_id");

-- CreateIndex
CREATE INDEX "caja_aperturas_user_id_idx" ON "caja_aperturas"("user_id");

-- CreateIndex
CREATE INDEX "caja_aperturas_organization_id_status_idx" ON "caja_aperturas"("organization_id", "status");

-- CreateIndex
CREATE INDEX "caja_aperturas_user_id_status_idx" ON "caja_aperturas"("user_id", "status");

-- CreateIndex
CREATE INDEX "corte_cajas_caja_apertura_id_idx" ON "corte_cajas"("caja_apertura_id");

-- CreateIndex
CREATE INDEX "corte_cajas_organization_id_idx" ON "corte_cajas"("organization_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_current_organization_id_fkey" FOREIGN KEY ("current_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_movil_configs" ADD CONSTRAINT "pago_movil_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_movil_transactions" ADD CONSTRAINT "pago_movil_transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_movil_transactions" ADD CONSTRAINT "pago_movil_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_id_company_fkey" FOREIGN KEY ("id_company") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rate_days" ADD CONSTRAINT "exchange_rate_days_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_id_parent_fkey" FOREIGN KEY ("id_parent") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_id_tax_fkey" FOREIGN KEY ("id_tax") REFERENCES "taxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_id_brand_fkey" FOREIGN KEY ("id_brand") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_id_category_fkey" FOREIGN KEY ("id_category") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_id_supplier_fkey" FOREIGN KEY ("id_supplier") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_id_batch_fkey" FOREIGN KEY ("id_batch") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_id_purchase_order_fkey" FOREIGN KEY ("id_purchase_order") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_details" ADD CONSTRAINT "stock_details_id_stock_fkey" FOREIGN KEY ("id_stock") REFERENCES "stocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_id_supplier_fkey" FOREIGN KEY ("id_supplier") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_exchange_rate_id_fkey" FOREIGN KEY ("exchange_rate_id") REFERENCES "exchange_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_exchange_rate_day_id_fkey" FOREIGN KEY ("exchange_rate_day_id") REFERENCES "exchange_rate_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_official_exchange_rate_id_fkey" FOREIGN KEY ("official_exchange_rate_id") REFERENCES "exchange_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_details" ADD CONSTRAINT "purchase_order_details_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_details" ADD CONSTRAINT "purchase_order_details_id_purchase_order_fkey" FOREIGN KEY ("id_purchase_order") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_details" ADD CONSTRAINT "purchase_order_details_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_id_purchase_order_fkey" FOREIGN KEY ("id_purchase_order") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withholding_records" ADD CONSTRAINT "withholding_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withholding_records" ADD CONSTRAINT "withholding_records_id_supplier_fkey" FOREIGN KEY ("id_supplier") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withholding_records" ADD CONSTRAINT "withholding_records_id_purchase_order_fkey" FOREIGN KEY ("id_purchase_order") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_exchange_rate_id_fkey" FOREIGN KEY ("exchange_rate_id") REFERENCES "exchange_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_official_exchange_rate_id_fkey" FOREIGN KEY ("official_exchange_rate_id") REFERENCES "exchange_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_caja_apertura_id_fkey" FOREIGN KEY ("caja_apertura_id") REFERENCES "caja_aperturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_details" ADD CONSTRAINT "sale_details_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_details" ADD CONSTRAINT "sale_details_id_sale_fkey" FOREIGN KEY ("id_sale") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_details" ADD CONSTRAINT "sale_details_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_id_sale_fkey" FOREIGN KEY ("id_sale") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_exchange_rates" ADD CONSTRAINT "products_exchange_rates_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_exchange_rates" ADD CONSTRAINT "products_exchange_rates_id_exchange_rate_fkey" FOREIGN KEY ("id_exchange_rate") REFERENCES "exchange_rates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_cursors" ADD CONSTRAINT "sync_cursors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_conflicts" ADD CONSTRAINT "sync_conflicts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caja_aperturas" ADD CONSTRAINT "caja_aperturas_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caja_aperturas" ADD CONSTRAINT "caja_aperturas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caja_aperturas" ADD CONSTRAINT "caja_aperturas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corte_cajas" ADD CONSTRAINT "corte_cajas_caja_apertura_id_fkey" FOREIGN KEY ("caja_apertura_id") REFERENCES "caja_aperturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corte_cajas" ADD CONSTRAINT "corte_cajas_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corte_cajas" ADD CONSTRAINT "corte_cajas_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
