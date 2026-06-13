# assistant-api

Backend for the [assistant PWA](../../apps/assistant). It stores a JSON
snapshot of your tasks and notes so you can **back them up to the cloud and
restore them on another device** using a private sync code.

**Stack:** Cloudflare Workers (free tier) + [Hono](https://hono.dev) router +
D1 (Cloudflare's SQLite). Cloudflare Workers were chosen because the free tier
runs a real always-on API with a database and (later) scheduled jobs for push
reminders — without us managing a server.

## API

| Method | Path            | Purpose                                  |
| ------ | --------------- | ---------------------------------------- |
| GET    | `/health`       | Liveness check                           |
| GET    | `/state/:code`  | Fetch the snapshot stored under `:code`  |
| PUT    | `/state/:code`  | Save (overwrite) the snapshot for `:code`|

The sync code is both the id and the password for a snapshot, so keep it
private. The app generates a long random one for you on first backup.

## Deploy (one-time, ~5 minutes)

You need a free [Cloudflare account](https://dash.cloudflare.com/sign-up).

```bash
cd services/assistant-api
npm install
npx wrangler login                       # opens a browser to authorise

# 1. Create the database, then paste the printed database_id into wrangler.toml
npx wrangler d1 create desk-assistant

# 2. Create the table
npm run db:init

# 3. Ship it
npm run deploy
```

`wrangler deploy` prints your API URL, e.g.
`https://desk-assistant-api.<your-subdomain>.workers.dev`.

## Connect the app to it

In the GitHub repo: **Settings → Secrets and variables → Actions → Variables →
New variable**, named `VITE_API_URL`, set to the Worker URL above. The next
deploy of the app will show a **Cloud sync** section in Settings.

## Local development

```bash
npm run dev        # runs the Worker locally with a local D1
npm run typecheck
```
