import BokudeliEvent from '@/schemes/bokudeliEvent'
import { dateWithDayOfWeekString } from '@/schemes/converter'

export const shareSnsButton = async (snsType: string, event: BokudeliEvent) => {
  const eventUrl = encodeURIComponent(event.url)
  if (snsType === 'twitter') {
    const baseUrl = 'https://twitter.com/intent/tweet'
    const text = encodeURIComponent(
      `<<ひとことコメント>>\n\n📝${event.event_name}\n📍${event.community_name}\n🗓️${dateWithDayOfWeekString(
        event.event_start_datetime,
      )}~\n👩‍🍳${event.shop_name}\n #食事でつながる #shokujii #ショクジー \n`,
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
    const text = `📝${event.event_name}\n📍${event.community_name}\n🗓️${dateWithDayOfWeekString(
      event.event_start_datetime,
    )}~\n👩‍🍳${event.shop_name}\n🍔${event.url}\n#食事でつながる #shokujii #ショクジー \n`
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert('リンクをコピーしました')
      })
      .catch((err) => {
        console.error('コピー失敗: ', err)
      })
  }
}
