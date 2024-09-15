import { BokudeliCommunity } from '@/schemes/bokudeliCommunity'
import { db } from '@/firebase'
import { doc, getDoc } from 'firebase/firestore'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { dateWithDayOfWeekString, dateOnlyTimeString } from '@/schemes/converter'
import { useCommunityStore, type CommunityStore } from '@/stores/community'
import type { Shop } from '@/schemes/shop'

const getShopAccount = async (event: BokudeliEvent): Promise<Shop> => {
  const shopDocRef = doc(db, 'partners', event.partner_id, 'shops', event.shop_id)
  const shopDoc = await getDoc(shopDocRef)
  return shopDoc.data() as Shop
}

const getCommunityHashTag = (community: BokudeliCommunity) => {
  console.log(community.community_sns_hash_tag)
  if (community.community_sns_hash_tag != '') {
    return community.community_sns_hash_tag
  }
  // 正規表現を使って、ハッシュタグに使えない文字を取り除く
  // 使用可能な文字: アルファベット, 数字, アンダースコア, ひらがな, カタカナ, 漢字
  return community.community_name.replace(/[^a-zA-Z0-9_\u3040-\u30FF\u4E00-\u9FFF]/g, '')
}

const getShopHashTag = (shop: Shop) => {
  return shop.shop_name.replace(/[^a-zA-Z0-9_\u3040-\u30FF\u4E00-\u9FFF]/g, '')
}

const getXPostText = (event: BokudeliEvent, community: BokudeliCommunity, shop: Shop) => {
  const communityTwitterAccount = community.community_sns_twitter ?? ''
  const communityText = event.community_name + (communityTwitterAccount ? ` @${communityTwitterAccount}` : '')
  const shopText = shop.shop_name + (shop.shop_url_twitter ? ` @${shop.shop_url_twitter}` : '')

  const communityHashTag = '#' + getCommunityHashTag(community)
  const shopHashTag = '#' + getShopHashTag(shop)

  const textList = [
    `🌟${event.event_name}`,
    `📅${dateWithDayOfWeekString(event.event_start_datetime)}~${dateOnlyTimeString(event.event_end_datetime)}`,
    `👥${communityText}`,
    `🍱${shopText}`,
    '',
    `${communityHashTag}`,
    `${shopHashTag}`,
    `#shokujii`,
    '',
    '👇参加はこちらから👇',
  ]
  return `${textList.join('\n')}`
}

const getCopyText = (event: BokudeliEvent, community: BokudeliCommunity, shop: Shop) => {
  const communityHashTag = '#' + getCommunityHashTag(community)
  const shopHashTag = '#' + getShopHashTag(shop)

  const textList = [
    `🌟${event.event_name}`,
    `👥${event.community_name}`,
    `📅${dateWithDayOfWeekString(event.event_start_datetime)}~${dateOnlyTimeString(event.event_end_datetime)}`,
    `⏳${dateWithDayOfWeekString(event.event_deadline_datetime)}ﾏﾃﾞ注文OK`,
    `📍${event.event_address}`,
    `🍱${shop.shop_name}`,
    '',
    `${communityHashTag}`,
    `${shopHashTag}`,
    `#shokujii`,
    '',
    '👇参加はこちらから👇',
    `${event.url}?openExternalBrowser=1`,
  ]
  return `${textList.join('\n')}`
}

export const shareSnsButton = async (snsType: string, event: BokudeliEvent | null) => {
  if (event == null) {
    return
  }

  const communityStore = useCommunityStore(event.community_account) as CommunityStore
  const shop = await getShopAccount(event)

  const eventUrl = encodeURIComponent(event.url)
  if (snsType === 'twitter') {
    const baseUrl = 'https://twitter.com/intent/tweet'
    const text = encodeURIComponent(getXPostText(event, communityStore.community, shop))
    const openUrl = `${baseUrl}?text=${text}&url=${eventUrl}`
    window.open(openUrl, '_blank', 'width=800,height=500')
  } else if (snsType === 'facebook') {
    const baseUrl = 'https://www.facebook.com/sharer/sharer.php'
    const openUrl = `${baseUrl}?&u=${eventUrl}`
    window.open(openUrl, '_blank', 'width=800,height=500')
  } else if (snsType === 'line') {
    const baseUrl = 'https://social-plugins.line.me/lineit/share'
    const openUrl = `${baseUrl}?&url=${eventUrl}?openExternalBrowser=1`
    window.open(openUrl, '_blank', 'width=800,height=500')
  } else if (snsType === 'copy') {
    const text = getCopyText(event, communityStore.community, shop)
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert('詳細をコピーしました')
      })
      .catch((err) => {
        console.error('コピー失敗: ', err)
      })
  }
}
