import { LEGAL_URLS } from '@shokujii/base/constants/legalUrls.js'

export default {
  ok: 'OK',
  cancel: 'キャンセル',
  close: '閉じる',
  day_of_week: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  day_of_week_short: ['日', '月', '火', '水', '木', '金', '土'],
  address: '住所1',
  address_hint: '郵便番号から自動入力されます',
  detail_address: '住所2',
  detail_address_hint: '例: 1-2-3 ○○○ビル 4F',
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
    community_bill_free: '主催者請求書払い',
    community_bill_discount: '主催者請求書払い＋参加者決済',
    enterprise_subsidy: '福利厚生割引 🏢',
  },
  discount_settings: {
    free: '全額おごり',
    free_description: '注文金額の全額を主催者に請求書払いにてまとめてお支払いいただきます。',
    discount: '金額指定おごり',
    discount_description:
      'おごり金額を指定して、その金額を「1個あたりの上限」として、各メニュー（品目）の単価ごとに主催者負担を算定します。個数分だけ累積されます。差額は参加者が事前決済でお支払いします。',
    off_amount: 'おごり金額',
    off_amount_required: 'おごり金額は必須です',
    off_amount_positive_integer: 'おごり金額は100円以上の値を入力してください',
    off_amount_step_100: 'おごり金額は100円単位で入力してください',
    bill_info_title: '請求先情報',
    chip_free: '💰全額おごり',
    chip_discount: '💰{0}円おごり',
    banner_free: '全額、主催者負担でご注文いただけます。追加のお支払いは不要です。',
    banner_discount:
      'メニュー1個につき{0}円まで主催者負担でご注文いただけます。差額はオンライン決済（クレジットカード・Apple Pay・Google Pay・PayPay など）でお支払いください。',
    original_price: '小計：¥{0}',
    discount_applied: 'おごり合計：¥{0}',
    free_by_organizer: '全額おごり',
  },
  event_status: {
    in_draft: '下書き',
    applying_reservation: '予約申請中',
    applying_to_admin: '申請中',
    accepting_order: '参加受付中',
    order_closed: '参加締切済',
    finished: 'イベント終了',
    full: '満席',
    event_canceled: 'キャンセル',
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
    event_canceled: 'イベントがキャンセルされたため、カートに追加できません',
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
    organizer: '👥 主催者',
    event_name: '📋 イベント名',
    date: '📅 開催日時',
    place: '📍 開催場所',
    shop: '👩‍🍳 食事の提供',
    payment: '💰 支払い方法',
    deadline: '⏳ 注文期限',
    minimum_participants: '🧑‍🧑‍🧒‍🧒 最小催行人数',
    minimum_participants_count: '{count}名',
    cancel: '🔙 キャンセル',
    cancel_until_deadline: '注文期限までキャンセル可',
    sns_hash_tag: '#️⃣ ハッシュタグ',
    event_details: '開催内容',
    participants: '参加者',
    participants_profile: '参加者プロフィール',
    open_group_chat: 'グループチャット',
    participants_profile_hidden: '※参加者プロフィールは非表示です',
    tag_toggle_login_required: 'ログインが必要です',
    tag_toggle_added: 'タグを取り入れました',
    tag_toggle_removed: 'タグを外しました',
    tag_toggle_failed: '更新に失敗しました',
    order_count: '（{0}個）',
    menu_join_button: '注文して参加する',
    menu_empty: 'メニューがありません',
    community_name: '【主催者】',
    contact_community: '主催者に連絡',
    contact_community_after_login: 'ログインした後に主催者に連絡してください。',
  },
  album: {
    show_all_photos: 'すべての写真',
    lightbox_count: '{current}/{total}枚',
    gallery_open_cover: 'カバー写真を拡大表示',
    gallery_open_album_photo: 'アルバムの写真を拡大表示',
  },
  cart: {
    title: '🛒 カート 🛒',
    subtitle: '注文を完了してイベント参加をお申し込みください',
    order_contents: '【注文内容】',
    menu: 'メニュー',
    count: '個数',
    unit_price: 'メニュー金額',
    off_amount: 'おごり金額',
    company_subsidy: '会社負担',
    order_total: '注文合計',
    company_subsidy_total: '会社負担合計',
    your_payment: 'お支払い額',
    enterprise_subsidy_month: '{0}分の福利厚生割引として適用されます',
    enterprise_subsidy_partial: '⚠ {0}分の割引上限に達するため、一部は全額自己負担となります',
    enterprise_subsidy_exceeded: '⚠ {0}分の割引上限に達しました。全額自己負担となります',
    enterprise_subsidy_zero_payment: '✓ 全額会社負担のため、決済は不要です',
    monthly_usage_label: '今月の割引利用',
    event_month_subsidy_heading: '{0}分の福利厚生',
    event_month_subsidy_remaining_limit: '残り予算 {0}円 / 月間上限 {1}円',
    confirm_order_enterprise_subsidy_checkout: '福利厚生割引適用後の差額をオンライン決済でお支払いします。続きますか？',
    confirm_order_enterprise_subsidy_zero: '全額会社負担のため、決済なしで注文を確定します。よろしいですか？',
    price: '金額',
    subtotal: '小計',
    total: '合計',
    cannot_order_deadline: '注文期限をすぎました。注文確定できません。',
    cannot_order_limit_people: '定員に達しました。注文確定できません。',
    cannot_order_unselected_menu:
      '現在注文できないメニューが含まれているため、注文を確定できません。お手数ですが、カートの内容を削除し、改めてメニューを選び直してください。',
    order_completed: '注文を完了しました。',
    payment_failed: '決済処理に失敗しました。サポートにお問い合わせください。',
    order_failed: '注文処理に失敗しました。サポートにお問い合わせください。',
    subsidy_recalculated: '割引金額が更新されました。内容をご確認のうえ、再度お試しください。',
    update_failed: '個数の更新に失敗しました。',
    delete_failed: '削除に失敗しました。',
    confirm_order_credit_card: 'お支払い画面に進みますか？',
    confirm_order_participant_on_day: '支払い方法は「参加者による当日払い」です。注文を確定しますか？',
    confirm_order_community_bill: '支払い方法は「主催者請求書払い」です。注文を確定しますか？',
    confirm_order_community_bill_checkout: 'おごり設定適用後の差額をオンライン決済でお支払いします。続きますか？',
    confirm_order: '注文を確定しますか？',
    remove_from_cart: 'カートから削除しますか？',
    removed_from_cart: 'カートから削除しました。',
    event_not_found: 'イベントが見つかりません。',
    order_and_attend_event: '注文を確定する',
    proceed_to_payment: 'お支払いに進む',
    no_items_in_cart: 'カートに商品はありません。',
    doesnt_exists_user_name: 'ユーザー名が登録されていません。登録完了後、注文を完了してください',
    doesnt_exists_user_image: 'アイコンが登録されていません。登録完了後、注文を完了してください',
    doesnt_exists_user_email: 'メールアドレスが登録されていません。登録完了後、注文を完了してください',
    go_to_setting: '設定する',
    add_more_menu: 'メニューを追加する',
    x_post: {
      title: '参加コメント',
      enable_post: 'X(Twitter)に投稿する',
      comment_placeholder: '参加コメントを入力してください',
      comment_label: '参加コメント',
      connect_x: 'X(Twitter)と連携設定して投稿する',
      default_comment: '{eventName} に参加します✋\n{eventUrl}\n{hashtag}#shokujii',
    },
  },
  cart_dialog: {
    add: 'カートに追加',
    close: '閉じる',
    login: 'ご注文にはログインが必要です。\nログイン完了後、再度この画面からメニューを選んでカートに追加してください。',
  },
  event_create_modal: {
    title: 'イベント開催のステップ',
    desc: `・<b>「郵便番号」</b>と<b>「開催日時」</b>を入力し、デリバリー可能な飲食店から1店舗を選択📍<br />
          ・イベント内容を入力。カバー画像は <a href="https://www.canva.com/design/DAF9HoKfhMw/YpkjpVdWZEWVJZ-MjEL85Q/edit" target="_blank">Canvaのテンプレート</a> をご活用ください🎨<br />
          ・公開範囲を<b>「公開」</b>または<b>「URL限定公開」</b>から選択できます👀<br />
          ・支払い方法は<b>「参加者 事前決済」</b>または<b>「主催者請求書払い」</b>から選択できます💰<br />
          ・内容が確定したらお店に<b>「予約申請」</b>。お店から<b>「予約承認」</b>をいただいたら注文受付開始💨<br />
          ・<a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit?slide=id.g2b9c62499c1_0_4#slide=id.g2b9c62499c1_0_4" target="_blank">SNS投稿</a> / <a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit?slide=id.g32d785a9a51_8_27#slide=id.g32d785a9a51_8_27" target="_blank">DM</a> / <a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit?slide=id.g2bc647906f7_0_0#slide=id.g2bc647906f7_0_0" target="_blank">QRコード</a> / <a href="https://docs.google.com/presentation/d/1i57dsnNhCi1G97RwSpJZQc1r7Gs7HilxMyQ9aWfxRqw/edit?slide=id.g2e7a4494cae_0_0#slide=id.g2e7a4494cae_0_0" target="_blank">Slack連携</a> / <a href="https://docs.google.com/presentation/d/1Hxnh5nJBwXM2MS7vmllYTcfc6k4s8XtxS0AvM6plbF0/edit?slide=id.g2e7a4494cae_0_0#slide=id.g2e7a4494cae_0_0" target="_blank">チラシ</a> / <a href="https://note.com/shokujii/n/n0c961c680fd3" target="_blank">レター機能</a> などを駆使して告知しよう📣<br />
          ・注文期限になると、注文内容が確定し、お店へ自動で発注されます📩<br />
          ・<b>「注文の目安」</b> の個数を下回ると、配送料をご請求する場合がありますのでご注意ください🚚<br />
          ・イベント当日は、フードを受け取って食事会をお楽しみください🎉<br />
          ・詳しくは <a href="https://bit.ly/3S3L8Sv" target="_blank">コミュニティガイド</a> や <a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit?slide=id.g2b9c62499c1_0_0#slide=id.g2b9c62499c1_0_0" target="_blank">告知・集客のコツ</a> もご一読ください。<br />
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
            「URL限定公開」や「主催者請求書払い」を設定することで、クローズドなお食事会も。<br />
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
            ・詳しくは <a href="https://bit.ly/3S3L8Sv" target="_blank" rel="noopener noreferrer">コミュニティガイド</a> および
            <a href="${LEGAL_URLS.terms}" target="_blank" rel="noopener noreferrer">利用規約</a>
            をご確認ください。<br />
            ・ご不明点ありましたらサポートまで
            <a href="https://forms.gle/z9L88Dq7vDKwbvxMA" target="_blank" rel="noopener noreferrer">お問い合わせ</a> ください。<br />`,
    },
  },
  community_create_confirm: {
    title: 'コミュニティを作成しますか？',
    desc: `・コミュニティ作成後、イベントを作成できるようになります。<br />
            ・shokujiiサポートにて入力内容を確認し、利用規約に違反していた場合、アカウントを停止させていただきます。<br />
            ・詳しくは <a href="https://bit.ly/3S3L8Sv" target="_blank">コミュニティガイド</a> および
            <a href="${LEGAL_URLS.terms}" target="_blank" rel="noopener noreferrer">利用規約</a>
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
  community_card: {
    members_count: 'メンバー {count}人',
  },
  community_contact_dialog: {
    send_to: '送信先：{communityName} にメールにて問い合わせます。',
    reply_to: '返信先：{replyTo}',
  },
  community_membership: {
    join: 'コミュニティに参加する',
    leave: 'コミュニティを退会する',
    active: 'コミュニティに参加中',
    join_success: 'コミュニティに参加しました。開催予定のイベントの通知を受け取れるようになりました。',
    leave_success: 'コミュニティを退会しました。開催予定のイベントの通知を受け取れなくなりました。',
    login_required: 'ログインするとコミュニティに参加できます。',
    login_confirm_join: 'ログイン後、コミュニティに参加してください。',
    login_confirm_leave: 'ログイン後、コミュニティを退会してください。',
    manager_leave_forbidden: '管理者はコミュニティを退会することができません。',
    error_generic: '処理に失敗しました。時間をおいて再度お試しください。',
    leave_confirm: 'コミュニティを退会しますか？開催予定のイベントの通知を受け取れなくなります。',
    manager_invite_success: '管理者になりました',
    manager_invite_invalid_url: '無効な URL です',
    manager_invite_error: 'エラーが発生しました。時間をおいて再度お試しください。',
    manager_invite_already_manager: '既にこのコミュニティの管理者です',
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
    community_cover_image_hint: '※推奨サイズ：1200x630px',
    community_icon_image: 'アイコン',
    community_icon_image_hint: '※推奨サイズ：300x300px',
    community_create_next: 'コミュニティを作成したら<br>次はイベントをつくってみよう🎉',
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
    bill_info_hint: `「主催者請求書払い」を利用される場合、請求先を設定してください。<br />
      「主催者請求書払い」を設定した場合、参加者は事前のオンライン決済を行わずにご注文でき、<br>
      弊社より主催者様に請求書を発行いたします。請求書のお支払い期限は翌月末日となっております。`,
    bill_fullname: '請求先 担当者名',
    bill_email: '請求先 メールアドレス',
  },
  event_edit: {
    back: '戻る',
    next: '進む',
    save_and_proceed: '保存して進む',
    save_draft: '保存する',
    save_and_preview: '保存してプレビュー',
    draft_saved: '仮保存しました',
    draft_save_failed: '保存に失敗しました',
    saved: '保存しました',
    step_nav_aria_label: 'ステップナビゲーション',
    organizer_memo_default: '{address} に到着しましたらお電話ください。お迎えにあがります。よろしくお願いいたします。',
    shop_cleared_incompatible_datetime:
      '開始日時が選択中の店舗の営業時間外のため、店舗選択を解除しました。店舗選択画面で選び直してください。',
    shop_cleared_postal_changed: '郵便番号を変更したため、店舗選択を解除しました。店舗選択画面で選び直してください。',
    shop_list_loading: '店舗一覧を読み込み中です。しばらくしてから再度お試しください。',
    shop_not_deliverable_before_save:
      '開催場所と開催日時に対して、選択中の店舗は配達・営業条件を満たしていません。店舗を選び直してください。',
    validation_modal_title: '入力内容をご確認ください',
    form_fields_invalid: '入力内容にエラーがあります。各項目のエラーを確認してください。',
    step1_validation: {
      postalcode_missing: '郵便番号が未入力です。',
      postalcode_invalid: '郵便番号は7桁の数字で入力してください。',
      address_base_missing: '住所1が未入力です。',
      address_detail_missing: '住所2が未入力です。',
      place_url_invalid: '会場URLの形式が正しくありません。',
    },
    step4_validation: {
      event_name_missing: 'イベントタイトルが未入力です。',
      event_cover_missing: 'イベントカバー画像が未入力です。',
      event_desc_missing: '開催内容が未入力です。',
      max_people_missing: '定員数が未入力です。',
      max_people_invalid: '定員数は正の整数で入力してください。',
      bill_fullname_missing: '請求先 担当者名が未入力です。',
      bill_email_missing: '請求先 メールアドレスが未入力です。',
      bill_email_invalid: '請求先 メールアドレスの形式が正しくありません。',
      off_amount_missing: 'おごり金額が未入力です。',
      off_amount_invalid: 'おごり金額は100円以上の値を入力してください。',
      off_amount_step: 'おごり金額は100円単位で入力してください。',
      members_visible_threshold_exceeds_max_people: '表示開始人数は定員以下に設定してください。',
    },
  },
  event_basic_info: {
    place: '開催場所',
    place_name: '会場名',
    place_url: '会場URL',
    place_name_hint: '例：XXXスペース(任意)',
    place_url_hint: '例：https://example.com(任意)',
    address_hint: '※予約申請後「郵便番号」「住所1」「住所2」の変更はできませんのでご注意ください。',
    date: '開催日時',
    start_date: '開始日',
    end_date: '終了日',
    hour: '時',
    minute: '分',
    date_hint: '※予約申請後「開催日時」は変更はできませんのでご注意ください。',
  },
  event_shop: {
    event_postalcode_desc: ' で注文できるお店',
    shop_range_min_orders: '注文の目安',
    shop_range_min_orders_unit: '個以上',
    button_selected: '選択中',
    button_check_menu: 'メニューをみる',
    shop_not_found: 'お店が見つかりませんでした',
  },
  event_menu: {
    select_menu_instruction: '参加者が注文できるメニューを選択いただけます',
    selected_count: '選択中: {count} / {total} メニュー',
    orderable: '選択中',
    not_orderable: '非表示',
    no_menus_found: '注文できるメニューがありません',
  },
  event_detail: {
    event_detail: '開催内容',
    event_name: 'イベントタイトル',
    event_image: 'イベントカバーとアルバム',
    event_cover_url: 'イベントカバー画像',
    event_cover_url_hint: '※カバー画像の推奨サイズは、1200 x 630ピクセル です。',
    event_cover_template:
      '※カバー画像作成は <a href="https://www.canva.com/design/DAF9HoKfhMw/YpkjpVdWZEWVJZ-MjEL85Q/edit" target="_blank">Canvaのテンプレート</a> もご活用ください🎨',
    album_preview_title: 'アルバム',
    album_preview_hint:
      '※画像はコミュニティ管理の<a href="{albumUrl}" target="_blank" rel="noopener noreferrer">「アルバム」タブ</a>で設定します。イベントページやコミュニティページに表示されます。',
    album_preview_modal_title: 'アルバムの設定',
    album_preview_modal_close: '閉じる',
    album_preview_modal_message:
      '画像はコミュニティの「アルバム」機能で設定してください。「OK」で設定画面を新しいタブで開きます。',
    album_preview_image_alt: 'アルバムのプレビュー {0}',
    album_preview_tile_aria: 'アルバム設定について開く',
    event_desc: '開催内容',
    event_desc_hint:
      '※「イベントの概要」「タイムスケジュール」「参加対象」「主催者情報」「緊急連絡先」「入館方法」「飲み物の有無/ご持参」「事前アンケートのURL」などについて適宜ご記載ください。',
    event_desc_image_hint: '※ツールバーの「画像」ボタンから、本文中に画像を挿入することができます。',
    deadline_date: '注文期限',
    deadline_hour: '時間',
    deadline_minute: '分',
    event_max_people: '定員数',
    event_max_people_hint: '※イベント参加できる最大の定員数を設定してください。',
    minimum_participants: {
      section_title: '最小催行人数',
      toggle_label: '最小催行人数を設定する',
      count_label: '最小催行人数',
      days_label: '判断日（注文締切の何日前）',
      field_help: '参加者が最小催行人数に達しない場合、自動でイベントを中止します。',
      organizer_summary:
        '注文期限の {days} 日前の時点で、参加者が {below} 人以下の場合、自動で中止します。<br>{count} 人以上の場合、イベントは予定通り開催されます。<br>{below} 人以下の場合、事前決済された方には全額返金され、メールにて通知が届きます。<br>判定はその日時1回のみ行います。判定日以降に参加者が減っても、自動では中止されません。',
      readonly_note: '注文受付開始後は変更できません（設定内容は表示のみ）。',
      public_title: '最小催行人数について',
      public_body:
        '注文期限の {days} 日前（{judgment}）の時点で、参加者が {below} 人以下の場合、自動で中止します。<br>{count} 人以上の場合、イベントは予定通り開催されます。<br>{below} 人以下の場合、事前決済された方には全額返金され、メールにて通知が届きます。<br>判定はその日時1回のみ行います。判定日以降に参加者が減っても、自動では中止されません。',
      public_model_a_note: '判定はその日時1回のみ行います。判定日以降に参加者が減っても、自動では中止されません。',
      validation_count: '1〜5の整数で入力してください',
      validation_days: '1〜5の整数で入力してください',
    },
    event_sns_hash_tag: 'ハッシュタグ',
    event_sns_hash_tag_hint: '※SNS投稿時のハッシュタグを設定してください。',
    activity: '公開設定',
    public: '公開イベント',
    private: '限定公開イベント',
    public_desc:
      '公開イベントは、shokujiiの <a href="https://shokujii.jp" target="_blank">TOPページ</a> に一覧表示されます。',
    private_desc:
      '限定公開イベントは、shokujiiの <a href="https://shokujii.jp" target="_blank">TOPページ</a> に一覧表示されず、URLを知る人だけが参加できます。',
    payment: '支払い設定',
    payment_hint_user_advance: `参加者事前決済 を設定した場合<br />
      食事の代金は、参加者がクレジットカード・Apple Pay・Google Pay・PayPay などで事前にお支払いいただきます。<br />
      支払い設定は予約申請後、変更できないためご注意ください。`,
    payment_hint_enterprise_subsidy: `福利厚生割引 を設定した場合<br />
      企業の割引ルールが適用されます。残額は参加者がクレジットカード等でお支払いいただきます。<br />
      自己負担0円の場合は決済不要で注文確定できます。`,
    payment_hint_community_bill_title: '主催者請求書払いについて',
    payment_hint_community_bill: `
    ・イベント終了後「請求先メールアドレス」宛に請求書を送付いたします。<br />
    ・「請求書払い手数料」としてお支払い金額に10%を加算して、ご請求させていただきます。<br />
    ・お支払い方法は銀行振込です。お支払い期限はイベント開催日の翌月末日です。<br />
    ・支払い設定は予約申請後、変更できないためご注意ください。`,
    error_max_people: 'すでに{0}人の予約が入っています',
    error_members_visible_threshold_exceeds_max_people: '表示開始人数は定員以下に設定してください',
    members_page_hidden_until_threshold: '参加者一覧は設定人数に達するまで表示されません',
    members_page_hidden_no_participants: '参加者がいないため、参加者一覧は表示されません',
    members_visible: '参加者一覧の表示',
    members_visible_field_help:
      'イベントページの参加人数や一覧を表示するかを設定できます。公開直後は参加者が少ない場合が多く、そのまま表示すると「人が集まっていない」印象を与え、新規の参加意欲を下げる場合があります。設定した人数に達するまで参加者一覧は表示されず、人数が少ないうちは非表示にし、集まり始めてから表示することで、参加しやすい雰囲気を保てます。',
    members_visible_always: '常に参加者一覧を表示する',
    members_visible_threshold: '指定人数に達してから、参加者一覧を表示する',
    members_visible_threshold_count_label: '参加者を表示しはじめる人数',
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
    minimum_participants_judgment_date: '最小催行人数の判断日',
    minimum_participants_judgment_date_hint:
      '※注文期限の {days} 日前の時点で、参加者が {below} 人以下の場合、イベントを自動で中止します。',
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
    send_reserve_mail: 'お店に予約申請する',
    send_reserve_mail_ok: '予約申請メールを送信する',
    confirm_send_reserve_mail: '<b>「{0}」</b>に予約申請メールを送信しますか？📩<br />',
    confirm_send_reserve_mail_desc: `・お店から<b>「予約承認」</b>されると、注文や告知ができるようになります。<br />
    ・予約申請をすると、店舗・開催場所・開催日時の変更はできません。<br />
    ・予約申請期間は<b>「最大で2日間（48時間）」</b>となっておりますので、ご了承ください。<br />
    ・予約が却下された場合は、お店などを変更して再度予約申請をしてください。<br />`,
  },
  user_event_card: {
    community_name: '【主催】{0}',
    event_start_datetime: '【日時】{0} 〜',
    event_address: '【場所】{0}',
    shop_name: '【食事】{0}',
    menu: '【注文内容】',
    menu_item: '{0} ({1}個)',
    total_price: '【支払い金額】{0}',
    total_self_pay: '【自己負担額】{0}',
    event_payment: '【支払い方法】{0}',
    cancel_order: '参加注文をキャンセルする',
    canceled: 'キャンセル済み',
    canceled_event: 'イベント中止（返金済み）',
    canceled_reject: '参加取消（返金済み）',
    processing: '決済処理中',
    cancel_dialog: {
      title: 'キャンセル',
      event_name: '【イベント名】{0}',
      order_deadline: '【注文期限】{0}',
      description_user_advance: `注文したメニューを選択してキャンセルを実行してください。<br />
                      キャンセルはイベントの注文期限まで可能です。<br />
                      キャンセル手続き完了後、返金がご利用の明細に反映されるまで5～10日かかります。<br />
                      キャンセルの取り消しはできません。あらかじめご了承ください。`,
      description_community_bill: `注文したメニューを選択してキャンセルを実行してください。<br />
                      キャンセルは、イベントの注文期限まで実行可能です。`,
      description_community_bill_discount: `注文したメニューを選択してキャンセルを実行してください。<br />
                      キャンセルはイベントの注文期限まで可能です。<br />
                      お支払い済みの差額分は、キャンセル手続き完了後、ご利用の明細に反映されるまで5～10日かかります。<br />
                      キャンセルの取り消しはできません。あらかじめご了承ください。`,
      description_enterprise_subsidy: `注文したメニューを選択してキャンセルを実行してください。<br />
                      キャンセルはイベントの注文期限まで可能です。<br />
                      返金額は自己負担分のみです。キャンセル手続き完了後、ご利用の明細に反映されるまで5～10日かかります。<br />
                      キャンセルの取り消しはできません。あらかじめご了承ください。`,
      not_cancel: 'キャンセルしない',
      submit: 'キャンセルを実行する',
      select_all: 'すべて選択',
      remaining: '残り {0} 個',
      column_menu: 'メニュー名',
      column_order_date: '注文日',
      column_menu_price: 'メニュー金額',
      column_amount: '支払い金額',
      column_self_pay: '自己負担額',
      refund_total: '返金額 {0}',
    },
    download_invoice: '領収書をダウンロード',
    download_invoice_error: '領収書の取得に失敗しました',
    orders_load_error: '注文内容の取得に失敗しました',
    orders_retry: '再試行',
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
    // eslint-disable-next-line quotes
    reserved_chars: "これらの記号は使用できません。（ %{}|^[]:?#/@`!$'()*+,;=\\ ）",
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
    title: 'お店に予約申請しよう📩',
    desc: `・現在<b>「下書き」</b>中のため、ご注文いただくことができません<br />
           ・イベント内容について問題なければ、お店に<b>「予約申請」</b>してください📩<br />
           ・お店から<b>「予約承認」</b>されると、注文や告知ができるようになります👍<br />
           ・予約申請をすると、店舗・開催場所・開催日時の変更はできないのでご注意ください⚠️<br />
           ・予約申請期間は、<b>「最大で2日間（48時間）」</b>となっております。<br />
           ・予約申請が却下された場合は、お店などを変更して再度予約申請をしてください。<br />`,
  },
  event_applying_notice_modal: {
    title: 'お店からの予約承認をお待ちください🙇‍♂️',
    desc: `・現在<b>「予約申請中」</b>のため、ご注文いただくことができません。<br />
           ・お店からの<b>「予約承認」</b>をお待ちください。<br />
           ・予約申請期間は、<b>「最大で2日間（48時間）」</b>となっております。<br />
           ・予約申請が却下された場合は、お店などを変更して再度予約申請をしてください。<br />`,
  },
  event_few_members_notice_modal: {
    title: 'イベントを盛り上げよう🎉',
    desc: `お店から予約承認をいただきました。<br />
           以下手順で友人知人を食事会に招待して盛り上げていきましょう。<br />
           <br />
           ① まずは、<b>「主催者」</b>や<b>「運営メンバー」</b>で早速注文💨<br />
           ② <a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit?slide=id.g2b9c62499c1_0_4#slide=id.g2b9c62499c1_0_4" target="_blank" rel="noopener noreferrer">SNS投稿</a> / <a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit?slide=id.g32d785a9a51_8_27#slide=id.g32d785a9a51_8_27" target="_blank" rel="noopener noreferrer">DM</a> / <a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit?slide=id.g2bc647906f7_0_0#slide=id.g2bc647906f7_0_0" target="_blank" rel="noopener noreferrer">QRコード</a> / <a href="https://docs.google.com/presentation/d/1i57dsnNhCi1G97RwSpJZQc1r7Gs7HilxMyQ9aWfxRqw/edit?slide=id.g2e7a4494cae_0_0#slide=id.g2e7a4494cae_0_0" target="_blank" rel="noopener noreferrer">Slack連携</a> / <a href="https://docs.google.com/presentation/d/1Hxnh5nJBwXM2MS7vmllYTcfc6k4s8XtxS0AvM6plbF0/edit?slide=id.g2e7a4494cae_0_0#slide=id.g2e7a4494cae_0_0" target="_blank" rel="noopener noreferrer">チラシ</a> / <a href="https://note.com/shokujii/n/n0c961c680fd3" target="_blank" rel="noopener noreferrer">レター機能</a>
           などで告知しよう📢 <br />
           ③ 詳しくは <a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit#slide=id.g2b9c62499c1_0_0" target="_blank" rel="noopener noreferrer">コミュニティガイド「告知・集客のコツ」</a> も参考に進めてください！`,
  },
  cancelpolicy_modal: {
    title: 'キャンセルポリシー',
    desc_before: `注文期限まで：キャンセル料金 0%<br />
    注文期限以降：キャンセル料金 100%<br />
    <br />
    注文期限内であれば `,
    orders_link: '注文履歴',
    desc_after: ' にてご自身でキャンセルを行うことができます。注文期限後、キャンセルはできませんのでご了承ください。',
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
    individual: '個人宛',
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
    copy: 'コピー',
  },
  email_dialog: {
    title: '個人宛レター',
    description: '個人宛にレターを配信することができます。\n返信先：{replyTo}',
    send_to: '配信先',
    send: '配信',
    send_letter: 'レターを配信する',
    sent: 'レターを配信しました',
    failed: 'レターの配信に失敗しました',
  },
  success_join_event_dialog: {
    loading: '注文情報を読み込み中です…',
    title: '注文完了🎉',
    subtitle: '参加申し込みが完了しました！',
    processing_title: '決済処理中',
    processing_subtitle: '決済処理中です。完了後、注文一覧に反映されます。',
    datetime: '📅 日時：',
    deadline: '⏳ 期限：',
    deadline_value: '{0}に注文締切',
    place: '📍 場所：',
    organizer: '👥 主催：',
    food: '👩‍🍳 食事：',
    hashtag: '#️⃣ ハッシュタグ：',
    chat_hint: '参加者のみなさんに挨拶してみましょう👋',
    share_on_x: 'SNSでシェアする',
    add_to_calendar: 'カレンダーに追加する',
    close: '閉じる',
    share_prompt: '参加することをSNSで友だちにも知らせよう🎉',
    share_prompt_ok: 'OK',
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
    app_update_reload: '更新を反映しています…',
  },
  maintenance: {
    title: 'メンテナンス中',
    description: '現在システムメンテナンスを実施しています。しばらくお待ちください。',
  },
  home_button_dialog: {
    title: 'ホーム画面に追加',
    step1: '①ご利用のブラウザから、以下のボタンをタップしてください。',
    step2: '②「ホーム画面に追加」をタップしてください。',
    step3: '③ shokujiiにいつでもアクセスできるようになります👍',
  },
  image: {
    invalid_format: '対応していない画像形式です。JPEG / PNG / APNG / GIF / WebP のいずれかをお選びください。',
  },
  reservation_request_reason: {
    event_start_past: '開催開始日時が過去になっています。未来の日時を設定してください。',
    event_start_lead_time: '開催開始日時が近すぎます。申請日から3日後以降の日時を設定してください。',
    shop_not_found: '選択中の店舗が見つかりません。店舗を選び直してください。',
    shop_not_approved: '未承認のため予約申請できません',
    shop_closed: '閉店のため予約申請できません',
    shop_not_open: '選択中の店舗の営業時間外です。営業時間内の開催開始日時を設定してください。',
    shop_not_in_delivery_area: '選択中の店舗は開催地への配達対象外です。別の店舗を選び直してください。',
    no_orderable_menu_selected: '注文可能なメニューが選択されていません。1件以上のメニューを選んでください。',
    applicant_user_name_missing: 'ユーザー名が未設定です。プロフィールを更新してください。',
    applicant_user_image_missing: 'プロフィール画像が未設定です。プロフィールを更新してください。',
    applicant_email_missing: 'メールアドレスが未登録です。アカウント情報を更新してください。',
    organizer_fullname_missing: '主催者氏名が未入力です。',
    organizer_company_missing: '主催者会社名・団体名が未入力です。',
    organizer_email_missing: '主催者メールアドレスが未入力です。',
    organizer_email_invalid: '主催者メールアドレスの形式が正しくありません。',
    organizer_phone_personal_missing: '主催者電話番号が未入力です。',
    organizer_phone_personal_invalid: '主催者電話番号の形式が正しくありません。',
    organizer_phone_company_invalid: '電話番号（会社/団体）の形式が正しくありません。',
    organizer_memo_missing: '配達受取場所が未入力です。',
    event_db_invalid: 'イベント情報に不足があります。各ステップの入力内容を確認してください。',
  },
  user_profile: {
    profile_settings: 'プロフィール設定',
    user_description_placeholder: '自己紹介を追加しましょう。',
    orders_page_lead:
      '注文期限前であれば、キャンセルすることができます。\nまたお支払い済みのご注文は領収書をダウンロードできます。',
    private_event_chip: '限定公開',
    stat_view_detail: '{label}の詳細を見る',
  },
  user_tags: {
    add_tag: 'タグ追加',
    settings_button_empty: 'タグを設定',
    settings_button_edit: 'タグを編集',
    dialog_title: 'タグの編集',
    save: '保存',
    cancel: 'キャンセル',
    save_success: 'タグを保存しました',
    save_failed: '保存に失敗しました',
    section_title: 'タグ',
    section_empty: '未設定',
    section_count: '{count}/10',
    cart_hint: '参加者と共通の話題を見つけやすくなります',
    join_dialog_hint: '参加者と共通の話題を見つけましょう',
  },
  manage: {
    settings: {
      submit: '設定する',
      saved: '保存しました',
    },
    newcommunity: {
      submit: 'コミュニティを作成する',
      created: 'コミュニティを作成しました',
      error: 'コミュニティの作成に失敗しました',
    },
    copy_event: 'イベントコピー',
    copy_event_modal: {
      title: 'イベントコピー',
      intro_overview:
        'イベントの内容を引き継いで「下書き」を作成します。場所・時刻・店舗・本文などは同じ内容がコピーされます。繰り返しコピーも可能です。コピー作成後、編集して予約申請を進めてください。',
      select_original: 'イベントを選択',
      hint_select_original: 'コピーの元になるイベントを一覧から選びます。',
      select_target_date: '開催日',
      hint_single_target_date: 'コピーするイベントの店舗の営業日・営業時間に合う日だけ選べます。',
      target_date: '開催日',
      field_open_date: '日付を選択',
      create_button: 'コピーして下書きを作成する',
      error: 'イベントのコピーに失敗しました',
      complete: 'イベントコピーが完了しました',
      copy_type: 'コピータイプ',
      hint_copy_type: '1件だけコピーするか、条件に沿って繰り返してコピーするかを選びます。',
      single_copy: '単発コピー',
      repeat_copy: '繰り返しコピー',
      repeat_interval: '繰り返す間隔',
      hint_repeat_interval: '開始日を起点に、繰り返しの間隔（数値と「日・週・ヶ月・年」）を指定します。',
      repeat_interval_number: '間隔の数値',
      repeat_interval_unit: '単位',
      interval_unit: {
        day: '日ごと',
        week: '週間ごと',
        month: 'ヶ月ごと',
        year: '年ごと',
      },
      monthly_pattern: '月次の繰り返し方（月ごとのとき）',
      hint_monthly_pattern: '「毎月同じ日付」は日付固定。「毎月同じ曜日」は第何週の何曜日に合わせます。',
      monthly_pattern_date: '毎月同じ日付',
      monthly_pattern_weekday: '毎月同じ曜日',
      start_date: '繰り返しの開始日',
      hint_repeat_start_date: 'コピーするイベントの店舗の営業日・営業時間に合う日だけ選べます。',
      repeat_count: '繰り返し回数',
      repeat_count_field: '回数',
      hint_repeat_count: '作成するイベントの回数です（最大12回）。店舗の営業日でない場合は、スキップされます。',
      repeat_count_unit: '回',
      preview_title: 'プレビュー',
      preview_intro: '下記の日時にそれぞれ下書きイベントが作成されます。',
      preview_count: '{count}個のイベントが下書き作成されます',
      preview_monthly_date: '毎月{day}日に作成されます',
      preview_monthly_weekday: '毎月第{week}{dayOfWeek}曜日に作成されます',
      preview_short_notice:
        '指定されたコピー回数（{requested}回）に対し、営業時間外スキップ等のため{actual}件のみ作成可能です',
      create_multiple_button: '{count}個のイベントを下書き作成する',
      success_multiple: '{count}個のイベントを下書き作成しました',
      success_partial: '{success}個のイベントを下書き作成しました（{failure}個失敗）',
      creating: 'イベントを作成中...',
      validation: {
        select_event: 'コピー元のイベントを選択してください',
        max_count: '一度に作成できるイベントは最大12個です',
        no_dates: '指定された条件で作成可能な日時がありません。間隔・コピー回数・開始日を見直してください',
      },
      day_of_week: {
        0: '日',
        1: '月',
        2: '火',
        3: '水',
        4: '木',
        5: '金',
        6: '土',
      },
      week_number: {
        1: '1',
        2: '2',
        3: '3',
        4: '4',
        5: '5',
      },
    },
    event: {
      tabs: {
        overview: '概要',
        member: '参加者',
        letter: 'レター',
        settings: '設定',
        flyer: 'チラシ',
      },
      edit: 'イベント設定',
      delete: 'イベント削除',
      dialog: {
        title: 'イベント削除',
        description: '本当に削除しますか？この操作は取り消せません。',
        submit: '削除',
        complete: 'イベント削除が完了しました',
      },
      no_community: `まだコミュニティがありません<br />
                      新しいコミュニティを立ち上げよう🌱`,
      no_events: `まだイベントがありません<br />
                    最初のイベントを作ってみよう🎈`,
      save_failed: 'イベントの保存に失敗しました',
      created_success: '「{name}」のイベントを新規作成しました',
      updated_success: '「{name}」のイベントを更新しました',
      save_error: 'イベントの保存中にエラーが発生しました: {error}',
      reserve_success: '「{name}」に予約申請しました。店舗からの予約承認をお待ちください。',
      reserve_error: '予約申請中にエラーが発生しました: {error}',
      reserve_validation_modal_title: '予約申請できません',
      reserve_validation_intro: '以下の項目をご確認のうえ、再度お試しください。',
      community_not_approved: 'コミュニティが承認されていません',
      not_manager: 'コミュニティ運営者ではありません',
      menu_update_failed: 'メニューの更新に失敗しました',
      community_bill_notice: {
        title: '主催者請求書払いについて',
        description: `本イベントの支払い方法は「主催者請求書払い」です。<br />
イベント終了後、主催者様宛に請求書を発行いたしますので、銀行振込にてお支払いください。<br />
<b>【お支払い期限】イベント開催日の翌月末日</b>`,
        link_label: '請求書のダウンロードはこちら',
        link_button: '請求書払いページを開く',
      },
      cancel: 'イベントキャンセル',
      cancel_reason_dialog: {
        title: 'イベントキャンセル',
        instruction: 'キャンセル理由を選択してください。',
        other: 'その他',
        other_placeholder: '理由を具体的に入力してください',
        error_other_required: '理由を入力してください',
        submit: '次へ（確認）',
      },
      cancel_confirm_dialog: {
        title: 'イベントキャンセルの確認',
        description: 'イベントのキャンセル処理は戻すことができません。本当にキャンセルしますか？',
        yes: 'はい',
        no: 'いいえ',
      },
      cancel_complete_dialog: {
        title: 'イベントのキャンセルが完了しました',
      },
      cancel_support_dialog: {
        title: 'イベントのキャンセル',
        description:
          '現在は参加者がいるため、この画面からのキャンセルはできません。参加者がいない場合は、「イベントをキャンセルする」から手続きできます。\n参加者への返金が必要な場合は、サポートまでお問い合わせください。',
      },
      cancel_failed: 'イベントのキャンセルに失敗しました',
      delete_failed: 'イベントの削除に失敗しました',
    },
    member: {
      manager: '管理者',
      member: 'メンバー',
      no_member: '参加者はまだいません。',
      status: 'ステータス',
      ordered: '注文済',
      processing: '決済処理中',
      in_cart: 'カート追加中',
      canceled: 'キャンセル',
      name: '名前',
      order: '注文内容',
      menu_price: 'メニュー金額',
      community_bill_off_amount: 'おごり金額',
      csv_download: 'CSV ダウンロード',
      invite_manager: '管理者を招待する',
      date: {
        ordered: '注文日時',
        processing: '決済処理中日時',
        in_cart: 'カート追加日時',
        canceled: 'キャンセル日時',
      },
      add_manager_dialog: {
        title: '{0} を管理者に追加する',
        description:
          '{0} をコミュニティ管理者に追加しますか？<br />コミュニティ管理者にすると、コミュニティの管理、イベントの作成・編集・削除などが行えるようになります。',
        submit: '追加',
        notification: 'コミュニティ管理者に追加しました',
        error: 'コミュニティ管理者の追加に失敗しました',
      },
      remove_manager_dialog: {
        title: '{0} を管理者から解除する',
        description:
          '{0} をコミュニティ管理者から解除しますか？<br />コミュニティ管理者でなくなると、コミュニティの管理、イベントの作成・編集・削除などが行えなくなります。',
        self_description:
          '{0} をコミュニティ管理者から解除しますか？<br />コミュニティ管理者でなくなると、コミュニティの管理、イベントの作成・編集・削除などが行えなくなります。<br /><br /><b>※自分自身を管理者から外した場合、自分で管理者に戻すことはできません。</b>',
        submit: '解除',
        notification: 'コミュニティ管理者から解除しました',
        error: 'コミュニティ管理者の解除に失敗しました',
        last_manager_error: '他に管理者がいないため、管理者から解除できません',
      },
    },
    letter: {
      hint: {
        title: 'レターを配信しよう💌',
        description: `レター機能を使うと<b>「コミュニティメンバー」</b>や<b>「イベント参加者」「イベント未登録者」</b>にメールを配信することができます。<br />
                        配信されるメールの返信先（Reply-To）は [コミュニティ設定] で設定したメールアドレスです。<br />
                        返信先は［コミュニティ設定］タブからご設定ください。詳細は <a href="https://note.com/preview/n0c961c680fd3?prev_access_key=ced956e93d24fb7689121a8bdb431ebb" target="_blank">レター機能について</a> をご確認ください。<br />
                        `,
      },
      type_select_dialog: {
        top: '「コミュニティメンバー」や「イベント参加者」「イベント未登録者」にメールで配信することができます。配信先を選択してください。',
        event: 'イベント参加者に配信',
        event_description: '「イベント参加者」や「イベント未登録者」にメールを配信することができます。',
        community: 'コミュニティメンバーに配信',
        community_description: 'コミュニティメンバー全体にメールを配信することができます。',
        type: {
          normal: '通常',
          important: '重要',
          warning: '警告',
        },
      },
      event_dialog: {
        top: 'レターを配信するイベントを選択してください',
      },
      edit: {
        new: 'レター作成',
        edit: 'レター編集',
        to: '配信先',
        to_community: 'コミュニティメンバー全体',
        to_event_participant: 'イベント参加者',
        to_event_non_participant: 'イベント未登録者',
        number_of_people: '（配信先：{0}人）',
        deliver_datetime: '配信日時',
        deliver_now: '今すぐ配信',
        subject: '件名',
        message: 'メッセージ',
        add_event_description: 'イベント内容を追加する',
        event_description: 'イベント内容',
        submit_reserve: '予約配信',
        submit_now: '今すぐ配信',
        save_draft: '下書き保存',
        to_draft: '下書きに戻す',
        send_test: 'テスト配信',
        send_test_success: 'テスト配信しました',
        send_test_error: 'テスト配信に失敗しました',
        save_success: 'レターを下書き保存しました',
        save_error: 'レターの下書き保存に失敗しました',
        submit_success: 'レターを配信設定しました',
        submit_error: 'レターの配信設定に失敗しました',
      },
      notification: {
        saved: 'レターを保存しました',
        deleted: 'レターを削除しました',
      },
      email_not_set: {
        title: 'メールアドレス未設定',
        description:
          'レターを配信するには、コミュニティのメールアドレスを設定する必要があります。<br>[コミュニティ設定] 画面で、[メールアドレス] を設定してください。',
      },
      permission_denied:
        'レターを表示する権限がありません。コミュニティ管理者またはサポート担当者としてログインしているか確認してください。',
    },
    community_manager_invitation: {
      title: 'URL を発行して、追加するメンバーに権限を付与します',
      description: '発行したURLは1週間有効で、利用されると無効になります。',
      generate: '招待URLを発行',
      failed: 'URL の発行に失敗しました',
    },
    new_letter: 'レター作成',
    flyer: {
      title: 'QRコード付きのチラシを印刷して、告知・集客に役立てよう！',
      description:
        '微調整もしやすい <a href="https://bit.ly/433wAbb" target="_blank">Canvaのテンプレート</a> もぜひご活用ください🎨',
      download_error: 'チラシのダウンロードに失敗しました',
    },
    invoice: {
      date: '開催日',
      status: 'ステータス',
      event_name: 'イベント名',
      oge_amount: 'おごり金額',
      price: '請求金額',
      download: '請求書',
      download_invoice: '請求書をダウンロード',
      error: '請求書の取得に失敗しました',
      title: '主催者請求書払い📃',
      description: `イベント設定画面で<b>「主催者請求書払い」</b>を設定した場合、参加者は事前のオンライン決済を行わずにご注文いただけます。<br />
      イベント終了後、主催者様宛に請求書を発行いたしますので、銀行振込にてお支払いください。<br />
      <b>【お支払い期限】翌月末日</b><br />
      <b>【請求書払い手数料】注文金額の10%</b><br />
      ※2025年11月1日以降のイベント開催分より、「請求書払い手数料」を加算してご請求させていただきます。<br />
      ※参加者による事前のオンライン決済の場合は、手数料は発生しません。<br />
      ※詳細は、<a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit#slide=id.g353224adc3a_0_0" target="_blank">支払い設定について</a> をご確認ください。`,
    },
    slack: {
      description: `<b>shokujii の SlackApp を追加</b>すると<br/>
                      <b>「🍽 参加者の注文通知」 「📅 注文期限のリマインド」 「🕛 イベント開始のリマインド」</b>
                      などの通知をSlackで受け取ることができます。<br/>
                      例えば、参加者の注文通知で<b>「自分も参加してみようかな？」</b>を促したり、注文期限のリマインドで<b>「主催者からの声がけを自動化」</b>できたり、<br/>
                      食事会への盛り上がりを自然に演出することで、告知・集客やイベント運営をよりスムーズに行うことが可能です。<br/>
                      詳細については <a href="https://docs.google.com/presentation/d/1i57dsnNhCi1G97RwSpJZQc1r7Gs7HilxMyQ9aWfxRqw/edit#slide=id.g2e7a4494cae_0_0" target="_blank">Slack連携について</a> もご確認ください。</b>`,
      setup: '設定方法',
      step1: 'STEP1',
      step1_desc: '下記リンクをクリックして、shokujii の SlackApp をコミュニティのワークスペースにインストール',
      step2: 'STEP2',
      step2_desc: `通知先のチャンネルを選択👆<br>
                    通知用に <b>#shokujii</b> のチャンネルを作成するのもおすすめです。<b>`,
      step3: 'STEP3',
      step3_desc: 'SlackAppを追加したチャンネルを開いて、以下のコマンドを<b>コピーして送信！<b>',
      step4: '完了🎉',
      step4_desc: `<b>「参加者の注文通知」「注文期限のリマインド」「参加者確定のお知らせ」「イベント開始のリマインド」「イベント終了のお知らせ」</b><br>
                    などがSlackのチャンネルで通知されるようになります。`,
      step5: '解除🔓',
      step5_desc: '設定を解除したい場合は、以下コマンドを設定したチャンネルで送信してください。',
      copy: 'コピー',
    },
    community: {
      tabs: {
        events: 'イベント',
        member: 'メンバー',
        letter: 'レター',
        invoice: '請求書払い',
        slackSetting: 'Slack連携',
        album: 'アルバム',
        settings: 'コミュニティ設定',
      },
      public_page: 'コミュニティページ',
      album: {
        page_title: 'アルバムを設定しよう🎨',
        help_heading_what: '【アルバム機能とは】',
        help_what: `アルバム画像を設定すると、コミュニティページとイベントページで、メインのカバー画像の下に並びます。<br />
            メインのカバー画像の一枚はこれまで通りで、雰囲気を補足する追加の写真としてご利用いただけます。<br />
            施設の写真、前回のイベントの様子、集合写真など、コミュニティの雰囲気のわかるものを追加してください。`,
        help_heading_how: '【設定方法】',
        help_how: `画像の左端のつまみをドラッグして並び順を変えられます。<br>
          画像をクリックすると、差し替え用の画像を選べます。各画像の説明は編集のあと、フォーカスを外すと自動保存されます。`,
        help_drag: '左端のつまみをドラッグして並び順を変えられます。',
        help_click_replace: '画像をクリックすると、差し替え用の画像を選べます。',
        add_images: 'アルバムに画像を追加',
        uploading: '{current}/{total} 枚をアップロード中…',
        caption_label: '説明',
        delete: '削除',
        delete_confirm: 'この画像を削除しますか？',
        sort_saved: '並び順を保存しました',
        sort_save_error: '並び順の保存に失敗しました',
        file_too_large: '1 枚あたり 10MB までです',
        upload_error: 'アップロードに失敗しました',
        delete_error: '削除に失敗しました',
        replace_error: '差し替えに失敗しました',
        replace_success: '画像を差し替えました',
        caption_saved: '説明を保存しました',
        caption_save_error: '説明の保存に失敗しました',
      },
    },
  },
  chat: {
    title: 'チャット',
    search_placeholder: 'ルームを検索',
    empty: {
      no_rooms: 'チャットはまだありません',
      no_rooms_hint: 'イベントに参加するとチャットが利用できます。',
      select_room: 'ルームを選んでください',
      select_room_hint: '一覧からチャットを選ぶとメッセージが表示されます',
      no_messages_hint: '最初のひとことを送ってみよう',
    },
    no_messages_yet: 'メッセージはまだありません',
    ended_label: '終了',
    message_placeholder: 'メッセージを入力',
    message_input_label: 'チャットメッセージ入力',
    send: '送信',
    readonly_hint: 'このチャットは終了したため、新しいメッセージは送信できません',
    loading_older: '過去のメッセージを読み込み中…',
    date_today: '今日',
    date_yesterday: '昨日',
    you: 'あなた',
    default_user_name: 'ユーザー',
    system_member_joined: '{name}さんが参加しました',
    system_message: 'システムメッセージ',
    open_chat: 'グループチャットをひらく',
    header_tooltip: 'チャット',
    open_user_profile: '{name}のプロフィールを見る',
    open_room_aria: '{name}のチャットを開く',
    open_event_page: '{name}のイベントページを開く',
    recall_message: '送信を取り消す',
    recall_confirm_title: '送信を取り消す',
    recall_confirm_message: 'このメッセージを取り消しますか？取り消し後は元に戻せません。',
    system_message_deleted: '{name}がメッセージを削除しました',
    last_message_preview_deleted: 'メッセージが削除されました',
    last_message_preview_image: '画像を送信しました',
    attach_image: '画像を添付',
    image_preview_alt: '添付画像のプレビュー',
    attachment_preview_group: '添付画像（送信前）',
    remove_attachment: '添付画像を取り消す',
    download_attachment: '画像をダウンロード',
    download_all_attachments: '画像をすべてダウンロード',
    download_failed: '画像のダウンロードに失敗しました',
    download_ios_hint: '「共有」から「写真に保存」を選んでください',
    download_ios_unavailable: '共有できませんでした。画像を長押しして保存してください',
    reaction_picker: 'リアクションを追加',
    reaction_count: '{emoji} {count}件',
    reaction_summary_label: 'リアクション {label}',
    reaction_detail_title: 'リアクション {count}',
    reaction_detail_title_plain: 'リアクション',
    reaction_detail_close: 'リアクション詳細を閉じる',
    reaction_detail_loading: '読み込み中…',
    reaction_detail_failed: 'リアクションの取得に失敗しました',
    reaction_failed: 'リアクションの更新に失敗しました',
    error: {
      preparing: '準備中です。しばらくしてから再度お試しください',
      room_not_found: 'チャットが見つかりません',
      attachment_too_large: '画像サイズが大きすぎます（最大 {size}）',
      attachment_count_limit: '画像は最大 {count} 枚まで添付できます',
      attachment_type: 'この形式の画像は送信できません',
      body_too_long: 'メッセージが長すぎます（最大 {count} 文字）',
      attachment_upload_failed: '画像の送信に失敗しました',
      attachment_load_failed: '画像の読み込みに失敗しました',
      recall_failed: '送信の取り消しに失敗しました。時間をおいて再度お試しください。',
      open_failed: 'チャットを開けませんでした。時間をおいて再度お試しください。',
    },
  },
}
