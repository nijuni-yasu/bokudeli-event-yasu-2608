import { db } from '@/firebase'
import { type OrderItem } from '@/schemes/orderItem'
import { FirestoredUser } from '@/schemes/storedUser'
import { Timestamp, collectionGroup, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore'

const loadUser = async (userId: string) => {
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  return userSnap.exists() ? userSnap.data() : undefined
}

const addCommunityUser = async (communityId: string, userId: string) => {
  const user = (await loadUser(userId)) as FirestoredUser | undefined
  if (!user) {
    return
  }

  const memberUserDoc = doc(db, 'communities', communityId, 'members', userId)
  setDoc(memberUserDoc, { updated_at: Timestamp.now() }, { merge: true })
}

export const fixOrder = async (order: OrderItem) => {
  const orderId = order.order_id
  const orderRef = query(collectionGroup(db, 'orders'), where('order_id', '==', orderId))
  const orderSnapshot = await getDocs(orderRef)
  const orderDocument = orderSnapshot.docs[0]

  await setDoc(
    orderDocument.ref,
    { status: 'ordered', ordered_at: Timestamp.now(), updated_at: Timestamp.now(), event_payment: order.event_payment },
    { merge: true },
  )
  await addCommunityUser(order.community_id, order.user_id)
}

export const fixCancelOrder = async (order: OrderItem) => {
  const orderId = order.order_id
  const orderRef = query(collectionGroup(db, 'orders'), where('order_id', '==', orderId))
  const orderSnapshot = await getDocs(orderRef)
  const orderDocument = orderSnapshot.docs[0]

  await setDoc(
    orderDocument.ref,
    { status: 'canceled', canceled_at: Timestamp.now(), updated_at: Timestamp.now()},
    { merge: true },
  )
}
