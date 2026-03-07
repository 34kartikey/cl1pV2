# Cl1p Server V2

Cloudflare Pages + Workers backend for the Cl1p temporary clipboard/file sharing app.

## Stack

- **Cloudflare Pages Functions** — API route handlers under `functions/api/`
- **D1** — SQLite database for clip metadata and file records
- **R2** — Object storage for uploaded files
- **Scheduled Workers** — Hourly cron job to purge expired clips

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create D1 database

```bash
wrangler d1 create cl1p-db
```

Copy the returned `database_id` into `wrangler.toml`.

### 3. Apply schema

```bash
# Local development
npm run db:migrate:local

# Production
npm run db:migrate:remote
```

### 4. Create R2 bucket

```bash
wrangler r2 bucket create cl1p-files
```

### 5. Run locally

```bash
npm run dev
```

### 6. Deploy

```bash
npm run deploy
```

## API Reference

All responses follow the shape `{ success: true, data: {...} }` or `{ success: false, error: "..." }`.

All routes include `Access-Control-Allow-Origin: *` CORS headers.

### `GET /api/clips/:slug`
Fetch clip metadata and file list.

Headers (optional):
- `x-read-password` — required if `is_public` is false

### `POST /api/clips/:slug`
Create a clip.

Body (JSON):
```json
{
  "text": "...",
  "language": "javascript",
  "is_public": true,
  "read_password": "secret",
  "edit_mode": "public | password | read_only",
  "write_password": "secret",
  "expires_in_seconds": 3600,
  "files": [{ "id": "uuid", "filename": "file.txt", "mime_type": "text/plain", "size_bytes": 1234 }]
}
```

### `PUT /api/clips/:slug`
Update clip text/language.

Headers (when `edit_mode=password`):
- `x-write-password`

### `DELETE /api/clips/:slug`
Delete clip and all associated R2 objects.

Headers (when `edit_mode=password`):
- `x-write-password`

### `POST /api/clips/:slug/upload-url`
Register a file and get a proxied upload URL.

Body: `{ "fileId": "uuid", "filename": "file.txt", "mime_type": "text/plain", "size_bytes": 1234 }`

Returns: `{ "uploadUrl": "/api/clips/:slug/files/:fileId", "r2Key": "slug/fileId/filename" }`

Then `PUT` the raw file body to `uploadUrl`.

### `PUT /api/clips/:slug/files/:fileId`
Upload file content directly to R2 (proxied).

### `GET /api/clips/:slug/files/:fileId`
Download a file from R2 (proxied).

### `GET /api/clips/:slug/verify-read`
Verify a read password.

Headers:
- `x-read-password`

Returns 200 if valid, 401 if not.

## Password Hashing

Passwords are hashed with SHA-256 via the Web Crypto API before storage. Raw passwords are never stored.

## Expiry

Expiry is enforced lazily on read (any GET/PUT/DELETE) and proactively by the hourly cron job in `src/scheduled.js`.
