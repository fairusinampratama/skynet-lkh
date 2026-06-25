ALTER TABLE "lkh_ledger_entries"
  DROP CONSTRAINT "lkh_ledger_entries_amount_positive_check",
  ADD CONSTRAINT "lkh_ledger_entries_amount_nonzero_check" CHECK ("amount" <> 0);
