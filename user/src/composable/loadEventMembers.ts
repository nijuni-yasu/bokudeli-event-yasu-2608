import { db } from '@/firebase'
import { EventMember } from '@/schemes/EventMember'
import { collectionGroup, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore'

export const loadEventMembers = async (communityAccount: string, eventId: string) => {
  const memberDb = query(
    collectionGroup(db, 'orders'),
    where('community_account', '==', communityAccount),
    where('event_id', '==', eventId),
    where('status', '==', 'ordered'),
    orderBy('updated_at', 'asc')
  )
  const memberSnapshot = await getDocs(memberDb)

  const memberList = memberSnapshot.docs.map((doc): { menus: any[]; userId: string } => {
    const { menus, user_id } = doc.data()
    return { menus, userId: user_id }
  })

  const members = [] as EventMember[]
  for (const member of memberList) {
    const menuStrings = member.menus.map((menu: { name: string; count: number }) => `${menu.name}(${menu.count})`)
    const memberIndex = members.findIndex((m) => m.userId === member.userId)
    if (memberIndex !== -1) {
      members[memberIndex].menus = members[memberIndex].menus.concat(menuStrings)
      continue
    }

    const userRef = doc(db, 'users', member.userId)
    const userSnap = await getDoc(userRef)
    const userData = userSnap.data()

    members.push({
      menus: menuStrings,
      userId: member.userId,
      username: userData?.user_name,
      userImageUrl: userData?.user_image_url,
    })
  }

  return members
}
