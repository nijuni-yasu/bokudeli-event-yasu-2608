import { HttpsError } from 'firebase-functions/https'
import { getEnterpriseLogoStoragePath } from '@shokujii/common/utils/storagePaths.js'

const FIREBASE_STORAGE_HOST = 'firebasestorage.googleapis.com'

function isAllowedStorageHost(host: string): boolean {
  const normalized = host.toLowerCase()
  if (normalized === FIREBASE_STORAGE_HOST) {
    return true
  }
  const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST
  if (emulatorHost != null && emulatorHost !== '') {
    return normalized === emulatorHost.toLowerCase()
  }
  return false
}

/** Firebase Storage download URL からオブジェクトパス（例: enterprises/eid/logo/company-logo.png）を抽出する */
export function extractStorageObjectPathFromUrl(logoUrl: string): string {
  const parsed = new URL(logoUrl)
  const pathMatch = /\/o\/(.+)$/.exec(parsed.pathname)
  if (pathMatch == null) {
    throw new HttpsError('invalid-argument', 'company_logo_url must be under enterprise logo path')
  }
  try {
    return decodeURIComponent(pathMatch[1]!)
  } catch {
    throw new HttpsError('invalid-argument', 'company_logo_url must be under enterprise logo path')
  }
}

export function assertEnterpriseLogoUrl(enterpriseId: string, logoUrl: string): void {
  let parsed: URL
  try {
    parsed = new URL(logoUrl)
  } catch {
    throw new HttpsError('invalid-argument', 'company_logo_url must be a valid URL')
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new HttpsError('invalid-argument', 'company_logo_url must be a valid URL')
  }

  if (!isAllowedStorageHost(parsed.host)) {
    throw new HttpsError('invalid-argument', 'company_logo_url must be a Firebase Storage URL')
  }

  const objectPath = extractStorageObjectPathFromUrl(logoUrl)
  const expectedPath = getEnterpriseLogoStoragePath(enterpriseId)
  const logoDir = expectedPath.substring(0, expectedPath.lastIndexOf('/') + 1)

  if (!objectPath.startsWith(logoDir)) {
    throw new HttpsError('invalid-argument', 'company_logo_url must be under enterprise logo path')
  }
}
