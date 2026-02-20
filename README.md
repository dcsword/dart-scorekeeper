# Dart 501 Scorekeeper (React + Node + Hosted DB)

A clean, dark-themed darts scorekeeper that supports:

- **1-player or 2-player** matches
- Configurable **starting score** (default 501)
- **Turn order enforcement** (for 2 players)
- **Double-out option** (classic 501 rule)
- **Persistent history** in a hosted database (PostgreSQL)
- **Fewer than 3 darts** per visit (leave remaining darts blank)

---

## Stack

- Frontend: **React (Vite)**
- Backend: **Node.js + Express**
- DB: **PostgreSQL** via **Prisma** ORM

---

## Local setup

### 1) Requirements
- Node.js 18+ (or 20+)
- VS Code

### 2) Install
From project root:

```bash
npm install
```

### 3) Configure DB
You can use a local SQLite DB for quick dev **or** Postgres.

#### Option A — Local SQLite (fastest)
Create `server/.env`:

```bash
cp server/.env.example server/.env
```

Then migrate:

```bash
cd server
npx prisma migrate dev --name init
cd ..
```

#### Option B — Hosted Postgres (recommended)
Create a Postgres database on any provider (Supabase/Neon/Render/Railway/etc) and copy the connection string.

Set in `server/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
```

Then migrate:

```bash
cd server
npx prisma migrate deploy
cd ..
```

### 4) Run (client + server)

```bash
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:4000

---

## Double-out input format

To support double-out while keeping fast input, each dart accepts either:

- Plain number: `20` (treated as points only; **not** considered a double)
- Notation: `S20`, `D20`, `T20`
- Bulls: `SBULL` (25), `DBULL` (50)

**Important:** If **Double-out** is enabled and you reach exactly **0**, the **last *thrown* dart** must be a double (`D..` or `DBULL`).

Examples:
- `T20`, `T20`, `D20` => 60 + 60 + 40 (last is double ✅)
- `D20`, ``, `` => finishes on first dart ✅ (leave remaining blank)
- `60`, `60`, `40` => last is NOT marked as double ❌ (will bust if it attempts to finish)

---

## Entering fewer than 3 darts

If you finish a leg early (e.g., checkout on the 1st or 2nd dart), just **leave the remaining dart inputs blank**.

- Blank (`""`) = **not thrown**
- `0` = **thrown and missed** (still counts as thrown)

---

## API endpoints

- `POST /api/matches` create match
- `GET /api/matches/:id` get match
- `POST /api/matches/:id/turns` add turn (enforces turn order)
- `POST /api/matches/:id/undo` undo last

---

## Deploy (cheap/free)

### Recommended: Netlify (frontend) + Render (API) + Hosted Postgres

1) Deploy the **API** (Render)
- Root directory: `server`
- Build command:
  ```bash
  npm install && npx prisma generate && npx prisma migrate deploy
  ```
- Start command: `npm start`
- Env vars:
  - `DATABASE_URL` = hosted Postgres URL
  - `CORS_ORIGIN` = your Netlify URL

2) Deploy the **frontend** (Netlify)
- Base directory: `client`
- Build: `npm run build`
- Publish: `dist`
- Env var:
  - `VITE_API_URL` = your Render API URL

---

## Push to GitHub

```bash
git init
git add .
git commit -m "Dart scorekeeper v2.1 (db + double-out + turn order + fewer darts)"

git branch -M main
git remote add origin https://github.com/<YOU>/<REPO>.git
git push -u origin main
```
