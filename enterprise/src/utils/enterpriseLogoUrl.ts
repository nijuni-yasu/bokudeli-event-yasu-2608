export function withEnterpriseLogoCacheBust(url: string, version: number): string {
  if (version <= 0) {
    return url
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url
  }
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${version}`
}
