import { ja } from 'vuetify/lib/locale/index.mjs'

export default {
  '$vuetify': ja,
  'navigation': {
    'home': 'イベント参加',
    'new_event': 'イベント開催',
    'community': 'コミュニティ',
    'about': 'shokujiiって？',
    'magagine': 'マガジン',
    'x': '#最新情報',
  },
  'top': {
    'popular_events': '人気のイベント',
    'upcoming_events': '参加受付中のイベント',
    'past_events': '終了したイベント',
  },
  'user': {
    'order_list': '参加イベント',
    'member_community_list': '参加コミュニティ',
    'manager_community_list': '運営コミュニティ',
    'event_create': 'イベント新規作成',
    'community_settings': 'コミュニティ設定',
    'community_create': 'コミュニティを作る',
    'canceled': 'キャンセルしました',
    'cancel_failed': 'キャンセルに失敗しました',
  },
  'manage': {
    'new_community': 'コミュニティ作成',
    'new_event': 'イベント作成',
    'new_letter': 'レター作成',
    'community': {
      'tabs': {
        'events': 'イベント',
        'member': 'メンバー',
        'letter': 'レター',
        'settings': '設定',
      }
    },
    'letter': {
      'type_select_dialog': {
        'top': 'メッセージの種類を選択してください',
        'event': 'イベントに関するメッセージ',
        'event_description': 'イベント開催を案内したい時や、イベント参加予定者にメッセージを送りたい時など、イベントに関するメッセージを送信する時に選択してください。',
        'community': 'コミュニティに関するメッセージ',
        'community_description': '特定のイベントに関連しないメッセージを送信する時に選択してください。',
        'type': {
          'normal': '通常',
          'important': '重要',
          'warning': '警告',
        },
      },
      'event_dialog': {
        'top': 'メッセージに関連するイベントを選択してください',
      }
    }
  }
}
