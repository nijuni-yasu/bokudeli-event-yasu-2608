import {
  DocumentData,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  Transaction,
} from 'firebase-admin/firestore'
import { EventBulkCancelPipeline } from '@shokujii/common/schemas/EventBulkCancelPipeline.js'

/** 1 イベントにつき 1 ドキュメント（固定 id） */
const PIPELINE_DOC_ID = 'bulk_cancel'

class EventBulkCancelPipelineConverter implements FirestoreDataConverter<EventBulkCancelPipeline> {
  toFirestore(pipeline: EventBulkCancelPipeline): DocumentData {
    return pipeline.toFirestore()
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): EventBulkCancelPipeline {
    return new EventBulkCancelPipeline(snapshot.id, snapshot.data())
  }
}

const pipelineRef = (communityId: string, eventId: string) => {
  return getFirestore()
    .collection('communities')
    .doc(communityId)
    .collection('events')
    .doc(eventId)
    .collection('system')
    .doc(PIPELINE_DOC_ID)
    .withConverter(new EventBulkCancelPipelineConverter())
}

/** 一括中止パイプラインを取得する。ドキュメントが無い場合（一括中止していない・旧経路で中止済み）は null */
export const getEventBulkCancelPipeline = async (
  communityId: string,
  eventId: string,
  transaction?: Transaction,
): Promise<EventBulkCancelPipeline | null> => {
  const ref = pipelineRef(communityId, eventId)
  const snapshot = await (transaction === undefined ? ref.get() : transaction.get(ref))
  return snapshot.exists ? (snapshot.data() ?? null) : null
}

export const saveEventBulkCancelPipeline = async (
  communityId: string,
  eventId: string,
  pipeline: EventBulkCancelPipeline,
  transaction?: Transaction,
): Promise<void> => {
  const ref = pipelineRef(communityId, eventId)
  if (transaction === undefined) {
    await ref.set(pipeline)
  } else {
    transaction.set(ref, pipeline)
  }
}

/** 一括中止トランザクション内で呼ぶ。canceled にした注文・参加者のスナップショットを含む新規パイプラインを作成する */
export const createEventBulkCancelPipelineInTransaction = async (
  communityId: string,
  eventId: string,
  params: { bulkCanceledOrderIds: string[]; participantUserIds: string[] },
  transaction: Transaction,
): Promise<void> => {
  const pipeline = new EventBulkCancelPipeline(PIPELINE_DOC_ID, {
    bulk_canceled_order_ids: params.bulkCanceledOrderIds,
    participant_user_ids: params.participantUserIds,
  })
  await saveEventBulkCancelPipeline(communityId, eventId, pipeline, transaction)
}
