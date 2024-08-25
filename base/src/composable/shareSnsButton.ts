import BokudeliEvent from '@/schemes/bokudeliEvent'
import { dateWithDayOfWeekString, dateOnlyTimeString } from '@/schemes/converter'

export const shareSnsButton = async (snsType: string, event: BokudeliEvent) => {
  const eventUrl = encodeURIComponent(event.url)
  if (snsType === 'twitter') {
    const hashTagText = event.event_sns_hash_tag ? `${event.event_sns_hash_tag},shokujii` : 'shokujii'

    const baseUrl = 'https://twitter.com/intent/tweet'
    const hashtags = encodeURIComponent(hashTagText)
    const text = encodeURIComponent(
      `${event.event_name}\n🗓️${dateWithDayOfWeekString(event.event_start_datetime)}~${dateOnlyTimeString(event.event_end_datetime)}\n📍${event.event_address}\n👩‍🍳${event.shop_name}\n🎟`,
    )
    const openUrl = `${baseUrl}?text=${text}&url=${eventUrl}&hashtags=${hashtags}`
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
    const text = `${event.event_name}\n🙋‍♀️${event.community_name}\n🗓️${dateWithDayOfWeekString(event.event_start_datetime)}~${dateOnlyTimeString(event.event_end_datetime)}\n📍${event.event_address}\n👩‍🍳${event.shop_name}\n🎟${event.url}?openExternalBrowser=1\n#食事でつながる #shokujii\n`
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
