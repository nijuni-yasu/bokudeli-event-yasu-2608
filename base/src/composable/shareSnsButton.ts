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

export const shareSnsButton = async (snsType: string, event: BokudeliEvent | null) => {
  if (event == null) {
    return
  }

  const communityStore = useCommunityStore(event.community_account) as CommunityStore
  const communityTwitterAccount = communityStore.community?.community_sns_twitter ?? ''
  const shop = await getShopAccount(event)

  const eventUrl = encodeURIComponent(event.url)
  if (snsType === 'twitter') {
    const startDate = dateWithDayOfWeekString(event.event_start_datetime)
    const endTime = dateOnlyTimeString(event.event_end_datetime)
    const community = event.community_name + (communityTwitterAccount ? ` @${communityTwitterAccount}` : '')

    const shopText = shop.shop_name + (shop.shop_url_twitter ? ` @${shop.shop_url_twitter}` : '')

    const baseUrl = 'https://twitter.com/intent/tweet'
    const text = encodeURIComponent(
      `🌟${event.event_name}\n📅${startDate}~${endTime}\n👥${community}\n🍱${shopText}\n#shokujii @shokujii_jp\n\n👇申し込みはこちら👇\n`,
    )
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
    const text = `🌟${event.event_name}\n👥${event.community_name}\n📅${dateWithDayOfWeekString(event.event_start_datetime)}~${dateOnlyTimeString(event.event_end_datetime)}\n⏳${dateWithDayOfWeekString(event.event_deadline_datetime)}ﾏﾃﾞ\n📍${event.event_address}\n🍱${event.shop_name}\n#shokujii\n\n👇申し込みはコチラから👇\n${event.url}?openExternalBrowser=1`
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
