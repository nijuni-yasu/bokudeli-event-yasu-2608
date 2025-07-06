import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import * as sgMail from './utils/sendgrid.js'
import { DEFAULT_FROM, SUPPORT_MAIL } from './utils/mail.js'
import { PartnerShop } from './schemas/PartnerShop.js'

const sendShopOpenMailToSupport = async (shop: PartnerShop) => {
  const shopName = shop.shop_name
  const shopAddress = shop.shop_address
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
    if (event.data === undefined) {
      return
    }
    const before = new PartnerShop(event.id, event.data?.before)
    const after = new PartnerShop(event.id, event.data?.after)
    const promises = []
    if (after.is_open && before?.is_open !== after.is_open) {
      promises.push(sendShopOpenMailToSupport(after))
    }

    await Promise.all(promises)
  },
)
