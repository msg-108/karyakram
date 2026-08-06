/**
 * Runtime feature flags. Controlled via VITE_FF_* environment variables.
 * Defaults are safe: payment enabled, experimental features disabled.
 */
export const featureFlags = {
  /** eSewa payment gateway */
  PAYMENT_ESEWA_ENABLED: import.meta.env.VITE_FF_ESEWA !== 'false',

  /** Khalti payment gateway */
  PAYMENT_KHALTI_ENABLED: import.meta.env.VITE_FF_KHALTI !== 'false',

  /** CSV/PDF report export (backend returns 501 until implemented) */
  EXPORT_REPORTS_ENABLED: import.meta.env.VITE_FF_EXPORTS === 'true',

  /** Ticket receipt PDF download (backend returns 501) */
  RECEIPT_DOWNLOAD_ENABLED: false,

  /** React Query DevTools (dev only) */
  REACT_QUERY_DEVTOOLS: import.meta.env.DEV,
} as const;
