# assistant

My personal assistant — built as an **installable PWA** (Progressive Web App)
so it can be developed entirely in the cloud and run on an iPhone with **no Mac
and no App Store**.

**Stack:** Vite + React + TypeScript + [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/).

## Develop

```bash
cd apps/assistant
npm install
npm run dev      # local dev server with hot reload
npm run build    # production build into dist/ (generates service worker)
npm run preview  # preview the production build locally
npm run icons    # regenerate PNG app icons from public/favicon.svg
```

## How it runs on the iPhone (no Mac needed)

1. Push changes to GitHub.
2. The repo-level workflow `.github/workflows/deploy-assistant.yml` builds this
   app and publishes `dist/` to **GitHub Pages**.
3. On the iPhone, open the Pages URL in **Safari** → Share → **Add to Home
   Screen**. It then launches full-screen with its own icon and works offline.

> One-time setup: in the GitHub repo, go to **Settings → Pages → Build and
> deployment → Source: GitHub Actions**. The Pages URL will be
> `https://<your-username>.github.io/desk/`.

## Current features

- **Home** — time-aware greeting, today's date, summary cards
- **Tasks** — add / edit / complete / delete, optional due dates, smart
  sorting (soonest due first, completed last), colour-coded due pills
- **Recurring tasks** — daily / weekly / monthly; completing one reschedules
  it to the next occurrence instead of marking it done
- **Tags** — label tasks and filter the list by tag
- **Reminders** — local notifications fire when a task's due time passes
  while the app is open (on iPhone this requires the installed PWA on
  iOS 16.4+; background-while-closed needs a push server we don't have yet)
- **Notes** — add / edit / delete, pin notes to the top
- **Search** — find across tasks and notes from one place
- **Settings** — light / dark theme, and export / import your data as JSON
- **Light / dark theme** toggle, persisted
- Everything persists locally (`localStorage`) and works offline
- Installable, full-screen, iOS-safe-area aware

## Notes

- `vite.config.ts` sets `base` to `/desk/` in production for GitHub Pages.
- PWA manifest and icons are configured in `vite.config.ts` and `public/`.
