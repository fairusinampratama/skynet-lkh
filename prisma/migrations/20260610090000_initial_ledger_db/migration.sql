CREATE TABLE "categories" (
  "id" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transactions" (
  "id" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "date" TEXT,
  "type" TEXT,
  "amount" DECIMAL(14,2),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "transactions_date_idx" ON "transactions"("date");
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

CREATE TABLE "bank_mutations" (
  "id" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "synced" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bank_mutations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bank_mutations_synced_idx" ON "bank_mutations"("synced");

CREATE TABLE "bill_reminders" (
  "id" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "status" TEXT,
  "due_date" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bill_reminders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bill_reminders_status_idx" ON "bill_reminders"("status");
CREATE INDEX "bill_reminders_due_date_idx" ON "bill_reminders"("due_date");

CREATE TABLE "recurring_transactions" (
  "id" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "recurring_transactions_is_active_idx" ON "recurring_transactions"("is_active");

CREATE TABLE "monthly_budgets" (
  "id" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "monthly_budgets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "timestamp" TIMESTAMP(3),
  "type" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");
CREATE INDEX "audit_logs_type_idx" ON "audit_logs"("type");

CREATE TABLE "dashboard_widgets" (
  "id" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "dashboard_widgets_sort_order_idx" ON "dashboard_widgets"("sort_order");

CREATE TABLE "scheduler_config" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "data" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "scheduler_config_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sent_emails" (
  "id" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "timestamp" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sent_emails_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sent_emails_timestamp_idx" ON "sent_emails"("timestamp");
