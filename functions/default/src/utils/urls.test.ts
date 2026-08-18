import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('firebase-functions/params', () => ({
  defineString: () => ({
    value: () => 'pf.example.com',
  }),
}))

vi.mock('firebase-admin/storage', () => ({
  getStorage: () => ({
    bucket: () => ({ name: 'test-bucket' }),
  }),
}))

const getEnterpriseById = vi.fn()

vi.mock('../stores/enterprise.js', () => ({
  getEnterpriseById: (...args: unknown[]) => getEnterpriseById(...args),
}))

import {
  getCommunityUrlForCommunity,
  getEventUrlForCommunity,
  getEventUrlForEvent,
  getUserUrlForCommunity,
  resolveAppHostForCommunity,
} from './urls.js'

describe('urls community host resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('resolveAppHostForCommunity', () => {
    it('PF コミュニティは EVENT_HOST を返す', async () => {
      await expect(resolveAppHostForCommunity({ enterprise_id: null })).resolves.toBe('pf.example.com')
    })

    it('enterprise コミュニティは custom_domain を返す', async () => {
      getEnterpriseById.mockResolvedValue({
        subdomain: 'acme',
        custom_domain: 'lunch.acme.co.jp',
      })
      await expect(resolveAppHostForCommunity({ enterprise_id: 'ent-1' })).resolves.toBe('lunch.acme.co.jp')
    })

    it('enterprise 未存在時は undefined', async () => {
      getEnterpriseById.mockResolvedValue(undefined)
      await expect(resolveAppHostForCommunity({ enterprise_id: 'ent-missing' })).resolves.toBeUndefined()
    })

    it('ホスト未設定 enterprise は undefined', async () => {
      getEnterpriseById.mockResolvedValue({ subdomain: '', custom_domain: null })
      await expect(resolveAppHostForCommunity({ enterprise_id: 'ent-1' })).resolves.toBeUndefined()
    })
  })

  describe('getCommunityUrlForCommunity', () => {
    it('enterprise host で community URL を生成する', async () => {
      getEnterpriseById.mockResolvedValue({
        subdomain: 'acme',
        custom_domain: 'lunch.acme.co.jp',
      })
      await expect(
        getCommunityUrlForCommunity({ community_account: 'my-community', enterprise_id: 'ent-1' }),
      ).resolves.toBe('https://lunch.acme.co.jp/c/my-community')
    })
  })

  describe('getEventUrlForCommunity', () => {
    it('PF コミュニティは EVENT_HOST で event URL を生成する', async () => {
      await expect(
        getEventUrlForCommunity({ community_account: 'pf-community', enterprise_id: null }, 'event-1'),
      ).resolves.toBe('https://pf.example.com/c/pf-community/e/event-1')
    })
  })

  describe('getEventUrlForEvent', () => {
    it('エンプライベントは enterprise host で URL を生成する', async () => {
      getEnterpriseById.mockResolvedValue({
        subdomain: 'acme',
        custom_domain: 'lunch.acme.co.jp',
      })
      await expect(
        getEventUrlForEvent({
          community_account: 'my-community',
          id: 'event-1',
          enterprise_id: 'ent-1',
        }),
      ).resolves.toBe('https://lunch.acme.co.jp/c/my-community/e/event-1')
    })

    it('PF イベントは EVENT_HOST で URL を生成する', async () => {
      await expect(
        getEventUrlForEvent({
          community_account: 'pf-community',
          id: 'event-1',
          enterprise_id: null,
        }),
      ).resolves.toBe('https://pf.example.com/c/pf-community/e/event-1')
    })

    it('enterprise 未存在時は PF にフォールバックせず undefined', async () => {
      getEnterpriseById.mockResolvedValue(undefined)
      await expect(
        getEventUrlForEvent({
          community_account: 'my-community',
          id: 'event-1',
          enterprise_id: 'ent-missing',
        }),
      ).resolves.toBeUndefined()
    })

    it('ホスト未設定 enterprise は undefined', async () => {
      getEnterpriseById.mockResolvedValue({ subdomain: '', custom_domain: null })
      await expect(
        getEventUrlForEvent({
          community_account: 'my-community',
          id: 'event-1',
          enterprise_id: 'ent-1',
        }),
      ).resolves.toBeUndefined()
    })
  })

  describe('getUserUrlForCommunity', () => {
    it('PF コミュニティは EVENT_HOST で profile URL を生成する', async () => {
      await expect(getUserUrlForCommunity({ enterprise_id: null }, 'user-1')).resolves.toBe(
        'https://pf.example.com/u/user-1',
      )
    })

    it('enterprise コミュニティは enterprise host で profile URL を生成する', async () => {
      getEnterpriseById.mockResolvedValue({
        subdomain: 'acme',
        custom_domain: 'lunch.acme.co.jp',
      })
      await expect(getUserUrlForCommunity({ enterprise_id: 'ent-1' }, 'user-1')).resolves.toBe(
        'https://lunch.acme.co.jp/u/user-1',
      )
    })

    it('enterprise 未存在時は undefined', async () => {
      getEnterpriseById.mockResolvedValue(undefined)
      await expect(getUserUrlForCommunity({ enterprise_id: 'ent-missing' }, 'user-1')).resolves.toBeUndefined()
    })
  })
})
