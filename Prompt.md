# Cl1p — Temporary File Sharing (cl1p.in)

A temporary clipboard/file sharing web app built on the Cloudflare stack (Pages + Workers + KV/D1 + R2).

## What is a Cl1p?
A **Cl1p** is a named, shareable object identified by a URL slug (e.g. `cl1p.in/my-clip`). It can contain:
- Plain text
- One or more uploaded files

---

## Features

### Core
- Create a Cl1p at a custom slug
- Retrieve a Cl1p by its slug
- Cl1ps have a configurable expiry time (after which they are deleted)

### Password Protection
| Password Type | Purpose | Required? |
|---|---|---|
| `ReadPassword` | Required to view the Cl1p | Optional |
| `WritePassword` | Required to update/edit the Cl1p | Optional |

- If no `ReadPassword` is set → anyone can read
- If no `WritePassword` is set → anyone can write/edit

### Editability
A Cl1p stores an `edit_mode` that controls who can modify it after creation:

| `edit_mode` | Meaning |
|---|---|
| `read_only` | No one can edit after creation |
| `public` | Anyone can edit without a password |
| `password` | Only someone with the `WritePassword` can edit |

- `edit_mode` is set at creation time and stored in the backend
- If `edit_mode = password`, a `WritePassword` must be provided
- All passwords (`ReadPassword`, `WritePassword`) are hashed before storage — never stored in plaintext

---

## Frontend Flow

### Landing Page
- A single search/input box with a "Go" button
- Instructions on how to use cl1p.in shown below

### On Submit (slug entered)

#### Cl1p exists
- **Not password protected** → Show Cl1p immediately
- **ReadPassword set** → Show password prompt popup → correct password → Show Cl1p
- Text content is displayed with proper formatting (width/height)
  - If a language is stored (auto-detected or user-selected), text is rendered as a syntax-highlighted code block
  - User can change the displayed language via a dropdown in the code block header
- Files are shown with previews (image/video/pdf preview where applicable)

#### Cl1p does not exist → Show Create Form
Fields:
- **Cl1p name** — pre-filled from the searched slug
- **Privacy toggle** — Public / Private
  - If Private → show `ReadPassword` input
- **Editability toggle** — Read-only / Editable
  - If Editable → by Owner only or by Everyone
  - If Owner only → show `WritePassword` input
- **Text area** — for pasting text content
  - Auto-detects if content is code and identifies the language
  - User can override the detected language via a dropdown (options include common languages + json, markdown, plain text)
  - Text is rendered as a syntax-highlighted code block when a language is selected/detected, otherwise as plain text
- **File upload area**
  - Drag & drop or click to upload
  - File cards with preview (image thumbnail, file type icon, etc.)
  - Upload progress bar per file (% uploaded)
  - Actions per file: rename, delete
  - Allow adding more files before submitting
- **Expiry selector** — choose how long the Cl1p lives (e.g. 1h, 24h, 7d, 30d, never)
- **Create button** — submits and redirects to the Cl1p URL

---

## Expiry Strategy

Expiry is enforced via two complementary mechanisms:

### 1. Lazy Check (on every read)
Every `GET /api/clips/:slug` request checks expiry before returning data:
- If `expires_at` is set and `expires_at < now()` → delete the clip (D1 row + R2 files) and return `404`
- Ensures expired clips are never served and are cleaned up on first access after expiry

### 2. Cron Cleanup (every 1 hour)
A Workers Cron Trigger runs hourly to sweep up clips that expired but were never accessed again:
- Query: `SELECT slug FROM clips WHERE expires_at IS NOT NULL AND expires_at < unixepoch()`
- For each result: delete all R2 objects under the `{slug}/` prefix, then delete the D1 row (cascades to `clip_files`)
- Prevents orphaned data accumulating in D1 and R2 indefinitely

---

## Tech Stack (Cloudflare)
- **Frontend**: React + Vite → deployed on Cloudflare Pages
- **Backend**: Cloudflare Workers (API routes via Pages Functions)
- **Metadata storage**: Cloudflare KV or D1 — stores Cl1p metadata including `language`, `edit_mode`, and hashed passwords
- **File storage**: Cloudflare R2
