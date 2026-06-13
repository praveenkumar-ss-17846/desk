/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the assistant backend (Cloudflare Worker). Empty = sync off. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
