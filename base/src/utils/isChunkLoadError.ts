const CHUNK_ERROR_PATTERN =
  /Loading chunk|Failed to fetch dynamically|Importing a module script failed|ChunkLoadError|dynamically imported module/i

export function isChunkLoadError(err: unknown): boolean {
  if (err instanceof Error) {
    if (err.name === 'ChunkLoadError') return true
    if (CHUNK_ERROR_PATTERN.test(err.message)) return true
  }
  return CHUNK_ERROR_PATTERN.test(String(err))
}
