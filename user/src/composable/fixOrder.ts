import { db } from '@/firebase'
import OrderItem from '@/schemes/orderItem'
import { FirestoredUser } from '@/schemes/storedUser'
import { Timestamp, collectionGroup, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore'

const loadUser = async (userId: string) => {
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  return userSnap.exists() ? userSnap.data() : undefined
}

const addCommunityUser = async (communityId: string, userId: string) => {
  const userDoc = (await loadUser(userId)) as FirestoredUser | undefined
  if (!userDoc) {
    return
  }

  userDoc.updated_at = Timestamp.now()
  const memberUserDoc = doc(db, 'communities', communityId, 'members', userId)
  setDoc(memberUserDoc, userDoc, { merge: true })
}

export const fixOrder = async (order: OrderItem) => {
  const orderId = order.order_id
  const orderRef = query(collectionGroup(db, 'orders'), where('order_id', '==', orderId))
  const orderSnapshot = await getDocs(orderRef)
  const orderDocument = orderSnapshot.docs[0]

  await setDoc(orderDocument.ref, { status: 'ordered', updated_at: Timestamp.now() }, { merge: true })
  await addCommunityUser(order.community_id, order.user_id)
}
