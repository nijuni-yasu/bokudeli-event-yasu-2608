export default {
  'ok': 'OK',
  'cancel': 'Cancel',
  'day_of_week': [
    '日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'
  ],
  'day_of_week_short': [
    '日', '月', '火', '水', '木', '金', '土'
  ],
  'address': '住所',
  'postal_code': '郵便番号',
  'phone_number': '電話番号',
  'email': 'メールアドレス',
  'latitude': '緯度',
  'longitude': '経度',
  'payment': {
    'user_advance': '参加者 事前決済 💳',
    'user_on_day': '参加者 当日払い 💸',
    'community_bill': '主催者支払い 💰'
  },
  'event_status': {
    'in_draft': '下書き',
    'applying_reservation': '予約申請中',
    'accepting_order': '参加受付中',
    'order_closed': '参加締切済',
    'finished': 'イベント終了',
    'full': '満席',
  },
  'order_deadline': '注文期限',
  'days_before': '当日 | 前日 | {n}日前',
  'menu_disabled_reason': {
    'finished': 'イベントが終了したため、カートに追加できません',
    'order_closed': '注文期限をすぎました。カートに追加できません',
    'not_accepting_order': '注文受付開始前はカートに追加できません',
    'limit_people': '定員に達しました。カートに追加できません',
    'sold_out': '売り切れました。カートに追加できません'
  },
  'event_card': {
    'community_name': '【主催】{0}',
    'date': '【日時】{0}〜{1}',
    'place': '【場所】{0}',
    'shop': '【お店】{0}',
    'participants': '【参加】{0}人 / {1}人',
  },
  'event_basic_info': {
    'place': '開催場所',
    'place_name': '会場名',
    'place_url': '会場URL',
    'date': '開催日時',
    'start_date': '開始日',
    'end_date': '終了日',
    'hour': '時',
    'minute': '分',
  },
  'event_detail': {
    'title': 'イベント詳細',
    'event_name': 'イベントタイトル',
    'event_cover_url': 'イベント画像 1200px X 630px',
    'event_desc': 'イベント詳細',
    'deadline_date': '注文締切日時',
    'deadline_hour': '時間',
    'deadline_minute': '分',
    'event_max_people': '定員数',
    'activity': '公開設定',
    'public': '公開イベント',
    'private': '限定公開イベント',
    'public_desc': '※「公開イベント」はTOPページに一覧表示されます。',
    'private_desc': '※「限定公開イベント」はTOPページに一覧表示されず、URLを知る人だけが参加できます。',
    'payment': '支払い設定',
  },
  'validator': {
    'required': '必須項目です',
    'url': 'URLの形式が正しくありません',
    'between': '{0} から {1} の間の値を入力してください',
    'max_length': '{0}文字以下で入力してください',
    'postal_code': '郵便番号は7桁の数字で入力してください',
    'positive_integer': '正の整数を入力してください',
    'phone': '有効な電話番号を入力してください',
    'email': '有効なメールアドレスを入力してください',
    'account': 'アカウントは5文字以上15文字以内にしてください。アカウントに使えるのは「英小文字・数字・アンダースコア」のみです。'
  }
}
