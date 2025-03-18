import functions from 'firebase-functions'
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

    if (pendingOrder == null) {
      const orderRef = eventRef.collection('orders').doc()
      transaction.create(orderRef, {
        user_id,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
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
        updated_at: Timestamp.now(),
      })
      return {
        order_id: pendingOrder.id,
      }
    }
  })
})

export const delete_order = functions.region('asia-northeast1').https.onCall(async (data, context) => {
  const user_id = context.auth?.uid
  if (user_id == null) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.')
  }

  return db.runTransaction(async (transaction) => {
    const orderRef = db
      .collection('communities')
      .doc(data.community_id)
      .collection('events')
      .doc(data.event_id)
      .collection('orders')
      .doc(data.order_id)
    const orderSnapshot = await transaction.get(orderRef)
    if (orderSnapshot == null || orderSnapshot.exists === false) {
      throw new functions.https.HttpsError('not-found', `No order ${orderRef.path}`)
    }
    if (orderSnapshot.get('user_id') !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', `Invalid user ${context.auth?.uid}`)
    }
    if (orderSnapshot.get('status') !== 'in_cart') {
      throw new functions.https.HttpsError('invalid-argument', `Order ${orderRef.path} is not in_cart`)
    }

    const menus = orderSnapshot.get('menus').filter((m) => m.menu_id !== data.menu_id)
    if (menus.length === 0) {
      transaction.delete(orderRef)
    } else {
      const updated_at = Timestamp.now()
      transaction.update(orderRef, { menus, updated_at })
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
    transaction.update(orderSnapshot.ref, {
      canceled_at: data.status === 'canceled' ? Timestamp.now() : (orderSnapshot.get('canceled_at') ?? null),
      ordered_at: data.status === 'ordered' ? Timestamp.now() : (orderSnapshot.get('ordered_at') ?? null),
      updated_at: Timestamp.now(),
      status: data.status,
    })
    if (data.status === 'ordered') {
      transaction.set(
        db.collection('communities').doc(data.community_id).collection('members').doc(user_id),
        {
          updated_at: Timestamp.now(),
        },
        { merge: true },
      )
    }
  })
})
