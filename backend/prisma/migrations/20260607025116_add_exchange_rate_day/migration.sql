-- CreateTable
CREATE TABLE "exchange_rate_days" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "rateBcvUsd" REAL,
    "rateParalelo" REAL,
    "source" TEXT DEFAULT 'dolarapi',
    "organizationId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "exchange_rate_days_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rate_days_organizationId_date_key" ON "exchange_rate_days"("organizationId", "date");
