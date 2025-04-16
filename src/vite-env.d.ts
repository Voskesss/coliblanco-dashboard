/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PICOVOICE_ACCESS_KEY: string;
  readonly VITE_WAKE_WORD: string;
  readonly VITE_LANGUAGE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
