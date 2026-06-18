CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'READER');

CREATE TABLE "lkh_users" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lkh_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lkh_sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lkh_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lkh_users_username_key" ON "lkh_users"("username");
CREATE UNIQUE INDEX "lkh_sessions_token_hash_key" ON "lkh_sessions"("token_hash");
CREATE INDEX "lkh_sessions_user_id_idx" ON "lkh_sessions"("user_id");
CREATE INDEX "lkh_sessions_expires_at_idx" ON "lkh_sessions"("expires_at");

ALTER TABLE "lkh_sessions"
  ADD CONSTRAINT "lkh_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "lkh_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
