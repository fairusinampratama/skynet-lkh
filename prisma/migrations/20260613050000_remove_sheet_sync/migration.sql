DROP TABLE IF EXISTS "lkh_sheet_syncs";

ALTER TABLE "lkh_months"
  DROP COLUMN IF EXISTS "sheet_id",
  DROP COLUMN IF EXISTS "sheet_tab";

DROP TYPE IF EXISTS "SheetSyncStatus";
