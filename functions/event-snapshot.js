import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { getFirestore } from 'firebase-admin/firestore'

const makeMenuSnapshot = async (db, partnerId, communityId, eventId, startDatetime, endDatetime) => {
  // 各パラメータの null チェックは行わず、あえて exception が発生するようにしておく
  const sourceCollectionRef = db.collection('partners').doc(partnerId).collection('menus')
  const targetCollectionRef = db
    .collection('communities')
    .doc(communityId)
    .collection('events')
    .doc(eventId)
    .collection('menus')

  await db.runTransaction(async (transaction) => {
    const targetSnapshot = await transaction.get(targetCollectionRef)
    const sourceSnapshot = await transaction.get(sourceCollectionRef)
    targetSnapshot.docs.forEach((doc) => {
      transaction.delete(doc.ref)
    })
    sourceSnapshot.docs.forEach((doc) => {
      const menuDateStart = doc.get('menu_date_start')?.toMillis()
      const menuDateEnd = doc.get('menu_date_end')?.toMillis()
      if (
        menuDateStart == null ||
        menuDateEnd == null ||
        (menuDateStart <= endDatetime && startDatetime <= menuDateEnd)
      ) {
        transaction.set(targetCollectionRef.doc(doc.id), doc.data())
      }
    })
  })
}

export const make_shop_snapshot_to_event = onDocumentWritten(
  'communities/{communityId}/events/{eventId}',
  async (event) => {
    if (event.data.after == null) {
      return
    }
    const beforeStatus = event.data.before?.get('event_status')?.value
    const afterStatus = event.data.after.get('event_status')?.value
    if (beforeStatus === 'accepting_order') {
      if (afterStatus === 'accepting_order') {
        // Do nothing
        return
      }
      console.warn(
        `Event status changed from accepting_order to ${afterStatus}\n` +
          `Community: ${event.data.after.get('community_id')}, Event: ${event.data.after.id}`,
      )
      // Fall through to make menu snapshot
    }

    const afterStartDatetime = event.data.after.get('event_start_datetime')?.toMillis()
    const beforeEndDatetime = event.data.before?.get('event_end_datetime')?.toMillis()
    const partnerId = event.data.after.get('partner_id')
    const communityId = event.data.after.get('community_id')
    const eventId = event.data.after.id
    try {
      await makeMenuSnapshot(getFirestore(), partnerId, communityId, eventId, afterStartDatetime, beforeEndDatetime)
    } catch (error) {
      console.warn(`Community: ${communityId}, Event: ${eventId}, EventName: ${event.get('event_name')}`, error)
    }
  },
)
