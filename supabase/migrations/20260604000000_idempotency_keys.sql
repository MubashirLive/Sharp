-- Idempotency key cache for write edge functions.
-- Client generates a UUID once per submission attempt; edge function replays
-- the cached response on key reuse. Catches: network retry, tab refresh
-- during submit, mobile background→resume, AND any future unguarded client.
--
-- Access policy: RLS enabled with NO policies → only the service_role key
-- (used by edge functions) can read or write. Anonymous/authenticated users
-- cannot touch this table.

CREATE TABLE idempotency_keys (
  key UUID PRIMARY KEY,
  endpoint TEXT NOT NULL,
  status_code INT NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX idempotency_keys_expires_at_idx ON idempotency_keys (expires_at);
CREATE INDEX idempotency_keys_endpoint_idx ON idempotency_keys (endpoint);

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies. Only service_role bypasses RLS.

-- Manual purge function. Wire to pg_cron or call from a nightly job.
CREATE OR REPLACE FUNCTION purge_expired_idempotency_keys() RETURNS void
LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM idempotency_keys WHERE expires_at < now();
$$;
