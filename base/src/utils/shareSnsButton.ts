import type BokudeliCommunity from '@/schemes/bokudeliCommunity'
import type BokudeliEvent from '@/schemes/bokudeliEvent'
import { dateWithDayOfWeekString, dateOnlyTimeString } from '@/schemes/converter'
import type { Shop } from '@/schemes/shop'

const getCommunityHashTag = (community: BokudeliCommunity) => {
  console.log(community.community_sns_hash_tag)
  if (community.community_sns_hash_tag != '') {
    return community.community_sns_hash_tag
  }
  // 正規表現を使って、ハッシュタグに使えない文字を取り除く
  // 使用可能な文字: アルファベット, 数字, アンダースコア, ひらがな, カタカナ, 漢字
  return community.community_name.replace(/[^a-zA-Z0-9_\u3040-\u30FF\u4E00-\u9FFF]/g, '')
}

const getXPostText = (event: BokudeliEvent, community: BokudeliCommunity, shop: Shop) => {
  const communityTwitterAccount = community.community_sns_twitter ?? ''
  const communityText = event.community_name + (communityTwitterAccount ? ` @${communityTwitterAccount}` : '')
  const shopText = shop.shop_name + (shop.shop_url_twitter ? ` @${shop.shop_url_twitter}` : '')

  const communityHashTag = '#' + getCommunityHashTag(community)

  const textList = [
    `🌟${event.event_name}`,
    `📅${dateWithDayOfWeekString(event.event_start_datetime)}~${dateOnlyTimeString(event.event_end_datetime)}`,
    `👥${communityText}`,
    `🍱${shopText}`,
    '',
    '👇参加はコチラから👇',
    `${event.url}`,
    '',
    `${communityHashTag} #shokujii`,
  ]
  return `${textList.join('\n')}`
}

const getCopyText = (event: BokudeliEvent, community: BokudeliCommunity, shop: Shop) => {
  const communityHashTag = '#' + getCommunityHashTag(community)

  const textList = [
    `🌟${event.event_name}`,
    `📅${dateWithDayOfWeekString(event.event_start_datetime)}~${dateOnlyTimeString(event.event_end_datetime)}`,
    `⏳${dateWithDayOfWeekString(event.event_deadline_datetime)}に注文締切`,
    `📍${event.event_address}`,
    `👥${event.community_name}`,
    `🍱${shop.shop_name}`,
    '',
    '👇参加はコチラから👇',
    `${event.url}?openExternalBrowser=1`,
    '',
    `${communityHashTag} #shokujii`,
  ]
  return `${textList.join('\n')}`
}

export const shareSnsButton = async (
  snsType: 'twitter' | 'facebook' | 'line' | 'copy',
  event: BokudeliEvent,
  community: BokudeliCommunity,
  shop: Shop,
  // pop-up block を防ぐため、先に window を開いておく
  // TODO copy 等動作の異なる処理を一関数にまとめるのは本来良くないので、修正する
  _window?: Window,
) => {
  const eventUrl = encodeURIComponent(event.url)
  if (snsType === 'twitter') {
    const baseUrl = 'https://twitter.com/intent/tweet'
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
