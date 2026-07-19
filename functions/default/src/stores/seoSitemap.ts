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
