import { ja } from 'vuetify/lib/locale/index.mjs'

export default {
  $vuetify: ja,
  sns_name: {
    'twitter.com': 'X',
    'google.com': 'Google',
    'facebook.com': 'Facebook',
    custom: 'メールアドレス',
  },
  navigation: {
    home: 'イベント参加',
    new_event: 'イベント開催',
    login: 'ログイン',
    community: 'コミュニティ',
    about: 'shokujiiって？',
    magagine: 'マガジン',
    x: '#最新情報',
    manage_top: '管理画面TOP',
    manage_event: 'イベント管理',
    manage_community: 'コミュニティ管理',
    guide_top: 'コミュニティガイド',
    guide_announce: '告知・集客のコツ',
    event_cover_template: 'カバーのテンプレ',
    flyer_template: 'チラシのテンプレ',
  },
  top: {
    popular_events: '人気のイベント',
    upcoming_events: '開催予定のイベント',
    past_events: '終了したイベント',
  },
  user: {
    order_list: '参加イベント',
    member_community_list: '参加コミュニティ',
    manager_community_list: '運営コミュニティ',
    event_create: 'イベント新規作成',
    community_management: 'コミュニティ管理画面',
    community_create: 'コミュニティを作る',
    canceled: 'キャンセルしました',
    cancel_failed: 'キャンセルに失敗しました',
    exists_email:
      '登録済みのメールアドレスです。\n他のメールアドレスを入力いただくか、登録済みメールアドレスのアカウントでログインしてください。',
    update_email: 'メールアドレスを変更しました。',
    exists_credential:
      'この{snsName}アカウントは、すでに別のユーザーとして登録されています。\n他のアカウントでお試しください。',
  },
  community: {
    applying: '申請中',
    reserve: '予約',
    edit: '編集',
    contact_after_login: 'ログインした後にお問い合わせしてください。',
  },
  event_page: {
    apply_to_shop: '店舗へ予約申請',
    edit: 'イベント編集',
    order_and_join: '食事を注文してイベントに参加する',
  },
  manage: {
    new_community: 'コミュニティ作成',
    new_event: 'イベント作成',
    new_letter: 'レター作成',
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
    top: {
      about_title: '【shokujiiって？】',
      about_description: `<b>食事でつながる「shokujii」</b>は<b>『孤食を減らし、団欒を増やす』</b>をミッションに、<br>
      普段の食事をコミュニケーションや、出会いの場に変えたいと考えうまれたサービスです。<br>
      shokujiiなら、飲食店選びから、参加者の出欠管理、料理の手配、決済までをひとまとめにできるので、<br>
      幹事業務がらくらくに。はじめて食事会を企画する方でも安心してお使いいただけます。<br>`,
      about_button_01: '食事でつながる「shokujii」って？',
      about_button_02: '社内交流も、営業活動、採用活動も、食事でつながる',
      community_list_title: '【コミュニティ】',
      community_list_description: 'コミュニティのみんなと食事会をひらこう🎉',
      community_create: 'コミュニティ作成',
      flow_title: '【イベント開催の流れ】',
      flow_description: 'イベントを作成したらすぐに注文開始。お気軽にご利用ください。',
      function_title: '【機能一覧】',
      function_description: 'shokujiiでできること。ご要望に応じて鋭意機能アップデート中です！',
      price_title: '【ご利用料金】',
      price_description: 'shokujiiは基本無料でご利用いただけます。',
      support_title: '【サポート】',
      support_description: 'お困りの際はサポートにお気軽にご相談ください。',
      howto: {
        step1: {
          title: 'コミュニティを作成',
          description:
            'イベント開催にあたって、まずはコミュニティを作成しよう！コミュニティ名や画像を設定したら作成完了。すでに作成済みの場合は<a href="https://shokujii.jp/manage/community">こちらから</a>',
          button: 'コミュニティを作成',
        },
        step2: {
          title: 'イベントを下書き作成',
          description:
            '開催日時を入力して注文可能な飲食店から1つ選択。イベントページのカバー画像は<a href="https://www.canva.com/design/DAF9HoKfhMw/YpkjpVdWZEWVJZ-MjEL85Q/edit" target="_blank">Canvaのテンプレート</a>を活用ください。',
          button: 'イベントを作成',
        },
        step3: {
          title: 'お店に予約申請',
          description:
            '支払い方法・公開設定など内容が確定したら、お店に「予約申請」を送信。（飲食店の業態はデリバリー以外にも、一部イートインやテイクアウトも選択可能です）',
          button: '詳細を見る',
        },
        step4: {
          title: 'まずは主催者が注文！',
          description: 'お店が「予約承認」すると注文の受付開始。まずは主催者メンバーから注文を進めましょう！',
          button: '詳細を見る',
        },
        step5: {
          title: 'SNSやメールで告知',
          description: 'メール配信/SNS投稿/DM/QRコード/チラシ生成/Slack連携などを駆使して告知集客をすすめよう！',
          button: '告知・集客のコツ',
        },
        step6: {
          title: '注文期限で自動発注',
          description:
            '注文期限になると、確定した注文内容をお店に自動発注。締切前であれば参加者はマイページから「キャンセル」することも可能です。',
          button: '詳細を見る',
        },
        step7: {
          title: 'お店からデリバリー',
          description:
            '指定の日時に、飲食店からご注文のお料理が届きます。お受け取りの際は、登録いただいた携帯電話を手元にご用意のうえ、お待ちください。',
          button: '詳細を見る',
        },
        step8: {
          title: 'いただきます！',
          description:
            'みなさん揃ったらいよいよ食事会のスタートです。「いただきます」のかけ声で、楽しいだんらんをお過ごしください。',
          button: 'イベント当日の準備',
        },
      },
      functions: {
        step1: {
          title: '参加者 事前決済',
          description:
            '参加者は自分が食べたいフードを選択し、クレジットカード・Apple Pay・Google Pay・PayPay などで事前決済します。当日の金銭やり取りが不要になり、スムーズな運営が可能です。',
          button: '詳細を見る',
        },
        step2: {
          title: '主催者請求書払い',
          description:
            '企業や団体などがイベントを主催する場合、まとめて後払い（請求書払い）にも対応可能です。イベント終了後に請求書を発行し、翌月末日までに銀行振込にてお支払いいただきます。',
          button: '詳細を見る',
        },
        step3: {
          title: '公開設定/URL限定公開',
          description:
            'イベントページの公開範囲を設定できます。全体に公開する「公開設定」のほか、URLを知っている人のみがアクセスできる「限定公開」にも対応しています。',
          button: '詳細を見る',
        },
        step4: {
          title: '管理者追加/削除',
          description:
            'コミュニティの管理者を複数人設定できます。運営メンバーの追加・削除がいつでも可能なため、チーム体制での運営にも柔軟に対応できます。',
          button: '詳細を見る',
        },
        step5: {
          title: 'SNS投稿機能',
          description:
            'イベント情報をそのままSNSに投稿できる機能です。X（旧Twitter）やFacebookなどで簡単にシェアでき、集客や告知にご活用いただけます。',
          button: '詳細を見る',
        },
        step6: {
          title: 'レター機能(メール配信)',
          description:
            '参加者やコミュニティメンバーに、メール配信が可能です。注文開始や締切のお知らせ、リマインド連絡などを一斉に送ることができます。',
          button: 'レター機能について',
        },
        step7: {
          title: 'チラシ生成機能',
          description:
            'イベント内容からQRコード付きのおしゃれなチラシを自動生成。またCanvaのテンプレートも公開中。チラシの配布や掲示で集客に活用ください。',
          button: 'チラシ生成機能について',
        },
        step8: {
          title: 'Slack連携',
          description:
            'Slackと連携することで、注文通知や締切リマインドなどの情報をチャンネルに自動投稿します。コミュニティでの情報共有がよりスムーズになります。',
          button: 'Slack連携について',
        },
        step9: {
          title: 'and so on...',
          description:
            'このほかにも、QRコード招待、参加者管理、領収書発行機能など、イベント運営をサポートする機能を順次追加・強化しています。',
        },
      },
      prices: {
        step1: {
          title: '主催者利用料 無料',
          description:
            'イベント主催者の利用料金は無料です。コミュニティの作成、イベント開催、メール配信など、すべての機能を無料でご利用いただけます。',
          button: '詳細を見る',
        },
        step2: {
          title: '配送料 無料',
          description:
            '大口注文のため配送料は無料です。ただし、店舗ごとに設定された最低注文個数に満たない場合は、配送料をご請求させていただく場合がございます。',
          button: '詳細を見る',
        },
        step3: {
          title: '請求書払い手数料',
          description:
            '企業・団体による「請求書払い」をご利用の場合、ご利用金額の10％を手数料として頂戴しております。お支払いはイベント終了後に発行される請求書に基づき、翌月末日までに銀行振込にてお支払いいただきます。',
          button: '詳細を見る',
        },
      },
      supports: {
        step1: {
          title: 'チャットでサポート',
          description:
            'イベントの準備や操作方法でお困りの際は、チャットサポートをご利用いただけます。画面右下のチャットアイコンからいつでもお気軽にご相談ください。',
          button: '詳細を見る',
        },
        step2: {
          title: 'オンラインMTG',
          description:
            'イベントの企画や導入にあたり、オンラインでの個別ミーティングも承っております。ご希望の方は、日程調整フォームよりお気軽にお申し込みください。',
          button: '日程調整フォーム',
        },
        step3: {
          title: '緊急連絡先',
          description:
            '当日のトラブルや配送に関する緊急対応が必要な場合は、専用の緊急連絡先までご連絡ください。緊急時以外のご連絡はチャットまたはメールをご利用ください。',
          button: '050-1721-5838',
        },
      },
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
      reserve_validation_intro: '以下の項目をご確認のうえ、再度お試しください。下書きの内容は保存されています。',
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
    },
    community_manager_invitation: {
      title: 'URL を発行して、追加するメンバーに権限を付与します',
      description: '発行したURLは1週間有効で、利用されると無効になります。',
      generate: '招待URLを発行',
      failed: 'URL の発行に失敗しました',
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
    settings: {
      submit: '設定する',
      saved: '保存しました',
    },
    newcommunity: {
      submit: 'コミュニティを作成する',
      created: 'コミュニティを作成しました',
      error: 'コミュニティの作成に失敗しました',
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
    flyer: {
      title: 'QRコード付きのチラシを印刷して、告知・集客に役立てよう！',
      description:
        '微調整もしやすい <a href="https://bit.ly/433wAbb" target="_blank">Canvaのテンプレート</a> もぜひご活用ください🎨',
    },
  },
  login: {
    login_fail: '{sns_name}ログインできませんでした',
    welcome: 'shokujiiへようこそ',
    please_login_or_register_below:
      '<a href="https://nijuni.notion.site/shokujii-38ef325b1c5f446880bbe35bc4bbf41c" target="_blank">「利用規約」</a> および <a href="https://nijuni.notion.site/shokujii-26a5f4507e5343329d2b7c6bea51030b" target="_blank">「プライバシーポリシー」</a> に同意の上、下記のいずれかの方法でログインまたは新規登録してください。',
    email: 'メールアドレス',
    continue_email: 'メールアドレスで続ける',
    sns_login: '{sns_name}でログイン',
    link_dialog_body:
      '{try_login_provider_label}に設定されているメールアドレスは、すでに{link_provider_label}アカウントと連携されています。 アカウントを連携するためにログインしてください',
    link_to_partner_site: '<a href="https://partner.shokujii.jp/" target="_blank">飲食店管理画面のログインはこちら</a>',
    link_to_forgot_account:
      '<a href="https://forms.gle/bFc77yitRgnaKgxa7" target="_blank">アカウントがわからない場合はこちら</a>',
    inapp: {
      notice_title: 'ChromeやSafariを開いてログインしてください',
      notice_body:
        'このブラウザからはログインができません。このページのURLをコピーして、ChromeやSafariなどのブラウザを開いてログインしてください。',
      copy_url: 'このページのURLをコピー',
      copied: 'URLをコピーしました',
      copy_failed: 'コピーに失敗しました。手動でURLを選択してコピーしてください',
      chrome: 'Chrome',
      safari: 'Safari',
    },
  },
  email: {
    register_email: 'メールアドレス登録',
    register_email_description: 'メールアドレスを登録してください',
    email: 'メールアドレス',
    send: '送信',
  },
  passcode: {
    enter_passcode: 'パスコードを入力',
    enter_passcode_description: '{email}に送信した6桁のコードを入力してください',
    resend: 'コードを再送信する',
    back: 'ログイン画面へ戻る',
    un_match_passcode: 'パスコードの値が間違っています',
    link_dialog_body:
      '{email}は既にメールアドレスログインで使用されています。{provider_label}と連携するため、ログインしてください。',
    send_code: 'パスコードを送信する',
  },
  complete: {
    new_user_title: 'アカウント登録完了',
    new_user_description: 'アカウント登録が完了しました🎉\nSNSアカウントと連携してプロフィールを登録しよう！',
    new_user_selfButton: '自分でプロフィールを登録する',
    exists_user_title: 'プロフィール登録',
    exists_user_description:
      'プロフィールが登録されていません。\nSNSアカウントと連携して、プロフィール登録を完了させよう👍',
    exists_user_selfButton: '自分でプロフィールを入力する',
    profile_registration_X: 'X と連携してプロフィール登録',
    exists_email: '登録済みのメールアドレスです。\n登録済みメールアドレスのアカウントでログインしてください。',
  },
  profile: {
    choice_profile_image: 'プロフィール画像を選択してください。',
    fail_image_upload: '画像のアップロードに失敗しました。',
    profile_settings: 'プロフィール設定',
    social_link: 'ソーシャルリンク',
    social_link_description:
      'ソーシャルリンクを設定すると <a href="https://shokujii.jp/mypage">マイページ</a> にSNSアカウントをリンクすることができます。',
    profile_image: 'プロフィール画像',
    user_name: 'ユーザー名',
    user_sns_twitter: 'X (Twitter)',
    user_sns_facebook: 'Facebook',
    user_sns_instagram: 'Instagram',
    user_sns_website: 'WEBサイト',
    user_description: '自己紹介文',
    change_settings: '設定を変更する',
    update_profile: 'プロフィールを変更しました。',
    email: 'メールアドレス',
    email_description: 'ログインや通知に使用するメールアドレスを設定してください。',
    not_changed_email: 'メールアドレスが変更されていません。',
    account_linkage: 'アカウント連携',
    account_linkage_description:
      'アカウントを連携すると、ソーシャルログインが利用できるようになり、SNSへの投稿もかんたんに行えるようになります。',
    google: 'Google',
    facebook: 'Facebook',
    twitter: 'X (Twitter)',
    linkage: '連携する',
    linked: '連携中',
    unlink_modal_title: '連携を解除しますか？',
    unlink: '解除',
    exist_email: 'すでに他ユーザーが利用しているメールアドレスです。',
    pending_email: '【変更中のメールアドレス】<br/><b>{pending_email}</b>',
    notice_pending_email: '※ メールアドレスを変更中です。パスコードを認証してください。',
    certification: '認証する',
    cancel: 'キャンセルする',
    linkage_completed: '{snsName}と連携しました',
    unlink_completed: '{snsName}の連携を解除しました',
    linkage_failed: '{snsName}との連携に失敗しました',
    unlink_failed: '{snsName}の連携解除に失敗しました',
    account_delete: 'アカウント削除',
    account_delete_description:
      'アカウントおよびユーザーの登録情報はすべて削除されます。<br />一度削除すると、元に戻すことはできません。',
    account_delete_confirm_title: 'アカウントを削除しますか？',
    account_delete_confirm_body:
      'アカウントを削除する前に、以下をご確認ください。<br /><br /><b>【削除される情報】</b><br />・ログイン情報<br />・プロフィール情報（ユーザー名/紹介文/画像/メールアドレス/SNS連携）<br />・コミュニティ管理者・メンバー登録情報<br /><br /><b>【保持される情報】</b><br />・ご注文履歴（サービス運営上の理由により保持されます。匿名化された形で管理いたします）<br /><br /><b>【注意事項】</b><br />・削除後は復元できません<br />・同じメールアドレスで再登録できますが、過去の履歴は引き継がれません',
    account_delete_button: 'アカウントを削除する',
    account_delete_sole_manager_error:
      '管理者があなたのみのコミュニティがあるため、アカウントを削除できません。先に他の管理者を追加するか、該当コミュニティから退会してください。',
    account_delete_failed: '処理に失敗しました。しばらくして再度お試しください',
    account_delete_complete_title: 'アカウント削除完了',
    account_delete_complete_message: 'ユーザーアカウントは正常に削除されました',
    account_delete_complete_ok: 'トップページへ',
  },
  user_profile: {
    my_page: 'マイページ',
    profile_settings: 'プロフィール設定',
    cart: 'カート',
    add_to_home_screen: 'ホーム画面に追加',
    contact: 'お問い合わせ',
    logout_menu: 'ログアウト',
    logout: 'ログアウトする',
    logout_modal_title: 'ログアウトしますか？',
    account_deleted: 'このユーザーは利用できません',
  },
  auth: {
    action: {
      title: 'shokujii',
      reset_email:
        'ログイン用メールアドレスを{current_email}から{restored_email}に復元しています。<br/>少々お待ちくださいませ。',
      notify_reset_email: 'ログイン用メールアドレスを復元しました。',
    },
  },
  error_messages: {
    register_email: 'メールアドレス登録に失敗しました',
  },
}
