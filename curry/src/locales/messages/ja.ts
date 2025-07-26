import { ja } from 'vuetify/lib/locale/index.mjs'

export default {
  $vuetify: ja,
  navigation: {
    home: 'イベント参加',
    community: 'コミュニティ',
    about: 'shokujiiって？',
    curry: '神田カレーグランプリ',
  },
  menu_disabled_reason: {
    finished: 'イベントが終了したため、カートに追加できません',
    order_closed: '注文期限をすぎました。カートに追加できません',
    not_accepting_order: '注文受付開始前はカートに追加できません',
    limit_people: '定員に達しました。カートに追加できません',
    sold_out: '売り切れました。カートに追加できません',
  },
  user: {
    order_list: '参加イベント',
    member_community_list: '参加コミュニティ',
    canceled: 'キャンセルしました',
    cancel_failed: 'キャンセルに失敗しました',
  },
}
