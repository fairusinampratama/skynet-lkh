ALTER TABLE "lkh_months"
  ADD CONSTRAINT "lkh_months_month_range_check" CHECK ("month" >= 1 AND "month" <= 12),
  ADD CONSTRAINT "lkh_months_opening_balance_nonnegative_check" CHECK ("opening_balance" >= 0);

ALTER TABLE "lkh_ledger_entries"
  ADD CONSTRAINT "lkh_ledger_entries_amount_positive_check" CHECK ("amount" > 0);

ALTER TABLE "lkh_cash_advances"
  ADD CONSTRAINT "lkh_cash_advances_amount_positive_check" CHECK ("amount" > 0);
