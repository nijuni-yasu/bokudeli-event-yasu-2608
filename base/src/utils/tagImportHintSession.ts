const SESSION_KEY = 'tag-import-hint-seen'

export function hasSeenTagImportHint(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function markTagImportHintSeen(): void {
  sessionStorage.setItem(SESSION_KEY, '1')
}
