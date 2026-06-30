/** 無操作で自動ログアウトするまでの時間（1週間） */
export const SESSION_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000

export const SESSION_LAST_ACTIVITY_KEY = 'enterprise:last_activity_at'

/** タイムアウト後ログイン画面でトースト表示するための sessionStorage キー */
export const SESSION_TIMEOUT_FLAG_KEY = 'enterprise:session_timeout'
