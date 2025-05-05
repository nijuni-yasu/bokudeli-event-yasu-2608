import crypto from 'crypto'

export const generateRandomBase64UrlSafeString = (byteLength = 32) =>
  crypto.randomBytes(byteLength).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
