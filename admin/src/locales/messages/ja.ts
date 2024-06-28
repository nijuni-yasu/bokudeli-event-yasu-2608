import { ja } from 'vuetify/lib/locale/index.mjs'

export default {
  '$vuetify': ja,
  'login': {
    'title': 'shokujii 店舗管理画面',
    'email_label': 'Email',
    'password_label': 'Password',
    'submit': 'ログイン',
    'forgot_password': 'パスワードを忘れましたか？',
    'error_could_not_login': 'ログインできませんでした',
    'error_could_not_send_email': 'メールを送信できませんでした',
    'message_email_sent': 'パスワード再設定用のメールを送信しました'
  },
  'logout': 'ログアウト',
  'navigation': {
    'home': 'HOME',
    'shop': '店舗設定',
    'menu': 'メニュー設定',
    'order': '注文一覧',
    'manual': '店舗マニュアル'
  },
  'forgot_password_dialog': {
    'title': 'パスワードの再設定',
    'message': 'パスワード再設定用のメールを送信します。登録されているメールアドレスを入力してください。',
  },
  'home': {
    'title1': 'shokujiiについて',
    'message1': `<p>「コミュニティフードデリバリーぼくデリ」は<b>「食事でつながるshokujii」</b>に生まれ変わりました。<br />
                「孤食を減らし、団欒を増やす」をミッションに掲げ、人と人を食事でつないでいくサービスづくりに、邁進してまいります。<br />
                 変わらぬご愛顧をいただきますようお願いいたします。</p>
                 <p><a href="https://shokujii.jp" target="_blank">shokujii公式サイト</a><br />
                 <a href="https://about.shokujii.jp" target="_blank">shokujiiって？</a></p>`,
    'title2': '店舗公開 TODOリスト',
    'todo_list': [
      ['STEP0', '<a href="https://bit.ly/4bFRS0E" target="_blank">店舗マニュアル</a> を一読し「設定方法」や「注文受付」「配送」の流れをチェック👀✅'],
      ['STEP1', '<a href="/shop">店舗設定画面</a> で「店舗情報」「最小注文個数」「配送距離」「営業曜日・時間」「お届け時間」「メールアドレス」などを入力して、店舗設定をしてください✍'],
      ['STEP2', '<a href="/menu">メニュー設定画面</a> で「メニュー名称」「メニュー説明文」「メニュー価格」「メニュー画像」を入力して追加🍔🍛🍜'],
      ['STEP3', `店舗設定 と メニュー設定 が完了したら「開店設定」で「開店」に設定してください。<br />
                「開店設定」にしていただくと、サポートチームにメールにて通知が入ります。<br />
                内容確認後、公開完了！お客さまからのご注文をお待ちください。`],
      ['', `ご不明点などありましたらメールにてお気軽にご連絡ください👍<br />
           （メールアドレス : support@nijuni.jp ）`]
    ]
  },
  'shop': {
    'submit': '保存する',
    'saved': '保存しました',
    'save_error': '保存できませんでした',
    'info': '店舗情報',
    'name': '店舗名',
    'genre': 'カテゴリ',
    'description': '店舗紹介文',
    'url': '店舗情報URL',
    'url_hint': '店舗公式HPまたは食べログなどのURLを入力してください',
    'url_twitter': 'X(Twitter) URL',
    'url_twitter_hint': 'X(旧Twitter)アカウントを入力してください',
    'url_facebook': 'Facebook URL',
    'url_facebook_hint': 'Facebookページのアカウントを入力してください',
    'url_instagram': 'Instagram URL',
    'url_instagram_hint': 'Instagramアカウントを入力してください',
    'image': '店舗画像',
    'image_hint': '※画像サイズは600x450推奨です',
    'base_point': '配送中心地',
    'base_point_hint': '※配送中心地は、店舗の郵便番号<span class="text-h3">{0}</span>をもとに自動算出しています',
    'range_min_orders': '配送距離＆注文最小個数',
    'range': '配送距離(半径km)',
    'min_orders': '注文最小個数',
    'range_min_orders_hint': `※「配送距離」と「注文最小個数」は複数設定することができます。<br />
                              ※【設定1】5km 5個 【設定2】10km 7個 【設定3】15km 10個のように小さい値から設定してください。`,
    'time': '営業曜日・配送時間',
    'time_start': '開始時刻（第{0}部）',
    'time_end': '終了時刻（第{0}部）',
    'deadline_datetime': '注文締切日時',
    'deadline_date': '締切日',
    'deadline_time': '締切時刻',
    'deadline_hint': '※注文の締切日時を設定できます',
    'email_sub': 'サブメールアドレス',
    'email_sub_n': 'サブメールアドレス{0}',
    'email_sub_hint': `※サブメールアドレスを設定すると注文メールが配信されるようになります。<br />
                       ※サブメールアドレスの入力ミスには十分ご注意ください。`,
    'is_open': '開店設定',
    'label_open': '開店(OPEN)',
    'label_close': '閉店(CLOSE)',
    'is_open_hint': `※「開店」とすると、ユーザーからの予約や注文が可能になります。<br />
                     ※「閉店」とすると、非公開となり、新規の予約は入りません。<br />
                     ※ すべての設定が完了したら「開店」として「保存」してください。<br />
                     ※ サポートチームが確認したのちに、店舗が公開されます。`
  },
  'orders': {
    'title': '注文一覧',
    'table_header': [
      'ID',
      'イベント名',
      '開始日時',
      '注文期限',
      '開催場所',
      '注文個数',
      '注文金額',
      'ステータス'
    ]
  },
  'order_detail': {
    'event_id': '【イベントID】 {0}',
    'event_name': '【イベント名】 {0}',
    'event_url': '【イベントURL】 {0}',
    'event_date': '【配送日時】 {0} 〜 {1}',
    'order_limit': '【注文期限】 {0}',
    'event_address': '【開催場所】 {0}',
    'community_name': '【コミュニティ名】 {0}',
    'organizer_fullname': '【担当者名】 {0}',
    'organizer_company': '【会社名】 {0}',
    'organizer_phone_personal': '【電話番号(個人)】 {0}',
    'organizer_phone_company': '【電話番号(会社)】 {0}',
    'organizer_email': '【メールアドレス】 {0}',
    'organizer_memo': '【配送メモ】 {0}',
    'accept_order': '予約内容を承認し、注文受付を開始する',
    'decline_order': '予約内容を却下し、予約内容の変更を依頼する',
    'accept_order_sample': '例)ご予約ありがとうございます。',
    'decline_order_sample': '例)この時間は予約がいっぱいのため、日程の変更をお願いできますでしょうか。',
    'send_email': '主催者にメールを送信する',
    'order_detail': '注文内容',
    'menu_name': 'メニュー名',
    'menu_price': '金額',
    'user_name': '名前',
    'order_date': '注文日時',
    'subtotal': 'メニュー別小計',
    'order_count': '個数',
    'unit_price': '単価',
    'subtotal_price': '小計',
    'total': '合計',
    'total_count': '合計個数',
    'total_price': '合計金額'
  }
}