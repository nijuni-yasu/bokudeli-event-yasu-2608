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
    'manage_event': 'イベント管理',
    'manage_community': 'コミュニティ管理',
    'guide': 'コミュニティガイド',
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
    'event': {
      'tabs': {
        'settings': '概要',
        'member': '参加者',
        'letter': 'レター',
      },
      'edit': 'イベント編集',
    },
    'member': {
      'manager': '管理者',
      'member': 'メンバー',
      'ordered': '注文済',
      'in_cart': 'カート追加中',
      'canceled': 'キャンセル',
      'name': '名前',
      'order': '注文内容',
      'order_date': '注文日時',
      'in_cart_date': 'カート追加日時',
      'multi_order': '{0} ({1}個)',
      'canceled_date': 'キャンセル日時',
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
      },
      'edit': {
        'new': 'メッセージ新規作成',
        'edit': 'メッセージ編集',
        'to': '宛先',
        'to_community': 'コミュニティメンバー全体',
        'to_event_participant': 'イベント参加者',
        'to_event_non_participant': 'イベント未登録者',
        'number_of_people': '（{0}人）',
        'deliver_datetime': '配信日時',
        'deliver_now': '今すぐ配信',
        'subject': '件名',
        'message': 'メッセージ',
        'add_event_description': 'イベント内容を追加する',
        'event_description': 'イベント内容',
        'submit_reserve': '予約',
        'submit_now': '送信',
        'save_draft': '下書き保存',
        'to_draft': '下書きに戻す',
      }
    },
    'settings': {
      'submit': '設定',
      'saved': '保存しました',
    },
    'newcommunity': {
      'submit': '作成',
      'added': '作成しました',
      'error': '作成に失敗しました',
    }
  }
}
