ALTER TABLE "lkh_ledger_entries"
  ADD COLUMN "dashboard_included" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN "spreadsheet_section" INTEGER;
