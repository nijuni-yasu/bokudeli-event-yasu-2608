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

  const members: EventMember[] = []
  for (const member of memberList) {
    const menuStrings = member.menus.map((menu: { name: string; count: number }) => `${menu.name}(${menu.count})`)
    const memberIndex = members.findIndex((m) => m.userId === member.userId)
    if (memberIndex !== -1) {
      members[memberIndex].menus = members[memberIndex].menus?.concat(menuStrings)
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
      updatedAt: userData?.updated_at?.toDate(),
    })
  }

  return members
}

export const loadEventMembersWithoutMenu = async (communityAccount: string, eventId: string) => {
  const memberDb = query(
    collectionGroup(db, 'orders'),
    where('community_account', '==', communityAccount),
    where('event_id', '==', eventId),
    where('status', '==', 'ordered'),
    orderBy('user_id', 'asc'),
    orderBy('updated_at', 'asc')
  )

  const memberSnapshot = await getDocs(memberDb)

  const userIdList = memberSnapshot.docs
    .map((doc) => {
      const { user_id } = doc.data()
      return user_id
    })
    .filter((userId, index, self) => self.indexOf(userId) === index)

  const members = [] as EventMember[]
  const procs = userIdList.map(async (userId) => {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    const userData = userSnap.data()

    members.push({
      userId: userId,
      username: userData?.user_name,
      userImageUrl: userData?.user_image_url,
      updatedAt: userData?.updated_at?.toDate(),
    })
  })

  await Promise.all(procs)
  members.sort((a, b) => (a.updatedAt?.getTime() ?? 0) - (b.updatedAt?.getTime() ?? 0))

  return members
}
