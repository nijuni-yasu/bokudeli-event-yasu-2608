import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import * as sgMail from './utils/sendgrid.js'
import { DEFAULT_FROM, SUPPORT_MAIL } from './utils/mail.js'
import { PartnerShop } from '@shokujii/common/schemas/PartnerShop.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('shopOpen')

const sendShopOpenMailToSupport = async (shop: PartnerShop) => {
  const shopName = shop.shop_name
  const shopAddress = shop.fullAddress
  const partnerId = shop.partner_id
  const isOpen = shop.is_open ? '開店（OPEN）' : '閉店（CLOSE）'
  const subject = `${shopName}の開店設定が変更されました`
  // TODO これ以上複雑になるようなら、テンプレートを使う
  const text =
    `${shopName}の開店設定が『${isOpen}』になりました\n\n` +
    `【店舗名】${shopName}\n` +
    `【店舗住所】${shopAddress}\n` +
    `【PartnerID】${partnerId}\n` +
    `【開店設定】${isOpen}`
  return sgMail.send({
    to: SUPPORT_MAIL,
    from: DEFAULT_FROM,
    subject,
    text,
  })
}

export const shopStatusChanged = onDocumentWritten(
  {
    document: 'partners/{partnerId}/shops/{shopId}',
    region: 'asia-northeast1',
    secrets: ['SENDGRID_API_KEY'],
  },
  async (event) => {
    // v2 トリガーの幽霊状態（Firestore → Eventarc publish 断）を検知するための invocation log
    // 詳細: documents/07_リファクタリング/17_onDocumentWritten不具合.md
    logger.info('shopStatusChanged invoked', {
      partnerId: event.params.partnerId,
      shopId: event.params.shopId,
      hasBefore: event.data?.before.exists ?? false,
      hasAfter: event.data?.after.exists ?? false,
    })

    if (event.data === undefined) {
      logger.info('Event data is undefined; skip', {
        partnerId: event.params.partnerId,
        shopId: event.params.shopId,
      })
      return
    }
    const beforeData = event.data?.before.data()
    const afterData = event.data?.after.data()
    if (beforeData === undefined || afterData === undefined) {
      logger.info('before/after data is undefined; skip', {
        partnerId: event.params.partnerId,
        shopId: event.params.shopId,
        hasBeforeData: beforeData !== undefined,
        hasAfterData: afterData !== undefined,
      })
      return
    }
    const before = new PartnerShop(event.params.partnerId, event.params.shopId, beforeData)
    const after = new PartnerShop(event.params.partnerId, event.params.shopId, afterData)
    const promises = []
    // OPEN/CLOSE いずれの変更でもサポート宛にメール通知する
    if (before.is_open !== after.is_open) {
      logger.info('is_open changed; send mail to support', {
        partnerId: event.params.partnerId,
        shopId: event.params.shopId,
        from: before.is_open,
        to: after.is_open,
      })
      promises.push(sendShopOpenMailToSupport(after))
    } else {
      logger.info('is_open unchanged; no mail', {
        partnerId: event.params.partnerId,
        shopId: event.params.shopId,
      })
    }

    await Promise.all(promises)
  },
)
