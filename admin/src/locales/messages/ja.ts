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
}