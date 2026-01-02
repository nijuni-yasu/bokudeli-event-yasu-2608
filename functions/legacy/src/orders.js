import functions from 'firebase-functions/v1'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const db = getFirestore()

export const add_order = functions.region('asia-northeast1').https.onCall(async (data, context) => {
  const user_id = context.auth?.uid
  if (user_id == null) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.')
  }

  return db.runTransaction(async (transaction) => {
    const community_id = data.community_id
    const event_id = data.event_id
    const eventRef = db.collection('communities').doc(community_id).collection('events').doc(event_id)
    const eventSnapshot = await transaction.get(eventRef)
    if (eventSnapshot == null || eventSnapshot?.exists === false) {
      throw new functions.https.HttpsError('not-found', `No events ${event_id}`)
    }
    const pendingOrder = (
      await transaction.get(
        eventRef.collection('orders').where('user_id', '==', user_id).where('status', '==', 'in_cart').limit(1),
      )
    ).docs[0]

    const now = Timestamp.now()
    if (pendingOrder == null) {
      const orderRef = eventRef.collection('orders').doc()
      transaction.create(orderRef, {
        user_id,
        created_at: now,
        carted_at: now,
        updated_at: now,
        community_id: community_id,
        community_account: eventSnapshot.get('community_account'),
        event_id,
        event_payment: eventSnapshot.get('event_payment'),
        menus: data.menus,
        order_id: orderRef.id,
        status: 'in_cart',
      })
      return {
        order_id: orderRef.id,
      }
    } else {
      const pendingOrderMenus = pendingOrder.get('menus')
      for (const menu of data.menus) {
        const menuIndex = pendingOrderMenus.findIndex((pom) => pom.menu_id === menu.menu_id)
        if (menuIndex !== -1) {
          pendingOrderMenus[menuIndex].count += menu.count
        } else {
          pendingOrderMenus.push(menu)
        }
      }
      transaction.update(pendingOrder.ref, {
        menus: pendingOrderMenus,
        updated_at: now,
      })
      return {
        order_id: pendingOrder.id,
      }
    }
  })
})

export const update_order_status = functions.region('asia-northeast1').https.onCall(async (data, context) => {
  const user_id = context.auth?.uid
  if (user_id == null) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.')
  }

  return db.runTransaction(async (transaction) => {
    const eventRef = db.collection('communities').doc(data.community_id).collection('events').doc(data.event_id)
    const orderRef = eventRef.collection('orders').doc(data.order_id)
    const [orderSnapshot, eventSnapshot] = await Promise.all([transaction.get(orderRef), transaction.get(eventRef)])
    if (
      orderSnapshot == null ||
      orderSnapshot.exists === false ||
      eventSnapshot == null ||
      eventSnapshot.exists === false
    ) {
      throw new functions.https.HttpsError('not-found', `No order ${eventRef.path}, ${orderRef.path}`)
    }
    if (orderSnapshot.get('user_id') !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', `Invalid user ${context.auth?.uid}`)
    }
    if (eventSnapshot.get('event_payment') === 'user_advance' && data.status === 'ordered') {
      throw new functions.https.HttpsError(
        'permission-denied',
        `In event payment "user_advance", you cannot change the status to ${data.status}`,
      )
    }
    const now = Timestamp.now()
    const canceled_at = data.status === 'canceled' ? now : orderSnapshot.get('canceled_at')
    const ordered_at = data.status === 'ordered' ? now : orderSnapshot.get('ordered_at')
    transaction.update(orderSnapshot.ref, {
      ...(canceled_at != null && { canceled_at}),
      ...(ordered_at != null && { ordered_at }),
      updated_at: now,
      status: data.status,
    })
    if (data.status === 'ordered') {
      transaction.set(
        db.collection('communities').doc(data.community_id).collection('members').doc(user_id),
        {
          updated_at: now,
        },
        { merge: true },
      )
    }
  })
})
