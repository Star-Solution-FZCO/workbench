/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_STORAGE_URL: string;
    readonly VITE_SENTRY_DSN: string;
    readonly VITE_MUI_X_LICENSE_KEY: string;
    readonly APP_VERSION: string;
    readonly VITE_WIKI_URL: string;
    readonly VITE_OWA_URL: string;
    readonly VITE_OWA_SITE_ID: string;
    readonly VITE_YOUTRACK_URL: string;
    readonly VITE_DEFAULT_EMAIL_DOMAIN: string;
    readonly VITE_OFFBOARD_CHECKLIST_URL: string;
    readonly VITE_CREDENTIALS_SERVICE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
