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
    'new_community': 'コミュニティ新規作成',
    'new_event': 'イベント新規作成',
    'new_letter': 'レター新規作成',
    'community': {
      'tabs': {
        'events': 'イベント',
        'member': 'メンバー',
        'letter': 'レター',
        'slackSetting': 'Slack',
        'settings': '設定',
      }
    },
    'event': {
      'tabs': {
        'overview': '概要',
        'member': '参加者',
        'letter': 'レター',
        'settings': '設定',
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
      }
    },
    'letter': {
      'type_select_dialog': {
        'top': 'イベント参加者やコミュニティメンバーにメールで配信することができます。配信先を選択してください。',
        'event': 'イベント参加者に配信するレター',
        'event_description': 'イベント開催を案内したい時や、イベント参加予定者にメールを配信したい時など、イベントに関するメールを配信する時に選択してください。',
        'community': 'コミュニティメンバーに配信するレター',
        'community_description': '特定のイベントに関連しないメールをコミュニティ全体に配信する時に選択してください。',
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
        'new': 'レター新規作成',
        'edit': 'レター編集',
        'to': '配信先',
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
        'submit_now': '配信',
        'save_draft': '下書き保存',
        'to_draft': '下書きに戻す',
      }
    },
    'slack': {
      'description': `<b>shokujii の SlackApp を追加</b>すると<br/>
                      <b>「🍽 参加者の注文通知」 「📅 注文期限のリマインド」 「🕛 イベント開始のリマインド」</b>
                      などの通知をSlackで受け取ることができます。<br/>
                      例えば、参加者の注文通知で<b>「自分も参加してみようかな？」</b>を促したり、注文期限のリマインドで<b>「主催者からの声がけを自動化」</b>できたり、<br/>
                      食事会への盛り上がりを自然に演出することで、告知・集客やイベント運営をよりスムーズに行うことが可能です。<br/>`,
      'setup': '設定方法',
      'step1': 'STEP1',
      'step1_desc': `下記リンクをクリックして、shokujii の SlackApp をコミュニティのワークスペースにインストール`,
      'step2': 'STEP2',
      'step2_desc':`通知先のチャンネルを選択👆<br>
                    通知用に <b>#shokujii</b> のチャンネルを作成するのもおすすめです。<b>`,
      'step3': 'STEP3',
      'step3_desc': `SlackAppを追加したチャンネルを開いて、以下のコマンドを<b>コピーして送信！<b>`,
      'step4': '完了🎉',
      'step4_desc': `<b>「参加者の注文通知」「注文期限のリマインド」「イベント開始のリマインド」</b><br>
                    などがSlackのチャンネルで通知されるようになります。`,
      'step5': '解除🔓',
      'step5_desc': `設定を解除したい場合は、以下コマンドを設定したチャンネルで送信してください。`,
      'copy': 'コピー',
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
