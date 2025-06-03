export default {
  ok: 'OK',
  cancel: 'キャンセル',
  close: '閉じる',
  day_of_week: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  day_of_week_short: ['日', '月', '火', '水', '木', '金', '土'],
  address: '住所',
  postal_code: '郵便番号',
  phone_number: '電話番号',
  invoice_number: '適格請求書登録番号',
  email: 'メールアドレス',
  email_subject: '件名',
  email_message: 'メッセージ',
  latitude: '緯度',
  longitude: '経度',
  copied_to_clipboard: 'クリップボードにコピーしました',
  back_to_top: 'トップページに戻る',
  payment: {
    user_advance: '参加者 事前決済 💳',
    user_on_day: '参加者 当日払い 💰',
    community_bill: '主催者 請求書払い 📄',
  },
  event_status: {
    in_draft: '下書き',
    applying_reservation: '予約申請中',
    applying_to_admin: '申請中',
    accepting_order: '参加受付中',
    order_closed: '参加締切済',
    finished: 'イベント終了',
    full: '満席',
  },
  private_event: 'URL限定公開',
  order_deadline: '注文期限',
  shop_range_min_orders: '注文の目安',
  shop_range_min_orders_unit: '個以上',
  days_before: '当日 | 前日 | {n}日前',
  menu_disabled_reason: {
    finished: 'イベントが終了したため、カートに追加できません',
    order_closed: '注文期限をすぎました。カートに追加できません',
    not_accepting_order: '注文受付開始前はカートに追加できません',
    limit_people: '定員に達しました。カートに追加できません',
    sold_out: '売り切れました。カートに追加できません',
  },
  event_card: {
    community_name: '【主催】{0}',
    date: '【日時】{0}〜{1}',
    place: '【場所】{0}',
    shop: '【食事】{0}',
    participants: '【参加】{0}人 / {1}人',
  },
  event_details: {
    overview: '概要',
    date: '📅 開催日時',
    place: '📍 開催場所',
    shop: '👩‍🍳 食事の提供',
    payment: '💰 支払い方法',
    deadline: '⏳ 注文期限',
    cancel: '🔙 キャンセル',
    cancel_until_deadline: '注文期限までキャンセル可',
    sns_hash_tag: '#️⃣ ハッシュタグ',
    event_details: '開催内容',
    participants: '参加者',
    participants_profile: '参加者プロフィール',
    participants_profile_hidden: '※参加者プロフィールは非表示です',
    order_count: '（{0}個）',
    community_name: '【主催者】',
    contact_community: '主催者に連絡',
    contact_community_after_login: 'ログインした後に主催者に連絡してください。',
  },
  cart: {
    community_name: '【主催者】',
    event_name: '【イベント名】',
    date: '【開催日時】',
    place: '【開催場所】',
    shop: '【食事の提供】',
    payment: '【支払い方法】',
    deadline: '【注文期限】',
    cancel: '【キャンセル】',
    cancel_until_deadline: '注文期限までキャンセル可',
    menu: 'メニュー',
    count: '個数',
    price: '金額',
    subtotal: '小計',
    total: '合計',
    cannot_order_deadline: '注文期限をすぎました。注文確定できません。',
    cannot_order_limit_people: '定員に達しました。注文確定できません。',
    order_completed: '注文を完了しました。',
    payment_failed: '決算処理に失敗しました。管理者にお問い合わせください。',
    confirm_order_credit_card: 'クレジットカードの事前決済に進みますか？',
    confirm_order_participant_on_day: '支払い方法は「参加者による当日払い」です。注文を確定しますか？',
    confirm_order_community_bill: '支払い方法は「主催者 請求書払い」です。注文を確定しますか？',
    confirm_order: '注文を確定しますか？',
    remove_from_cart: 'カートから削除しますか？',
    removed_from_cart: 'カートから削除しました。',
    event_not_found: 'イベントが見つかりません。',
    order_and_attend_event: '注文してイベントに参加する',
    no_items_in_cart: 'カートに商品はありません。',
  },
  cart_dialog: {
    add: 'カートに追加',
    close: '閉じる',
    login: 'ログインして注文する',
  },
  event_create_modal: {
    title: 'イベントの進め方',
    desc: `・<b>「郵便番号」</b>と<b>「開催日時」</b>を入力して、デリバリー可能な飲食店から1つ選択📍<br />
          ・イベント内容を入力。カバー画像の作成には <a href="https://www.canva.com/design/DAF9HoKfhMw/YpkjpVdWZEWVJZ-MjEL85Q/edit" target="_blank">Canvaのテンプレート</a>をご活用ください🎨<br />
          ・誰でも参加可能な<b>「公開」</b> or 参加者を限定する<b>「URL限定公開」</b>から選択できます👀<br />
          ・支払い方法は<b>「参加者 事前決済」</b>or <b>「主催者 請求書払い」</b>から選択できます💰<br />
          ・イベント内容が確定したら、お店に<b>「予約申請」</b>しましょう📩<br />
          ・お店から<b>「予約承認」</b>されたら注文受付開始！まずは運営メンバーで注文しよう💨<br />
          ・<b>「2人以上」</b>が注文すると、<a href="https://shokujii.jp/" target="_blank">トップページ</a> に表示されます🎉<br />
          ・<a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit?slide=id.g2b9c62499c1_0_4#slide=id.g2b9c62499c1_0_4" target="_blank">SNS投稿</a> / <a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit?slide=id.g32d785a9a51_8_27#slide=id.g32d785a9a51_8_27" target="_blank">DM</a> / <a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit?slide=id.g2bc647906f7_0_0#slide=id.g2bc647906f7_0_0" target="_blank">QRコード</a> / <a href="https://docs.google.com/presentation/d/1i57dsnNhCi1G97RwSpJZQc1r7Gs7HilxMyQ9aWfxRqw/edit?slide=id.g2e7a4494cae_0_0#slide=id.g2e7a4494cae_0_0" target="_blank">Slack連携</a> / <a href="https://docs.google.com/presentation/d/1Hxnh5nJBwXM2MS7vmllYTcfc6k4s8XtxS0AvM6plbF0/edit?slide=id.g2e7a4494cae_0_0#slide=id.g2e7a4494cae_0_0" target="_blank">チラシ生成機能</a>などを駆使して告知・集客しましょう📣<br />
          ・注文期限になると注文内容が確定し、お店に<b>「自動で発注」</b>されます📩<br />
          ・注文期限までは、注文した参加者はマイページから<b>「キャンセル」</b>が可能です↩️<br />
          ・<b>「注文の目安」</b> の個数を下回ると、配送料をご請求する場合がありますのでご注意ください🚚<br />
          ・当日フードを受け取って、食事会をお楽しみください😋😋😋<br />
          <br />
          　詳しくは <a href="https://bit.ly/3S3L8Sv" target="_blank">コミュニティガイド</a> や <a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit?slide=id.g2b9c62499c1_0_0#slide=id.g2b9c62499c1_0_0" target="_blank">告知・集客のコツ</a> もご一読ください。<br />
          　ご不明点やご要望がありましたら、サポートまで
          <a href="https://forms.gle/z9L88Dq7vDKwbvxMA" target="_blank">お問い合わせ</a> ください。<br />
          `,
  },
  community_new_modal: {
    community: {
      title: 'コミュニティを立ち上げよう🌱',
      desc: `<b>📝 まずはコミュニティを作成</b><br />
            コミュニティを作成すると、食事会のイベントを作成できるようになります。<br />
            <br />
            <b>👩‍🍳 デリバリーでも、イートインでも</b><br />
            食事はお店からデリバリーで配送いただけるのでどんな場所でも開催可能。<br />
            もしくはイートインでお店の中でも実施いただけます。<br />
            <br />
            <b>📢 多様な告知・集客機能も</b><br />
            SNS投稿、QRコード、SlackApp、チラシなどを使って食事会への告知・集客もお気軽に！<br />
            <br />
            <b>🏢 社内交流などのクローズドな食事会にも</b><br />
            「URL限定公開」や「主催者 請求書払い」を設定することで、クローズドなお食事会も。<br />
            食事代を会社負担で実施する「社内交流会」にもご活用いただけます。<br />
            <br />
            <b>🙋‍♀️ チームで協力体制も</b><br />
            複数人のメンバーをコミュニティ管理者として追加することができます。<br />
            <br />
            <b>💸 全ての機能を無料で</b><br />
            主催者のみなさまは、あらゆる機能を無料でご利用いただくことができます。<br />
            <br />
            <b>👀 詳しくはガイドを</b><br />
            <a href="https://bit.ly/3S3L8Sv" target="_blank">コミュニティガイド</a> もぜひご一読ください。<br />
            ご不明点やご要望がありましたら、サポートまでお気軽に<a href="https://forms.gle/z9L88Dq7vDKwbvxMA" target="_blank">お問い合わせ</a>を！<br />
            `,
    },
  },
  community_create_modal: {
    community: {
      title: 'コミュニティの作成について',
      desc: `・「コミュニティURL」「コミュニティ名」「説明文」「画像」など入力してください。<br />
            ・「運営者情報」「利用目的」などについては、コミュニティページなどで公開はされません。<br />
            ・新規作成後、shokujiiサポートにて内容を確認させていただきます。<br />
            ・コミュニティ作成後、イベントを作成することができるようになります。<br />
            `,
    },
    prohibited: {
      title: '禁止事項について',
      desc: `・マルチ商法、ネットワークビジネス、宗教活動等の勧誘など、過度な営業行為は禁止です。<br />
            ・報告を受け次第、アカウント停止とさせていただきます。<br />
            ・また、反社会的勢力等であるか、反社会的勢力等との何らかの交流若しくは関与を行っていると当社が判断した場合もアカウント停止とさせていただきます。<br />
            ・健全なコミュニティ運営を目指し、ご理解とご協力をお願いいたします。<br />
            <br />
            ・詳しくは <a href="https://bit.ly/3S3L8Sv" target="_blank">コミュニティガイド</a> および
            <a href="https://nijuni.notion.site/shokujii-38ef325b1c5f446880bbe35bc4bbf41c" target="_blank">利用規約</a>
            をご確認ください。<br />
            ・ご不明点ありましたらサポートまで
            <a href="https://forms.gle/z9L88Dq7vDKwbvxMA" target="_blank">お問い合わせ</a> ください。<br />`,
    },
  },
  community_create_confirm: {
    title: 'コミュニティを作成しますか？',
    desc: `・コミュニティ作成後、イベントを作成できるようになります。<br />
            ・shokujiiサポートにて入力内容を確認し、利用規約に違反していた場合、アカウントを停止させていただきます。<br />
            ・詳しくは <a href="https://bit.ly/3S3L8Sv" target="_blank">コミュニティガイド</a> および
            <a href="https://nijuni.notion.site/shokujii-38ef325b1c5f446880bbe35bc4bbf41c" target="_blank">利用規約</a>
            をご確認ください。<br />
            ・ご不明点ありましたらサポートまで
            <a href="https://forms.gle/z9L88Dq7vDKwbvxMA" target="_blank">お問い合わせ</a> ください。<br />
            `,
    ok_text: 'コミュニティを新規作成する',
  },
  community_bio_panel: {
    contact: 'お問い合わせ',
    manager: 'Manager',
    member: 'Member',
  },
  community_edit: {
    title: 'コミュニティ設定',
    create: 'コミュニティ作成',
    account: 'コミュニティURL',
    account_readonly: 'コミュニティURL（変更不可）',
    community_name: 'コミュニティ名',
    community_name_hint: 'コミュニティ名を入力してください。イベントページの主催者として表示されます。',
    community_desc: 'コミュニティ説明',
    community_desc_hint: 'コミュニティの簡単な説明を入力してください',
    image_setting: '画像設定',
    community_cover_image: 'カバー画像',
    community_cover_image_hint: `※推奨サイズ：1200x630px`,
    community_icon_image: 'アイコン',
    community_icon_image_hint: `※推奨サイズ：300x300px`,
    community_create_next: `コミュニティを作成したら<br>次はイベントをつくってみよう🎉`,
    email_setting: 'メール設定',
    email_hint: '「問い合わせ先」や「配信するレターの返信先」として、コミュニティのメールアドレスを設定してください。',
    sns_setting: 'SNS設定',
    facebook: 'Facebook',
    twitter: 'X(Twitter)',
    instagram: 'Instagram',
    officialsite: '公式サイト',
    hash_tag: 'ハッシュタグ',
    public_setting: '公開設定',
    public: '公開コミュニティ',
    private: '限定公開コミュニティ',
    public_desc:
      '公開コミュニティは <a href="https://shokujii.jp/communitylist" target="_blank">コミュニティ一覧</a>に表示され、オープンにコミュニティを運営できます。',
    private_desc:
      '限定公開コミュニティは <a href="https://shokujii.jp/communitylist" target="_blank">コミュニティ一覧</a>に表示されず、クローズドにコミュニティを運営できます。',
    manager_info: '運営者情報',
    manager_info_hint: '※運営者情報は、コミュニティページに表示されません',
    manager_name: '運営者氏名',
    company_name: '会社名・団体名',
    use_purpose: '利用目的',
    validator_account_exists: 'このアカウントIDは既に使用されています',
    bill_info: '請求先情報',
    bill_info_hint: `「主催者 請求書払い」を利用される場合、請求先を設定してください。<br />
      「主催者 請求書払い」を設定した場合、参加者はクレジットカードによる事前決済を行わずにご注文でき、<br>
      弊社より主催者様に請求書を発行いたします。請求書のお支払い期限は翌月末日となっております。`,
    bill_fullname: '請求先 担当者名',
    bill_email: '請求先 メールアドレス',
  },
  event_edit: {
    back: '前へ',
    next: '次へ',
  },
  event_basic_info: {
    place: '開催場所',
    place_name: '会場名',
    place_url: '会場URL',
    place_hint: '※店舗への予約申請後「郵便番号」「住所」の変更はできませんのでご注意ください。',
    date: '開催日時',
    start_date: '開始日',
    end_date: '終了日',
    hour: '時',
    minute: '分',
    date_hint: '※店舗への予約申請後「開催日時」は変更はできませんのでご注意ください。',
  },
  event_shop: {
    event_postalcode_desc: ' で注文できるお店',
    shop_range_min_orders: '注文の目安',
    shop_range_min_orders_unit: '個以上',
    button_selected: '選択中',
    button_check_menu: 'メニューをみる',
    shop_not_found: 'お店が見つかりませんでした',
    back: '前へ',
    next: '次へ',
  },
  event_detail: {
    title: 'イベント詳細',
    event_name: 'イベントタイトル',
    event_cover_url: 'イベントカバー画像',
    event_cover_url_hint: '※カバー画像の推奨サイズは、1200 x 630ピクセル です。',
    event_cover_template:
      '※カバー画像作成は <a href="https://www.canva.com/design/DAF9HoKfhMw/YpkjpVdWZEWVJZ-MjEL85Q/edit" target="_blank">Canvaのテンプレート</a> もご活用ください🎨',
    event_desc: '開催内容',
    event_desc_hint:
      '※「イベントの概要」「タイムスケジュール」「参加対象」「主催者情報」「緊急連絡先」「入館方法」「飲み物の有無/ご持参」「事前アンケートのURL」などについて適宜ご記載ください。',
    deadline_date: '注文期限',
    deadline_hour: '時間',
    deadline_minute: '分',
    event_max_people: '定員数',
    event_max_people_hint: '※イベント参加できる最大の定員数を設定してください。',
    event_sns_hash_tag: 'ハッシュタグ',
    event_sns_hash_tag_hint: '※SNS投稿時のハッシュタグを設定してください。',
    activity: '公開設定',
    public: '公開イベント',
    private: '限定公開イベント',
    public_desc: '「公開イベント」はTOPページに一覧表示されます。',
    private_desc: '「限定公開イベント」はTOPページに一覧表示されず、URLを知る人だけが参加できます。',
    payment: '支払い設定',
    payment_hint_user_advance: `支払い設定は<b>「参加者 事前決済」</b>と<b>「主催者 請求書払い」</b>から選択いただけます。<br />
      <b>「参加者 事前決済」</b>を設定した場合、参加者はクレジットカード決済にて事前にお支払いいただきます。<br />
      支払い設定は予約申請後、変更できません。`,
    payment_hint_community_bill: `<b>「主催者 請求書払い」</b>を設定した場合、<br />
    ・参加者はクレジットカードによる事前決済せずにご注文いただけます。<br />
    ・イベント終了後、主催者様宛に請求書を発行いたしますので、銀行振込にてお支払いください。<br />
    ・お支払い期限は翌月末日です。<br />
    ・支払い設定は予約申請後、変更できません。`,
    error_max_people: 'すでに{0}人の予約が入っています',
  },
  shop_notice: {
    info_title: '店舗情報',
    shop_name: '店舗名',
    shop_address: '店舗住所',
    shop_phone: '店舗電話番号',
    date_title: '開催日時・受取日時・注文期限',
    event_date: '開催日時',
    event_date_hint: '※開催日時の変更は「開催概要」画面で設定してください。',
    deadline_date: '注文期限',
    deadline_date_hint: '※注文期限まで、イベント参加者は個別に「注文」と「キャンセル」を行うことができます。',
    pick_up_time: '商品の受取日時',
    pick_up_time_hint: '※商品は「イベント開始時刻30分前 〜 イベント開始時刻」の間でお受け取りください。',
    notice_title: '店舗への連絡事項',
    organizer_name: '担当者 氏名',
    organizer_company: '会社名/団体名',
    organizer_email: 'メールアドレス',
    organizer_phone_personal: '電話番号（担当者）',
    organizer_phone_company: '電話番号（会社/団体）',
    organizer_phone_hint: '※商品受取時に対応できる電話番号をご記載ください。',
    organizer_memo: '配達受取場所について',
    organizer_memo_placeholder:
      'XXXXビルに付きましたら、搬入口からOOFまでお上がりください。到着したらお電話ください。よろしくお願いします。',
    bill_title: '請求先情報',
    bill_fullname: '請求先 担当者名',
    bill_email: '請求先 メールアドレス',
    preview_draft: '下書きをプレビューする',
    save_event: 'イベントを保存する',
    send_reserve_mail: 'お店に予約申請する',
    send_reserve_mail_ok: '予約申請メールを送信する',
    confirm_send_reserve_mail: '<b>「{0}」</b>に予約申請メールを送信しますか？📩<br />',
    confirm_send_reserve_mail_desc: `・お店から<b>「予約承認」</b>されると、注文や告知ができるようになります。<br />
    ・予約申請をすると、店舗・開催場所・開催日時の変更はできません。<br />
    ・予約申請期間は<b>「最大で3日間」</b>となっておりますので、ご了承ください。<br />
    ・予約が却下された場合は、お店などを変更して再度予約申請をしてください。<br />`,
  },
  user_event_card: {
    community_name: '【主催】{0}',
    event_start_datetime: '【日時】{0} 〜',
    event_address: '【場所】{0}',
    shop_name: '【食事】{0}',
    menu: '【注文内容】',
    menu_item: '{0} <span class="text-caption">({1}個)</span>',
    total_price: '【注文金額】{0}',
    event_payment: '【支払い方法】{0}',
    cancel_order: '参加注文をキャンセルする',
    canceled: 'キャンセル済み',
    cancel_dialog: {
      title: 'キャンセル',
      event_name: '【イベント名】 {0}',
      description_user_advance: `注文及びイベント参加をキャンセルしますか？<br />
                      キャンセルはイベントの注文期限まで可能です。<br />
                      キャンセル手続き完了後、返金がご利用の明細に反映されるまで5～10日かかります。<br />
                      キャンセルの取り消しはできません。あらかじめご了承ください。`,
      description_community_bill: `注文及びイベント参加をキャンセルしますか？<br />
                      キャンセルは、イベントの注文期限まで実行可能です。`,
      not_cancel: 'キャンセルしない',
      submit: 'キャンセルを実行する',
    },
    download_invoice: '領収書をダウンロードする',
  },
  validator: {
    required: '*必須',
    url: 'URLの形式が正しくありません',
    between: '{0} から {1} の間の値を入力してください',
    max_length: '{0}文字以下で入力してください',
    postal_code: '郵便番号は7桁の数字で入力してください',
    positive_integer: '正の整数を入力してください',
    phone: '有効な電話番号を入力してください',
    email: '有効なメールアドレスを入力してください',
    account:
      '3文字以上20文字以内のコミュニティURLを入力してください。コミュニティURLに使えるのは「英小文字・数字・アンダースコア」のみです。コミュニティURLは変更できませんのでご注意ください。',
    invoice_japan: '適格請求書登録番号は「T+数字13桁」で入力してください',
  },
  invoice_error_card: {
    title: 'エラーが発生しました',
    description: 'お手数ですが、サポートにお問い合わせください。',
  },
  subdomain_tags: {
    // Domain 名には _ が使えないので注意
    'kanda-curry': '神田カレーグランプリ',
  },
  hint_dialog: {
    deadline: `注文期限まで参加者は個別に「注文」と「キャンセル」を行うことができます。<br />
                    注文期限を過ぎると注文内容が確定し、参加者は「注文」および「キャンセル」を行うことができなくなります。`,
    min_orders:
      'イベントの注文個数が「注文の目安」に達しない場合、イベント主催者に配送料をご請求させていただく場合がございます。あらかじめご了承ください。',
  },
  event_draft_notice_modal: {
    title: `お店に予約申請しよう📩`,
    desc: `・現在<b>「下書き」</b>中のため、ご注文いただくことができません<br />
           ・イベント内容について問題なければ、お店に<b>「予約申請」</b>してください📩<br />
           ・お店から<b>「予約承認」</b>されると、注文や告知ができるようになります👍<br />
           ・予約申請をすると、店舗・開催場所・開催日時の変更はできないのでご注意ください⚠️<br />
           ・予約申請期間は、<b>「最大で3日間」</b>となっております。<br />
           ・予約申請が却下された場合は、お店などを変更して再度予約申請をしてください。<br />`,
  },
  event_applying_notice_modal: {
    title: `お店からの予約承認をお待ちください🙇‍♂️`,
    desc: `・現在<b>「予約申請中」</b>のため、ご注文いただくことができません。<br />
           ・お店からの<b>「予約承認」</b>をお待ちください。<br />
           ・予約申請期間は、<b>「最大で3日間」</b>となっております。<br />
           ・予約申請が却下された場合は、お店などを変更して再度予約申請をしてください。<br />`,
  },
  event_few_members_notice_modal: {
    title: `イベントを盛り上げよう🎉`,
    desc: `お店から予約承認をいただきました。<br />
           以下手順で友人知人を食事会に招待して盛り上げていきましょう！<br />
           <br />
           ① まずは、<b>「主催者」</b>や<b>「運営メンバー」</b>で早速注文💨💨<br />
           ②<b>「2人以上」</b>が注文すると、<a href="https://shokujii.jp/" target="_blank">トップページ</a> に表示されます🎉<br />          
          　・参加者がいない段階においても、不用意に目立つことなく、安心して告知いただけます。<br />
          　・2人未満の場合も、コミュニティページからは閲覧可能です。<br />
          　・まずは参加意欲の高い、コミュニティのコアメンバーからお誘いしてみましょう。<br />
           ③さらに <a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit?slide=id.g2b9c62499c1_0_4#slide=id.g2b9c62499c1_0_4" target="_blank">SNS投稿</a> / <a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit?slide=id.g32d785a9a51_8_27#slide=id.g32d785a9a51_8_27" target="_blank">DM</a> / <a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit?slide=id.g2bc647906f7_0_0#slide=id.g2bc647906f7_0_0" target="_blank">QRコード</a> / <a href="https://docs.google.com/presentation/d/1i57dsnNhCi1G97RwSpJZQc1r7Gs7HilxMyQ9aWfxRqw/edit?slide=id.g2e7a4494cae_0_0#slide=id.g2e7a4494cae_0_0" target="_blank">Slack連携</a> / <a href="https://docs.google.com/presentation/d/1Hxnh5nJBwXM2MS7vmllYTcfc6k4s8XtxS0AvM6plbF0/edit?slide=id.g2e7a4494cae_0_0#slide=id.g2e7a4494cae_0_0" target="_blank">チラシ生成機能</a>を駆使して告知・集客しよう📢<br />
          

           <br />
           詳しくは <a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit#slide=id.g2b9c62499c1_0_0" target="_blank">コミュニティガイド「告知・集客のコツ」</a> も参考にしてください👍`,
  },
  cancelpolicy_modal: {
    title: 'キャンセルポリシー',
    desc: `注文期限まで：キャンセル料金 0%<br />
    注文期限以降：キャンセル料金 100%<br />
    <br />
    注文期限内であれば <a href="https://shokujii.jp/mypage" target="_blank">マイページ</a> にてご自身でキャンセルを行うことができます。注文期限後、キャンセルはできませんのでご了承ください。`,
  },
  letter_status: {
    draft: '下書き',
    timed: '配信予約中',
    sent: '配信済',
  },
  letter_type: {
    community: 'コミュニティメンバー',
    event_participant: 'イベント参加者',
    event_non_participant: 'イベント未参加者',
  },
  letter_card: {
    updated_at: '【更新日時】 {0}',
    sent_at: '【配信日時】 {0}',
    scheduled_at: '【配信予定日時】 {0}',
    type: '【配信先】 {0}（{1}人）',
    event_name: '【イベント名】 {0}',
    copy: 'コピー',
    delete: '削除',
    edit: '編集',
    dialog: {
      title: 'レター削除',
      description: '本当に削除しますか？この操作は取り消せません。',
      submit: '削除',
    },
  },
  letter_table: {
    content: '配信内容',
    type: '配信先',
    num_targets: '配信数',
    event_name: 'イベント名',
    scheduled_at: '配信日時',
    updated_at: '更新日時',
    status: 'ステータス',
    edit: '編集',
    delete: '削除',
    copy: '複製',
    no_letters: 'レターはまだありません',
  },
  email_dialog: {
    title: 'メール送信',
    send_to: '送信先: {0}',
    send: '送信',
  },
  error: {
    '404': {
      title: '404 Not Found',
      description: `お探しのページは見つかりませんでした。<br />
                    ページが削除されたか、入力したURLが間違っている可能性があります。`,
    },
    // 正確には 520 は HTTP ERROR ではないが、Cloudflare が Client Application Error として使用しているのを参考に、ここでは 520 を使用
    '520': {
      title: 'Client Application Error',
      description: '予期しないエラーが発生しました',
    },
  },
}
