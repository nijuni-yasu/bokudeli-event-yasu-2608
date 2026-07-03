const TERMS_BASE = (import.meta.env.VITE_TERMS_BASE_URL ?? 'https://terms.shokujii.jp').replace(/\/+$/, '')

export const LEGAL_URLS = {
  terms: `${TERMS_BASE}/user`,
  privacy: `${TERMS_BASE}/privacy`,
  commercial: `${TERMS_BASE}/specified_commercial_transactions`,
  partnerTerms: `${TERMS_BASE}/partner`,
} as const
