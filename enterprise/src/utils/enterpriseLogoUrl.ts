export function withEnterpriseLogoCacheBust(url: string, generation: number): string {
  if (generation <= 0) {
    return url
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url
  }
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${generation}`
}
