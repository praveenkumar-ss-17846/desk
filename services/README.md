# services

Backend services and APIs that power the apps in **desk**.

Each service is its own subfolder (e.g. `assistant-api/`) with its own
`README.md`, dependencies, and run instructions. Services expose APIs that apps
under `../apps/` consume, and they reuse shared code from `../packages/`.

| Service | Location | Purpose |
| --- | --- | --- |
| Assistant API | `assistant-api/` | Cloudflare Worker for cloud backup / sync of the assistant app |
