import { getFirestore, Timestamp } from 'firebase-admin/firestore'

export interface SitemapCommunityEntry {
  communityAccount: string
  updatedAtMillis: number
}

export interface SitemapEventEntry {
  communityAccount: string
  eventId: string
  updatedAtMillis: number
}

export interface SeoCommunityPreviewEntry {
  communityAccount: string
  communityName: string
}

const toUpdatedAtMillis = (value: unknown): number | undefined => {
  if (value instanceof Timestamp) {
    return value.toMillis()
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  return undefined
}

export const getPublicCommunitiesForSitemap = async (): Promise<SitemapCommunityEntry[]> => {
  const db = getFirestore()
  const snapshot = await db
    .collection('communities')
    .where('is_public', '==', true)
    .where('is_approved', '==', true)
    .where('enterprise_id', '==', null)
    .get()

  return snapshot.docs.flatMap((doc) => {
    const data = doc.data()
    const communityAccount = data.community_account
    const updatedAtMillis = toUpdatedAtMillis(data.updated_at)
    if (typeof communityAccount !== 'string' || communityAccount === '' || updatedAtMillis === undefined) {
      return []
    }
    return [{ communityAccount, updatedAtMillis }]
  })
}

export const getPublicEventsForSitemap = async (): Promise<SitemapEventEntry[]> => {
  const db = getFirestore()
  const snapshot = await db
    .collectionGroup('events')
    .where('is_public', '==', true)
    .where('is_deleted', '==', false)
    .where('enterprise_id', '==', null)
    .get()

  return snapshot.docs.flatMap((doc) => {
    const data = doc.data()
    const communityAccount = data.community_account
    const updatedAtMillis = toUpdatedAtMillis(data.updated_at)
    if (typeof communityAccount !== 'string' || communityAccount === '' || updatedAtMillis === undefined) {
      return []
    }
    return [{ communityAccount, eventId: doc.id, updatedAtMillis }]
  })
}

export const getPublicCommunitiesForSeoPreview = async (limit: number): Promise<SeoCommunityPreviewEntry[]> => {
  const db = getFirestore()
  const snapshot = await db
    .collection('communities')
    .where('is_public', '==', true)
    .where('is_approved', '==', true)
    .where('enterprise_id', '==', null)
    .orderBy('community_num_members', 'desc')
    .limit(limit)
    .get()

  return snapshot.docs.flatMap((doc) => {
    const data = doc.data()
    const communityAccount = data.community_account
    const communityName = data.community_name
    if (typeof communityAccount !== 'string' || communityAccount === '') {
      return []
    }
    if (typeof communityName !== 'string' || communityName === '') {
      return []
    }
    return [{ communityAccount, communityName }]
  })
}
