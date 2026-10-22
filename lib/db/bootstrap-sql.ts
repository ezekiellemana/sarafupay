// Idempotent DDL, run once per process. Kept in sync with schema.ts by hand
// (small schema, avoids a migration step on deploy and for anyone running locally).
export const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  phone text NOT NULL UNIQUE,
  name text,
  channel text NOT NULL,
  paypal_email text,
  active_collection_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS collections (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  owner_id text NOT NULL,
  title text NOT NULL,
  purpose text,
  category text NOT NULL DEFAULT 'other',
  target_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'TZS',
  deadline text,
  payout_email text,
  status text NOT NULL DEFAULT 'active',
  owner_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS contributions (
  id text PRIMARY KEY,
  collection_id text NOT NULL,
  contributor_id text,
  display_name text NOT NULL,
  amount_cents bigint NOT NULL,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  source text NOT NULL,
  message text,
  paypal_order_id text,
  paypal_capture_id text,
  payer_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
CREATE INDEX IF NOT EXISTS contrib_collection_idx ON contributions (collection_id);
CREATE INDEX IF NOT EXISTS contrib_order_idx ON contributions (paypal_order_id);
CREATE TABLE IF NOT EXISTS pledges (
  id text PRIMARY KEY,
  collection_id text NOT NULL,
  user_id text,
  display_name text NOT NULL,
  amount_cents bigint NOT NULL,
  due_date text,
  status text NOT NULL DEFAULT 'open',
  invoice_id text,
  reminded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS payouts (
  id text PRIMARY KEY,
  collection_id text NOT NULL,
  requested_by text NOT NULL,
  recipient_email text,
  recipient_name text,
  amount_cents bigint NOT NULL,
  currency text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'awaiting_confirmation',
  confirm_code text NOT NULL,
  paypal_batch_id text,
  paypal_item_id text,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  executed_at timestamptz
);
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS processed_events (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS chat_log (
  id serial PRIMARY KEY,
  phone text NOT NULL,
  direction text NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_phone_idx ON chat_log (phone, id);
CREATE TABLE IF NOT EXISTS processed_messages (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- v2: money columns are bigint (TZS totals overflow 32-bit integers)
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT table_name, column_name FROM information_schema.columns
           WHERE table_schema = current_schema() AND column_name LIKE '%\_cents' AND data_type = 'integer'
  LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE bigint', r.table_name, r.column_name);
  END LOOP;
END $$;
-- v2 columns (idempotent, so existing databases upgrade in place)
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'paypal';
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS provider_ref text;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS payer_phone text;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS provider_fee_cents bigint;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS sarafu_fee_cents bigint;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS net_cents bigint;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS rate_json text;
CREATE INDEX IF NOT EXISTS contrib_provider_ref_idx ON contributions (provider_ref);
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS method text NOT NULL DEFAULT 'paypal';
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'paypal';
ALTER TABLE payouts ALTER COLUMN recipient_email DROP NOT NULL;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS recipient_phone text;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS recipient_bank text;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS recipient_account text;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS provider_fee_cents bigint;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS sarafu_fee_cents bigint;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS net_cents bigint;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS rate_json text;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS provider_ref text;
`;
