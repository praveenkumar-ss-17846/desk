# desk

**desk** is my personal private-cloud "desktop" — a single monorepo that holds
all of my personal projects: applications, backend services, shared libraries,
infrastructure, and documentation. Instead of scattering projects across many
repos, everything lives here under a predictable structure so new projects
always have an obvious home.

## Layout

```
desk/
├── apps/        # User-facing applications (mobile, web, desktop)
│   └── assistant-ios/   # iOS personal assistant app (stack TBD)
├── services/    # Backend services and APIs
├── packages/    # Shared, reusable libraries used across projects
├── infra/       # Infrastructure-as-code, deployment, environment config
├── docs/        # Documentation, design notes, knowledge base
├── tools/       # Dev scripts and tooling
└── .github/
    └── workflows/   # CI/CD pipelines
```

## Conventions

- **One home per project.** Each project lives under exactly one domain folder
  (`apps/`, `services/`, or `packages/`).
- **Naming.** Folder names are lowercase and hyphen-separated, e.g.
  `assistant-ios`, `notes-api`.
- **Self-documenting.** Every project folder owns a `README.md` describing its
  purpose and how to run it.
- **Share, don't copy.** Code reused across projects belongs in `packages/`,
  never duplicated between apps.
- **No secrets in git.** Environment and secret files (`.env`, `*.local`) are
  git-ignored; only `*.example` templates are committed.

## Projects

| Project | Location | Status |
| --- | --- | --- |
| Personal assistant (iOS) | `apps/assistant-ios/` | Planned — structure reserved, stack TBD |

## Getting started

This repo currently contains the structural scaffold only. To add a new project,
create a folder under the appropriate domain directory and give it a `README.md`.
