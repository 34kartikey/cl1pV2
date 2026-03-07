CREATE TABLE clips (
  slug             TEXT PRIMARY KEY,
  text             TEXT,
  language         TEXT,
  is_public        INTEGER NOT NULL DEFAULT 1,
  read_password    TEXT,
  edit_mode        TEXT NOT NULL DEFAULT 'public',
  write_password   TEXT,
  expires_at       INTEGER,
  created_at       INTEGER NOT NULL
);

CREATE TABLE clip_files (
  id               TEXT PRIMARY KEY,
  clip_slug        TEXT NOT NULL,
  filename         TEXT NOT NULL,
  mime_type        TEXT,
  size_bytes       INTEGER,
  r2_key           TEXT NOT NULL,
  FOREIGN KEY (clip_slug) REFERENCES clips(slug) ON DELETE CASCADE
);

CREATE INDEX idx_clips_expires_at ON clips(expires_at);
