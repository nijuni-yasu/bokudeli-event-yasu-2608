import type BokudeliCommunity from '@/schemes/bokudeliCommunity'
import type BokudeliEvent from '@/schemes/bokudeliEvent'
import { dateWithDayOfWeekString, dateOnlyTimeString } from '@/schemes/converter'
import type { Shop } from '@/schemes/shop'

const getXPostTextAfterOrder = (event: BokudeliEvent, community: BokudeliCommunity, shop: Shop) => {
  const communityTwitterAccount = community.community_sns_twitter ?? ''
  const communityText = event.community_name + (communityTwitterAccount ? ` @${communityTwitterAccount}` : '')
  const shopText = shop.shop_name + (shop.shop_url_twitter ? ` @${shop.shop_url_twitter}` : '')
  const hashTagText =
    event.event_sns_hash_tag != null && event.event_sns_hash_tag !== ''
      ? `#${event.event_sns_hash_tag} #shokujii`
      : '#食事でつながる #shokujii'

  const textList = [
    `${event.event_name} に参加します✋`,
    '',
    `📅日時：${dateWithDayOfWeekString(event.event_start_datetime)}~`,
    `👥主催：${communityText}`,
    `👩‍🍳食事：${shopText}`,
    `👉詳細：${event.url}`,
    '',
    `${hashTagText}`,
  ]
  return `${textList.join('\n')}`
}

const getXPostText = (event: BokudeliEvent, community: BokudeliCommunity, shop: Shop) => {
  const communityTwitterAccount = community.community_sns_twitter ?? ''
  const communityText = event.community_name + (communityTwitterAccount ? ` @${communityTwitterAccount}` : '')
  const shopText = shop.shop_name + (shop.shop_url_twitter ? ` @${shop.shop_url_twitter}` : '')
  const hashTagText =
    event.event_sns_hash_tag != null && event.event_sns_hash_tag !== ''
      ? `#${event.event_sns_hash_tag} #shokujii`
      : '#食事でつながる #shokujii'

  const textList = [
   `${event.event_name} に参加します✋`,
    '',
    `📅日時：${dateWithDayOfWeekString(event.event_start_datetime)}~`,
    `👥主催：${communityText}`,
    `👩‍🍳食事：${shopText}`,
    `👉詳細：${event.url}`,
    '',
    `${hashTagText}`,
  ]
  return `${textList.join('\n')}`
}

const getCopyText = (event: BokudeliEvent, community: BokudeliCommunity, shop: Shop) => {
  const hashTagText =
    event.event_sns_hash_tag != null && event.event_sns_hash_tag !== ''
      ? `#${event.event_sns_hash_tag} #shokujii`
      : '#食事でつながる #shokujii'

  const textList = [
    `${event.event_name}`,
    '',
    `📅日時：${dateWithDayOfWeekString(event.event_start_datetime)}~${dateOnlyTimeString(event.event_end_datetime)}`,
    `⏳期限：${dateWithDayOfWeekString(event.event_deadline_datetime)}に注文締切`,
    `📍場所：${event.event_address} ${event.event_place}`,
    `👥主催：${event.community_name}`,
    `👩‍🍳食事：${shop.shop_name}`,
    `👉詳細：${event.url}`,
    '',
    `${hashTagText}`,
  ]
  return `${textList.join('\n')}`
}

export const shareSnsButton = async (
  snsType: 'twitter' | 'facebook' | 'line' | 'copy' | 'twitterAfterOrder',
  event: BokudeliEvent,
  community: BokudeliCommunity,
  shop: Shop,
  // pop-up block を防ぐため、先に window を開いておく
  // TODO copy 等動作の異なる処理を一関数にまとめるのは本来良くないので、修正する
  _window?: Window,
) => {
  const eventUrl = encodeURIComponent(event.url)
  if (snsType === 'twitter' || snsType === 'twitterAfterOrder') {
    const baseUrl = 'https://x.com/intent/post'
    const text = encodeURIComponent(getXPostText(event, community, shop))
    const openUrl = `${baseUrl}?text=${text}`
    _window!.location.href = openUrl
 } else if (snsType === 'facebook') {
    const baseUrl = 'https://www.facebook.com/sharer/sharer.php'
    const openUrl = `${baseUrl}?&u=${eventUrl}`
    _window!.location.href = openUrl
  } else if (snsType === 'line') {
    const baseUrl = 'https://social-plugins.line.me/lineit/share'
    const openUrl = `${baseUrl}?&url=${eventUrl}?openExternalBrowser=1`
    _window!.location.href = openUrl
  } else if (snsType === 'copy') {
    const text = getCopyText(event, community, shop)
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert('クリップボードにコピーしました')
      })
      .catch((err) => {
        console.error('コピー失敗: ', err)
      })
  }
}
