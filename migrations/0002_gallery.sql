CREATE TABLE IF NOT EXISTS gallery_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position INTEGER NOT NULL UNIQUE CHECK (position >= 1 AND position <= 6),
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert empty slots for 6 gallery images
INSERT OR IGNORE INTO gallery_images (position, image_url) VALUES
  (1, NULL),
  (2, NULL),
  (3, NULL),
  (4, NULL),
  (5, NULL),
  (6, NULL);
