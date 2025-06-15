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
    'guide_top': 'コミュニティガイド',
    'guide_announce': '告知・集客のコツ',
    'event_cover_template': 'カバーのテンプレ',
    'flyer_template': 'チラシのテンプレ',
  },
  'top': {
    'popular_events': '人気のイベント',
    'upcoming_events': '開催予定のイベント',
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
        'invoice': '請求書払い',
        'slackSetting': 'Slack',
        'settings': 'コミュニティ設定',
      }
    },
    'event': {
      'tabs': {
        'overview': '概要',
        'member': '参加者',
        'letter': 'レター',
        'settings': '設定',
        'flyer': 'チラシ',
      },
      'edit': 'イベント設定',
      'delete': 'イベント削除',
      'dialog': {
        'title': 'イベント削除',
        'description': '本当に削除しますか？この操作は取り消せません。',
        'submit': '削除',
      },
      'no_community': `まだコミュニティがありません<br />
                      新しいコミュニティを立ち上げよう🌱`,
      'no_events': `まだイベントがありません<br />
                    最初のイベントを作ってみよう🎈`,
    },
    'member': {
      'manager': '管理者',
      'member': 'メンバー',
      'no_member': '参加者はまだいません。',
      'ordered': '注文済',
      'in_cart': 'カート追加中',
      'canceled': 'キャンセル',
      'name': '名前',
      'order': '注文内容',
      'csv_download': 'CSV ダウンロード',
      'date': {
        'ordered': '注文日時',
        'in_cart': 'カート追加日時',
        'canceled': 'キャンセル日時',
      },
      'add_manager_dialog': {
        'title': '{0} を管理者に追加する',
        'description': '{0} をコミュニティ管理者に追加しますか？<br />コミュニティ管理者にすると、コミュニティの管理、イベントの作成・編集・削除などが行えるようになります。',
        'submit': '追加',
        'notification': 'コミュニティ管理者に追加しました',
        'error': 'コミュニティ管理者の追加に失敗しました',
      },
      'remove_manager_dialog': {
        'title': '{0} を管理者から解除する',
        'description': '{0} をコミュニティ管理者から解除しますか？<br />コミュニティ管理者でなくなると、コミュニティの管理、イベントの作成・編集・削除などが行えなくなります。',
        'submit': '解除',
        'notification': 'コミュニティ管理者から解除しました',
        'error': 'コミュニティ管理者の解除に失敗しました',
      }
    },
    'letter': {
      'hint': {
        'title': 'レターを配信しよう💌',
        'description': `レター機能を使うと<b>「コミュニティメンバー」</b>や<b>「イベント参加者」「イベント未登録者」</b>にメールを配信することができます。<br />
                        配信されるメールの返信先（Reply-To）は [コミュニティ設定] で設定したメールアドレスです。返信先は［コミュニティ設定］タブからご設定ください。<br />
                        詳細は <a href="https://docs.google.com/presentation/d/1ivQlhaQ9c1RCUsWANcE_huZd9CF1O2OPBn5XTbJv1mw/edit?slide=id.g2e7a4494cae_0_0#slide=id.g2e7a4494cae_0_0" target="_blank">レター機能について</a> をご確認ください。<br />
                        `,
      },
      'type_select_dialog': {
        'top': '「コミュニティメンバー」や「イベント参加者」「イベント未登録者」にメールで配信することができます。配信先を選択してください。',
        'event': 'イベント参加者に配信',
        'event_description': '「イベント参加者」や「イベント未登録者」にメールを配信することができます。',
        'community': 'コミュニティメンバーに配信',
        'community_description': 'コミュニティメンバー全体にメールを配信することができます。',
        'type': {
          'normal': '通常',
          'important': '重要',
          'warning': '警告',
        },
      },
      'event_dialog': {
        'top': 'レターを配信するイベントを選択してください',
      },
      'edit': {
        'new': 'レター作成',
        'edit': 'レター編集',
        'to': '配信先',
        'to_community': 'コミュニティメンバー全体',
        'to_event_participant': 'イベント参加者',
        'to_event_non_participant': 'イベント未登録者',
        'number_of_people': '（配信先：{0}人）',
        'deliver_datetime': '配信日時',
        'deliver_now': '今すぐ配信',
        'subject': '件名',
        'message': 'メッセージ',
        'add_event_description': 'イベント内容を追加する',
        'event_description': 'イベント内容',
        'submit_reserve': '予約配信',
        'submit_now': '今すぐ配信',
        'save_draft': '下書き保存',
        'to_draft': '下書きに戻す',
        'send_test': 'テスト配信',
        'send_test_success': 'テスト配信しました',
        'send_test_error': 'テスト配信に失敗しました',
      },
      'notification': {
        'saved': 'レターを保存しました',
        'deleted': 'レターを削除しました',
      },
      'email_not_set': {
        title: 'メールアドレス未設定',
        description: 'レターを送信するには、コミュニティのメールアドレスを設定する必要があります。<br>[コミュニティ設定] からメールアドレスを設定してください。'
      }
    },
    'community_manager_invitation': {
      'title': 'URL を発行して、追加するメンバーに権限を付与します',
      'description': '発行したURLは1週間有効で、利用されると無効になります。',
      'generate': '招待URLを発行',
      'failed': 'URL の発行に失敗しました',
    },
    'slack': {
      'description': `<b>shokujii の SlackApp を追加</b>すると<br/>
                      <b>「🍽 参加者の注文通知」 「📅 注文期限のリマインド」 「🕛 イベント開始のリマインド」</b>
                      などの通知をSlackで受け取ることができます。<br/>
                      例えば、参加者の注文通知で<b>「自分も参加してみようかな？」</b>を促したり、注文期限のリマインドで<b>「主催者からの声がけを自動化」</b>できたり、<br/>
                      食事会への盛り上がりを自然に演出することで、告知・集客やイベント運営をよりスムーズに行うことが可能です。<br/>
                      詳細については <a href="https://docs.google.com/presentation/d/1i57dsnNhCi1G97RwSpJZQc1r7Gs7HilxMyQ9aWfxRqw/edit#slide=id.g2e7a4494cae_0_0" target="_blank">Slack連携について</a> もご確認ください。</b>`,
      'setup': '設定方法',
      'step1': 'STEP1',
      'step1_desc': `下記リンクをクリックして、shokujii の SlackApp をコミュニティのワークスペースにインストール`,
      'step2': 'STEP2',
      'step2_desc':`通知先のチャンネルを選択👆<br>
                    通知用に <b>#shokujii</b> のチャンネルを作成するのもおすすめです。<b>`,
      'step3': 'STEP3',
      'step3_desc': `SlackAppを追加したチャンネルを開いて、以下のコマンドを<b>コピーして送信！<b>`,
      'step4': '完了🎉',
      'step4_desc': `<b>「参加者の注文通知」「注文期限のリマインド」「参加者確定のお知らせ」「イベント開始のリマインド」「イベント終了のお知らせ」</b><br>
                    などがSlackのチャンネルで通知されるようになります。`,
      'step5': '解除🔓',
      'step5_desc': `設定を解除したい場合は、以下コマンドを設定したチャンネルで送信してください。`,
      'copy': 'コピー',
    },
    'settings': {
      'submit': '設定する',
      'saved': '保存しました',
    },
    'newcommunity': {
      'submit': 'コミュニティを作成する',
      'created': 'コミュニティを作成しました',
      'error': 'コミュニティの作成に失敗しました',
    },
    'invoice': {
      'date': '開催日',
      'place': '開催場所',
      'event_name': 'イベント名',
      'price': '金額',
      'download': 'ダウンロード',
      'no_invoice': '請求書はまだありません',
      'error': '請求書の取得に失敗しました',
      'title': '「主催者 請求書払い」について',
      'description': `イベント設定画面で<b>「主催者 請求書払い」</b>を設定した場合、参加者はクレジットカードによる事前決済を行わずにご注文いただけます。<br />
      イベント終了後、主催者様宛に請求書を発行いたしますので、銀行振込にてお支払いください。<br />
      お支払い期限は翌月末日となります。詳細は、<a href="https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit#slide=id.g353224adc3a_0_0" target="_blank">支払い設定について</a> をご確認ください。`,
    },
    'flyer': {
      'title': 'QRコード付きのチラシを印刷して、告知・集客に役立てよう！',
      'description': '微調整もしやすい <a href="https://bit.ly/433wAbb" target="_blank">Canvaのテンプレート</a> もぜひご活用ください🎨',
    }
  }
}
