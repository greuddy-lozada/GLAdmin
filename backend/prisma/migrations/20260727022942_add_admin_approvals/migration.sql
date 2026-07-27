-- CreateTable
CREATE TABLE "admin_approvals" (
    "id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "performed_by_id" UUID NOT NULL,
    "performed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by_id" UUID,
    "approved_at" TIMESTAMPTZ,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "rejection_reason" TEXT,

    CONSTRAINT "admin_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_approvals_status_idx" ON "admin_approvals"("status");

-- CreateIndex
CREATE INDEX "admin_approvals_performed_by_id_idx" ON "admin_approvals"("performed_by_id");

-- CreateIndex
CREATE INDEX "admin_approvals_status_performed_at_idx" ON "admin_approvals"("status", "performed_at");

-- AddForeignKey
ALTER TABLE "admin_approvals" ADD CONSTRAINT "admin_approvals_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_approvals" ADD CONSTRAINT "admin_approvals_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
