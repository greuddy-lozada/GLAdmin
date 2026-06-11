-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN "baseAmount" REAL;
ALTER TABLE "PurchaseOrder" ADD COLUMN "baseAmountUsd" REAL;
ALTER TABLE "PurchaseOrder" ADD COLUMN "ivaAmount" REAL;
ALTER TABLE "PurchaseOrder" ADD COLUMN "ivaAmountUsd" REAL;

-- AlterTable
ALTER TABLE "WithholdingRecord" ADD COLUMN "withholdingProof" TEXT;
