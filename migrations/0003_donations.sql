CREATE TABLE IF NOT EXISTS donations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  billplz_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  amount_cents INTEGER NOT NULL,
  days INTEGER,
  rate_cents INTEGER,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  receipt_sent INTEGER NOT NULL DEFAULT 0,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_donations_status ON donations (status);
CREATE INDEX IF NOT EXISTS idx_donations_created ON donations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_billplz ON donations (billplz_id);
