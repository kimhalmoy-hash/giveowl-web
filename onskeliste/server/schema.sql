-- GiveOwl ønskeliste. Created automatically by the local server.
-- Capability tokens are stored only as SHA-256 hashes, except the current
-- view token, which the owner must be able to copy again.
-- quantity is fixed at 1 so a wish can have only one active reservation.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  occasion TEXT,
  lang TEXT NOT NULL DEFAULT 'nb',
  edit_hash TEXT NOT NULL UNIQUE,
  view_token TEXT NOT NULL,
  view_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  activity_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wishes (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  note TEXT,
  size TEXT,
  color TEXT,
  price_text TEXT,
  price_checked_on TEXT,
  most_wanted INTEGER NOT NULL DEFAULT 0 CHECK (most_wanted IN (0, 1)),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity = 1),
  source TEXT NOT NULL CHECK (source IN ('text', 'url', 'giveowl')),
  product_url TEXT,
  affiliate INTEGER NOT NULL DEFAULT 0 CHECK (affiliate IN (0, 1)),
  shop_name TEXT,
  image_url TEXT,
  image_rights TEXT NOT NULL DEFAULT 'none' CHECK (image_rights IN ('none', 'confirmed', 'giveowl')),
  state TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'reserved', 'bought')),
  res_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS wishes_list ON wishes(list_id);
CREATE UNIQUE INDEX IF NOT EXISTS wishes_res ON wishes(res_hash) WHERE res_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
