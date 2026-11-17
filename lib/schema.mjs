export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    avatar TEXT NOT NULL DEFAULT 'V',
    balance NUMERIC NOT NULL DEFAULT 10000,
    banned BOOLEAN NOT NULL DEFAULT FALSE,
    created BIGINT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires BIGINT NOT NULL,
    created BIGINT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS ledger (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    before NUMERIC NOT NULL,
    after NUMERIC NOT NULL,
    note TEXT NOT NULL,
    created BIGINT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS bets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    stake NUMERIC NOT NULL,
    odds NUMERIC NOT NULL,
    potential NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    created BIGINT NOT NULL,
    settled BIGINT
  )`,
  `CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    category TEXT NOT NULL,
    external_id TEXT NOT NULL DEFAULT '',
    launch_url TEXT NOT NULL DEFAULT '',
    thumbnail TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'awaiting',
    domains TEXT NOT NULL DEFAULT '',
    config TEXT NOT NULL DEFAULT '{}',
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    sort INTEGER NOT NULL DEFAULT 0,
    created BIGINT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ledger_user ON ledger(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`
];