import { describe, expect, it } from 'vitest'
import { HttpsError } from 'firebase-functions/https'
import { assertEnterpriseLogoUrl, extractStorageObjectPathFromUrl } from './enterpriseLogoUrl.js'

const enterpriseId = 'ent-a'
const encodedLogoUrl =
  'https://firebasestorage.googleapis.com/v0/b/my-bucket/o/enterprises%2Fent-a%2Flogo%2Fcompany-logo.png?alt=media'

describe('enterpriseLogoUrl', () => {
  describe('extractStorageObjectPathFromUrl', () => {
    it('%2F エンコードされた Storage URL からオブジェクトパスを抽出する', () => {
      expect(extractStorageObjectPathFromUrl(encodedLogoUrl)).toBe('enterprises/ent-a/logo/company-logo.png')
    })
  })

  describe('assertEnterpriseLogoUrl', () => {
    it('正規の Firebase Storage URL（%2F エンコード）を許可する', () => {
      expect(() => assertEnterpriseLogoUrl(enterpriseId, encodedLogoUrl)).not.toThrow()
    })

    it('別ホストの URL を拒否する', () => {
      expect(() =>
        assertEnterpriseLogoUrl(
          enterpriseId,
          'https://evil.example.com/v0/b/my-bucket/o/enterprises%2Fent-a%2Flogo%2Fcompany-logo.png',
        ),
      ).toThrow(HttpsError)
    })

    it('別企業のロゴパスを拒否する', () => {
      expect(() =>
        assertEnterpriseLogoUrl(
          enterpriseId,
          'https://firebasestorage.googleapis.com/v0/b/my-bucket/o/enterprises%2Fother%2Flogo%2Fcompany-logo.png',
        ),
      ).toThrow(HttpsError)
    })

    it('includes だけ一致する任意 URL を拒否する', () => {
      expect(() =>
        assertEnterpriseLogoUrl(
          enterpriseId,
          'https://evil.example.com/?q=enterprises%2Fent-a%2Flogo%2Fcompany-logo.png',
        ),
      ).toThrow(HttpsError)
    })
  })
})
