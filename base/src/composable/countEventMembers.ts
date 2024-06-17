import { db } from '@/firebase'
import { collectionGroup, getDocs, orderBy, query, where } from 'firebase/firestore'

export const countEventMembers = async (communityAccount: string, eventId: string) => {
  const memberDb = query(
    collectionGroup(db, 'orders'),
    where('community_account', '==', communityAccount),
    where('event_id', '==', eventId),
    where('status', '==', 'ordered'),
    orderBy('user_id', 'asc'),
  )

  const memberSnapshot = await getDocs(memberDb)
  const userIdList = memberSnapshot.docs.map((doc) => {
    return doc.data().user_id as string
  })

  return userIdList.filter((item, index, self) => {
    if (index === 0) {
      return true
    }
    return item !== self[index - 1]
  }).length
}
