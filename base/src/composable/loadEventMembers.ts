import { db } from '@/firebase'
import { collectionGroup, getDocs, orderBy, query, where } from 'firebase/firestore'

// Deprecated
// 現在、cart.vue の中でメンバーの数を数えるためにしか使用されていない
// TODO eventStore を使用するようにする
export const loadEventMembers = async (communityAccount: string, eventId: string) => {
  const memberDb = query(
    collectionGroup(db, 'orders'),
    where('community_account', '==', communityAccount),
    where('event_id', '==', eventId),
    where('status', '==', 'ordered'),
    orderBy('updated_at', 'asc'),
  )
  const memberSnapshot = await getDocs(memberDb)

  const memberList = memberSnapshot.docs.map((doc): { menus: any[]; userId: string } => {
    const { menus, user_id } = doc.data()
    return { menus, userId: user_id }
  })

  return memberList

  // const members: EventMember[] = []
  // for (const member of memberList) {
  //   const menuStrings = member.menus.map((menu: { name: string; count: number }) => `${menu.name}(${menu.count})`)
  //   const memberIndex = members.findIndex((m) => m.userStore.user?.user_id === member.userId)
  //   if (memberIndex !== -1) {
  //     members[memberIndex].menus = members[memberIndex].menus?.concat(menuStrings)
  //     continue
  //   }

  //   const userRef = doc(db, 'users', member.userId)
  //   const userSnap = await getDoc(userRef)
  //   const userData = userSnap.data()

  //   members.push({
  //     menus: menuStrings,
  //     userId: member.userId,
  //     username: userData?.user_name,
  //     userImageUrl: userData?.user_image_url,
  //     updatedAt: userData?.updated_at?.toDate(),
  //   })
  // }

  // return members
}
