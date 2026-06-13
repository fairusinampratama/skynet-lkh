CREATE TYPE "MonthStatus" AS ENUM ('DRAFT', 'LOCKED', 'ARCHIVED');
CREATE TYPE "CategoryKind" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "EntryType" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "CashAdvanceStatus" AS ENUM ('UNPAID', 'PAID');
CREATE TYPE "SheetSyncStatus" AS ENUM ('SUCCESS', 'FAILED');

CREATE TABLE "lkh_months" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "month" INTEGER NOT NULL,
  "opening_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "status" "MonthStatus" NOT NULL DEFAULT 'DRAFT',
  "sheet_id" TEXT,
  "sheet_tab" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lkh_months_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lkh_categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "CategoryKind" NOT NULL,
  "color" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lkh_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lkh_ledger_entries" (
  "id" TEXT NOT NULL,
  "month_id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "proof_no" TEXT,
  "description" TEXT NOT NULL,
  "category_id" TEXT NOT NULL,
  "type" "EntryType" NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lkh_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lkh_cash_advances" (
  "id" TEXT NOT NULL,
  "month_id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "person" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "status" "CashAdvanceStatus" NOT NULL DEFAULT 'UNPAID',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lkh_cash_advances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lkh_sheet_syncs" (
  "id" TEXT NOT NULL,
  "month_id" TEXT NOT NULL,
  "status" "SheetSyncStatus" NOT NULL,
  "message" TEXT,
  "synced_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lkh_sheet_syncs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lkh_months_year_month_key" ON "lkh_months"("year", "month");
CREATE UNIQUE INDEX "lkh_categories_name_kind_key" ON "lkh_categories"("name", "kind");
CREATE INDEX "lkh_ledger_entries_month_id_date_idx" ON "lkh_ledger_entries"("month_id", "date");
CREATE INDEX "lkh_ledger_entries_category_id_idx" ON "lkh_ledger_entries"("category_id");
CREATE INDEX "lkh_cash_advances_month_id_status_idx" ON "lkh_cash_advances"("month_id", "status");
CREATE INDEX "lkh_sheet_syncs_month_id_created_at_idx" ON "lkh_sheet_syncs"("month_id", "created_at");

ALTER TABLE "lkh_ledger_entries" ADD CONSTRAINT "lkh_ledger_entries_month_id_fkey" FOREIGN KEY ("month_id") REFERENCES "lkh_months"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lkh_ledger_entries" ADD CONSTRAINT "lkh_ledger_entries_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "lkh_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lkh_cash_advances" ADD CONSTRAINT "lkh_cash_advances_month_id_fkey" FOREIGN KEY ("month_id") REFERENCES "lkh_months"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lkh_sheet_syncs" ADD CONSTRAINT "lkh_sheet_syncs_month_id_fkey" FOREIGN KEY ("month_id") REFERENCES "lkh_months"("id") ON DELETE CASCADE ON UPDATE CASCADE;
