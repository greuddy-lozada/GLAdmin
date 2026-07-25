/*
  Warnings:

  - The `status` column on the `caja_aperturas` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "RegisterSessionStatus" AS ENUM ('abierta', 'cerrada');

-- AlterTable
ALTER TABLE "caja_aperturas" ADD COLUMN     "initial_cash_usd" DECIMAL(18,4) NOT NULL DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "RegisterSessionStatus" NOT NULL DEFAULT 'abierta';

-- DropEnum
DROP TYPE "CajaAperturaStatus";

-- CreateIndex
CREATE INDEX "caja_aperturas_organization_id_status_idx" ON "caja_aperturas"("organization_id", "status");

-- CreateIndex
CREATE INDEX "caja_aperturas_user_id_status_idx" ON "caja_aperturas"("user_id", "status");
