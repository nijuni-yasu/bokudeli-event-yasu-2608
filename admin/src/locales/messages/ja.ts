import { ja } from 'vuetify/lib/locale/index.mjs'

export default {
  $vuetify: ja,
  login: {
    title: 'shokujii 店舗管理画面',
    email_label: 'Email',
    password_label: 'Password',
    submit: 'ログイン',
    forgot_password: 'パスワードを忘れましたか？',
    error_could_not_login: 'ログインできませんでした',
    error_could_not_send_email: 'メールを送信できませんでした',
    message_email_sent: 'パスワード再設定用のメールを送信しました',
  },
  logout: 'ログアウト',
  navigation: {
    home: 'HOME',
    shop: '店舗設定',
    menu: 'メニュー設定',
    order: '注文一覧',
    manual: '店舗マニュアル',
    community: '店舗主催設定',
    event: '店舗主催イベント',
    shokujii: 'shokujii公式サイト',
    about: 'shokujiiって？',
  },
  forgot_password_dialog: {
    title: 'パスワードの再設定',
    message: 'パスワード再設定用のメールを送信します。登録されているメールアドレスを入力してください。',
  },
  home: {
    title1: 'shokujiiについて',
    message1: `<p>コミュニティフードデリバリー「ぼくデリ」は、<b>食事でつながる「shokujii」</b>に生まれ変わりました。<br />
                <b>「孤食を減らし、団欒を増やす」</b>をミッションに掲げ、人と人を食事でつなぐサービスづくりに、邁進してまいります。<br />
                 変わらぬご愛顧をいただきますようお願いいたします。</p>
                 <p><a href="https://shokujii.jp" target="_blank">shokujii公式サイト</a><br />
                 <a href="https://about.shokujii.jp" target="_blank">shokujiiって？</a></p>`,
    title2: 'TODOリスト',
    todo_list: [
      [
        'STEP(1)',
        '<a href="https://bit.ly/4fYBbiJ" target="_blank">店舗マニュアル</a> を一読し「設定方法」や「注文受付」「配送」の流れをチェック📗',
      ],
      [
        'STEP(2)',
        '<a href="https://form.run/@shokujii-entry" target="blank">店舗掲載申し込みフォーム</a> にて「飲食店営業許可証」や「銀行口座」などを入力して送信💻',
      ],
      [
        'STEP(3)',
        '<a href="/shop">店舗設定画面</a> で「店舗情報」「注文最小個数」「配送距離」「営業曜日・時間」「注文期限」「メールアドレス」などを入力して、店舗設定をしてください💻',
      ],
      [
        'STEP(4)',
        '<a href="/menu">メニュー設定画面</a> で「メニュー名」「メニュー説明文」「メニュー価格」「メニュー画像」を入力して追加🍱',
      ],
      [
        'STEP(5)',
        `全ての設定が完了したら <a href="/shop">店舗設定画面</a> の「開店設定」にて「開店」にしてください。<br />
                サポートチームにて内容の確認ができ次第、公開完了🎉 主催者さまからのご予約をお待ちください。`,
      ],
      [
        'STEP(6)',
        `ランチ会や食事会の主催者さまから予約申請メールが届いたら <a href="/order">注文一覧画面</a> にて内容を確認。<br />
                「予約承認」もしくは「予約却下」を選択してメールを送信してください📩`,
      ],
      [
        'STEP(7)',
        `「注文期限」になりましたら、注文個数や内容が確定！<br />
                デリバリーやテイクアウトにて、お客様に商品をお届けください 🚲 🛵 🚚💨<br />
                お弁当箱への「お名前」と「メニュー名」の記載もお忘れなく🍱✍`,
      ],
      [
        'STEP(8)',
        `主催者や参加者は、WEBにてクレジットカード決済済み💳<br />
                  注文金額から決済手数料を差し引いた上で、月末締め・翌月末払いにて銀行振込いたします。<br />`,
      ],
      [
        '連絡先',
        `ご不明点などありましたらメールや電話にて、サポートチームまでお気軽にご連絡ください。<br />
           📩 メールアドレス : support@nijuni.jp<br />
           📞 電話番号 : 050-1721-5838`,
      ],
      [
        'SNS',
        `SNSも更新中！ぜひフォローしてください💬<br />
      <a href="https://x.com/shokujii_jp" target="blank">X(旧Twitter)</a>
      <a href="https://www.instagram.com/shokujii_jp/" target="blank">Instagram</a>
      <a href="https://www.facebook.com/shokujii" target="blank">Facebook</a>
      <a href="https://note.com/shokujii" target="blank">note</a>
      `,
      ],
    ],
  },
  shop: {
    submit: '保存する',
    saved: '保存しました',
    save_error: '保存できませんでした',
    info: '店舗情報',
    name: '店舗名',
    genre: 'カテゴリ',
    description: '店舗紹介文',
    url: '店舗情報URL',
    url_hint: '店舗公式HPまたは食べログなどのURLを入力してください',
    url_twitter: 'X(Twitter) URL',
    url_twitter_hint: 'X(旧Twitter)アカウントを入力してください',
    url_facebook: 'Facebook URL',
    url_facebook_hint: 'Facebookページのアカウントを入力してください',
    url_instagram: 'Instagram URL',
    url_instagram_hint: 'Instagramアカウントを入力してください',
    image: '店舗画像',
    image_hint: '※店舗画像の推奨サイズは600x315pxです。',
    base_point: '配送中心地',
    base_point_hint: '※配送中心地は、店舗の郵便番号<span class="text-h3">{0}</span>をもとに自動算出しています。',
    range_min_orders: '配送距離＆注文最小個数',
    range: '配送距離(半径km)',
    min_orders: '注文最小個数',
    range_min_orders_hint: `※ 配送距離 と 注文最小個数 は複数設定することができます。<br />
                              ※ <b>[2km以内 4個以上] [5km以内 6個以上] [10km以内 8個以上]</b> が推奨設定です。<br />
                              ※ 注文最小個数を下回る注文となった場合、1個あたり500円の配送料がお支払いされます。配送料の上限金額は5,000円です。<br />
                              ※ 配送料は主催者がお支払いするため、多すぎる個数は選ばれにくい傾向にあります。<b>気軽に食事会をはじめられる個数に設定</b>してください。<br />
                              ※ 設定について詳しくは <a href="https://docs.google.com/presentation/d/1TJF92qrL1x8b-k3sYiVtmcOJ4YZNof4l5IYmXJIMQsg/edit#slide=id.g2ffdee5a4fe_1_406" target="_blank">店舗マニュアル</a>を参照ください。<br />`,
    time: '営業曜日・配送時間',
    time_start: '開始時刻（第{0}部）',
    time_end: '終了時刻（第{0}部）',
    time_end_after_start: '開始時刻より後にしてください',
    time_start2_after_end: '第1部の終了時刻より後にしてください',
    time2_pair_required: '第2部の開始時刻と終了時刻は、両方入力するか、両方未入力にしてください',
    time_hint: `※ 営業曜日と配送時間を設定してください。<br />
                  ※ 「10:00~14:00」「17:00~22:00」のように2部に分けて設定することも可能です。<br />`,
    deadline_datetime: '注文期限',
    deadline_date: '日付',
    deadline_time: '時刻',
    deadline_hint: `※ 注文期限を設定してください。<br />
                      ※ イベント参加者は、注文期限まで「個別に注文」と「個別にキャンセル」をすることができます。<br />
                      ※ イベント参加者は、注文期限直前に注文確定する傾向にあるため、注文期限が遅い方が注文個数は増える傾向にあります。<br />
                      ※ イベント主催者は、1人でも多くの方を集客したいため、注文期限が遅いお店を選ぶ傾向にあります。<br />`,
    email_sub: 'サブメールアドレス',
    email_sub_n: 'サブメールアドレス{0}',
    email_sub_hint: `※サブメールアドレスを設定すると注文メールが配信されるようになります。<br />
                       ※サブメールアドレスの入力ミスには十分ご注意ください。`,
    is_open: '開店設定',
    label_open: '開店(OPEN)',
    label_close: '閉店(CLOSE)',
    is_open_hint: `※「開店」とすると、ユーザーからの予約や注文が可能になります。<br />
                     ※「閉店」とすると、非公開となり、新規の予約は入りません。<br />
                     ※ すべての設定が完了したら「開店」として「保存」してください。<br />
                     ※ サポートチームが確認したのちに、店舗が公開されます。`,
    invoice: '適格請求書登録事業者情報',
    has_invoice: '登録している',
    no_invoice: '登録していない',
    invoice_hint: `※ 適格請求書登録番号を設定してください。<br />
                      ※ 参加者がダウンロードする領収書に適格請求書登録番号が表示されるようになります。`,
    deadline_before_time: '開始{0}時間前',
    deadline_day_before_time: '前日{0}',
  },
  menu: {
    add: 'メニューの追加',
    edit: 'メニューの追加・編集',
    delete_confirm: 'メニューを削除しますか？',
    saved: 'メニューを保存しました',
    save_error: '保存できませんでした',
    deleted: 'メニューを削除しました',
    delete_error: '削除できませんでした',
    save_sort_order: '並び順を保存',
    sort_order_saved: '並び順を保存しました',
    sort_order_save_error: '並び順の保存に失敗しました',
    example: {
      name: '例）サラダ弁当',
      description: '手間隙かけて作りました、季節のお野菜たっぷりのサラダ弁当です。',
    },
  },
  orders: {
    title: '注文一覧',
    order_count: '{0} 個',
    event_max_people: '{0} 人',
    table_header: ['イベント名', '開始日時', '注文期限', '開催場所', '定員数', '注文個数', '注文金額', 'ステータス'],
  },
  order_detail: {
    event_id: '【イベントID】 {0}',
    event_name: '【イベント名】 {0}',
    event_url: '【イベントURL】 {0}',
    event_date: '【配送日時】 {0} 〜 {1}',
    order_limit: '【注文期限】 {0}',
    event_address: '【開催場所】 {0}',
    event_max_people: '【定員数】 {0} 人',
    community_name: '【コミュニティ名】 {0}',
    organizer_fullname: '【担当者名】 {0}',
    organizer_company: '【会社名】 {0}',
    organizer_phone_personal: '【電話番号(個人)】 {0}',
    organizer_phone_company: '【電話番号(会社)】 {0}',
    organizer_email: '【メールアドレス】 {0}',
    organizer_memo: '【配送メモ】 {0}',
    accept_or_decline: '予約を承認しますか？',
    accept_order: '予約内容を承認する',
    decline_order: '予約内容の変更を依頼する',
    send_email_message: 'お店から主催者へのメッセージ',
    accept_order_sample: 'ご予約ありがとうございます。ご指定のお時間にお届けいたしますので、よろしくお願いします。',
    decline_order_sample:
      '誠に恐れ入りますが、当日の対応が難しい状況のため、日程や内容の変更をご検討いただけますと幸いです。どうぞよろしくお願いいたします。',
    send_email: '主催者へメッセージを送信する',
    order_detail: '注文内容',
    menu_name: 'メニュー名',
    menu_price: '金額',
    user_name: '名前',
    order_date: '注文日時',
    subtotal: 'メニュー別小計',
    order_count: '個数',
    unit_price: '単価',
    subtotal_price: '小計',
    total: '合計',
    total_count: '合計個数',
    total_price: '合計金額',
    email_sent: 'メールを送信しました',
    names_sheet_print_button: '[お名前]をダウンロード',
    names_sheet_print_button_desc:
      '※[お名前]の記載について、詳細は <a href="https://docs.google.com/presentation/d/1TJF92qrL1x8b-k3sYiVtmcOJ4YZNof4l5IYmXJIMQsg/edit#slide=id.g2ffdee5a4fe_13_22" target="_blank">店舗マニュアル</a> を確認ください。',
    confirm_accept_dialog: {
      title: '予約承認',
      message:
        '予約を承認しますか？<br />承認後はキャンセルやメニュー内容の変更ができません。<br />メニューの内容を変更する場合は、予約承認前にご対応ください。',
      close: '閉じる',
      submit: '予約承認を確定する',
    },
    confirm_decline_dialog: {
      title: '予約の変更依頼',
      message: '予約内容の変更を依頼しますか？必要事項はメッセージ欄に記載してください。',
      close: '閉じる',
      submit: '予約を変更依頼する',
    },
  },
  menu_card: {
    sold_out: '売り切れ',
    in_stock: '販売中',
    limited_edition: '【販売期間】{0}〜{1}',
  },
  menu_edit_card: {
    name: 'メニュー名称',
    description: '説明文',
    price: '税込価格',
    image: 'メニュー画像',
    image_hint: '※画像サイズは600x600推奨です',
    sold_out: '売り切れ',
    in_stock: '販売中',
    limited_edition: '販売期間',
    date_start: '開始日',
    date_end: '終了日',
    close: '閉じる',
    submit: '保存する',
    error_date_range_incomplete: '開始日と終了日は両方設定するか、両方未設定にしてください。',
    error_date_range_invalid: '開始日は終了日より前の日付を設定してください。',
  },
  community: {
    submit: '設定',
    create: 'コミュニティを新規作成する',
    create_confirm_dialog: {
      title: 'コミュニティを新規作成しますか？',
      message: `<ul><li>コミュニティ作成後、イベントページ作成などの機能が利用可能となります。</li>
                      <li>詳しくは <a href="https://bit.ly/3S3L8Sv" target="_blank">コミュニティガイド</a> および <a href="https://nijuni.notion.site/shokujii-38ef325b1c5f446880bbe35bc4bbf41c" target="_blank">利用規約</a> をご確認ください。</li>
                      <li>ご不明点ありましたらサポートまで <a href="https://forms.gle/z9L88Dq7vDKwbvxMA" target="_blank">お問い合わせ</a> ください。</li></ul>`,
      submit: '申請する',
    },
    new_community_dialog: {
      title1: 'コミュニティの新規作成について',
      message1: `<ul><li>「コミュニティID」「コミュニティ名」「コミュニティ詳細」「カバー画像」「アイコン画像」など入力してください。</li>
                       <li>コミュニティの「運営者情報」「利用目的」などについては、コミュニティページには表示されません。</li>
                       <li>コミュニティ作成後、イベント作成などの機能が利用可能となります。</li></ul>`,
      title2: '禁止事項について',
      message2: `<ul><li>マルチ商法、ネットワークビジネス、宗教活動等の勧誘、過度な営業行為は禁止です。</li>
                       <li>報告を受け次第、アカウント停止とさせていただきます。</li>
                       <li>また、反社会的勢力等であるか、反社会的勢力等との何らかの交流若しくは関与を行っていると当社が判断した場合もアカウント停止とさせていただきます。</li>
                       <li>健全なコミュニティ運営を目指し、ご理解とご協力をお願いいたします。</li></ul>
                       <br />
                    <ul><li>詳しくは <a href="https://bit.ly/3S3L8Sv" target="_blank">コミュニティガイド</a> および <a href="https://nijuni.notion.site/shokujii-38ef325b1c5f446880bbe35bc4bbf41c" target="_blank">利用規約</a> をご確認ください。</li>
                        <li>ご不明点ありましたらサポートまで <a href="https://forms.gle/z9L88Dq7vDKwbvxMA" target="_blank">お問い合わせ</a> ください。</li></ul>`,
    },
    created: 'コミュニティを作成しました',
    saved: 'コミュニティ情報を更新しました',
    error: 'エラーが発生しました',
  },
  // Overwrite the default message
  community_edit: {
    title: '店舗主催設定（コミュニティ設定)',
  },
  event: {
    user_event_page: 'イベントページ',
    save_draft: '下書き保存',
    update: '更新',
    apply: '申請する',
    created: 'イベントを作成しました',
    updated: 'イベントを更新しました',
    error: 'エラーが発生しました',
    new: '店舗主催のイベントを作成する',
  },
  alert: {
    make_shop: '先に店舗情報を登録してください',
    make_community_account: '先にコミュニティを作成してください',
    invalid_account:
      '別店舗のアカウントでログインしています。正しいアカウントでログインしなおした上で、改めてご確認ください。',
  },
}
