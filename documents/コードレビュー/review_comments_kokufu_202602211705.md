# bokudeli-event-new - レビューコメント集

**レビュワー:** kokufu
**取得日時:** 2026/2/21 17:04:55
**総コメント数:** 166

---

## PR #1772: レター送信処理の改善

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1772
- **ステータス:** open
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `functions/default/src/letter.ts`
- **投稿日時:** 2026/2/19 14:02:42

**コメント内容:**

> `letter |` をつけるのは AI のアイデアですか？恐らく別のログシステムと勘違いしています。（といっても、かなり古い発想。近年のログシステムではメッセージ内に接頭辞をつけるものはほとんどありません。）
> logger を使用している場合、logs Explorer で関数名などでフィルタリング出来るので、この手の接頭辞は冗長です。
> 特定のログをフィルタリングしたい場合は json payload に `{tag: 'xxxx'}` のような項目を入れることはありますが、同じ関数内で全部につけるような使い方はしません。

---

### コメント 2

- **ファイル:** `functions/default/src/stores/letter.ts`
- **投稿日時:** 2026/2/19 13:51:00

**コメント内容:**

> doc.ref.withConverter(letterConverter),

---

### コメント 3

- **ファイル:** `functions/default/src/stores/letter.ts`
- **投稿日時:** 2026/2/18 20:33:18

**コメント内容:**

> letterRef に withTransaction がついていないはず。
> update 関数は withTransaction がある reference に対して呼べない。
> つまり、 update を呼ぶ時点で何かが間違っている。
> 
> 何度も指摘しているように、DB に対する操作は store 関数を経由するように徹底する。

---

## PR #1756: ADMIN 注文詳細画面のリロード・直接アクセス時に注文が表示されない問題を修正

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1756
- **ステータス:** open
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `admin/src/pages/order/[eventId].vue`
- **投稿日時:** 2026/2/19 13:47:02

**コメント内容:**

> shop ドキュメントを読み込んでいる理由は現在の所 isOwner かどうかを確認しているだけ。
> つまり、 shop ドキュメントが読み込めているかどうかは、このエリアに部分的に影響するだけです。
> この部分だけをローディングにし、他には関係ない実装にしなければならない。
> 今後、shop を別の用途に使うとしても、そのデータが存在するかどうかが関係する場所にのみ影響させる。 「shop ドキュメントが読み込めているかどうか？」という観点ではなく、あくまで「表示に必要な情報が読み込まれているかどうか？」という観点で view を作って行く必要があるのです。
> 

---

### コメント 2

- **ファイル:** `admin/src/pages/order/[eventId].vue`
- **投稿日時:** 2026/2/19 13:39:59

**コメント内容:**

> ダメです。「1つのドキュメント読み込みであればOK」ではなく、「そのドキュメント情報が画面全体に影響する場合のみ OK」です。というか、本来この手の発想で作り始めるとどんどんリアクティブでなくなっていくので、基本的には使わない方がよいのです。
> これが理解できないうちは getLoadedXXX を使用するのはやめた方がよいです。
> まして、たまたま「読み込みに時間がかからない」から雑な実装で良いという発想はNGです。

---

### コメント 3

- **ファイル:** `admin/src/pages/order/[eventId].vue`
- **投稿日時:** 2026/2/18 20:09:51

**コメント内容:**

> ここの `v-if="isOwner == null"` でローディングをかける

---

### コメント 4

- **ファイル:** `admin/src/pages/order/[eventId].vue`
- **投稿日時:** 2026/2/18 20:09:15

**コメント内容:**

> ちょっと意図していた事と違います。
> これやるなら  getLoadedShops 作るのと原理的にはかわらない。
> 
> そうではなくて、isOwner が null | boolean になるイメージ。

---

### コメント 5

- **ファイル:** `admin/src/pages/order/[eventId].vue`
- **投稿日時:** 2026/2/18 19:58:04

**コメント内容:**

> 細かいけど、 `shops` を一旦受ける意味はないのでは？

---

## PR #1773: コミュニティページの表示改善 / 参加時・退会時のリアルタイム再取得

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1773
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `base/src/stores/community.ts`
- **行番号:** 207
- **投稿日時:** 2026/2/18 20:45:05

**コメント内容:**

> 恐らく、community ドキュメントの members 配列とサブコレの members を持っていることの副作用がこのあたりに出てきていますが、この手のに目くじらを立てても進まないのでとりあえずよしとします。
> これが火を吹くのはコード量が10倍以上になってからでしょう。

---

## PR #1730: コミュニティ設定画面 オプショナル項目の対応 / Timestamp型の保存

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1730
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `base/src/stores/community.ts`
- **行番号:** 263
- **投稿日時:** 2026/2/18 20:21:20

**コメント内容:**

> ここで withConverter 消しちゃうと、 onSnapshot で取得されるデータに zod がかからないのでは？
> 動作確認してないけど、多分ダメ。

---

### コメント 2

- **ファイル:** `user/src/components/manage/community/settings.vue`
- **投稿日時:** 2026/2/12 13:22:41

**コメント内容:**

> 今の設計だと、Basic と Detail を同時に押されると先祖返りを起こす可能性があるので、isLoading は一つの方がよい。

---

### コメント 3

- **ファイル:** `base/src/stores/community.ts`
- **投稿日時:** 2026/2/12 13:21:19

**コメント内容:**

> coverImage のように副作用を伴うのはそのままで良い。
> あくまでも、「全部書き戻す方針」の意味は、オブジェクトの整合性がとれなくなるから。
> オーバーな話、 updateXXX という関数を全てのフィールドに対して用意して、型安全性を確認するようにするならば部分アップデートでも問題ない。
> それが面倒（非現実的）なので、image のアップデート等を伴うものだけ特別扱いにし、残りは全て updateCommunty でアップロードする方針。

---

### コメント 4

- **ファイル:** `base/src/stores/community.ts`
- **投稿日時:** 2026/2/12 13:14:26

**コメント内容:**

> fields いる？
> もともと、firestore から取得したドキュメントデータを持っている。だから、それを一部変更して全部を書き直しても問題ない。
> という思想で部分マージをしないようにしています。その思想が崩れます。
> 部分マージを許可すると、コンストラクタを経ないインスタンスを許可することになり、オブジェクトの整合性がくずれます。これを実現したい場合、class ではなく、ファクトリ関数等を用いた別の仕組みに変更しなければなりません。
> 
> もし、EditBasic と EditDetail 毎に別の修正を実現したいなら、 BokudeliCommunity インスタンスを2つ作る。それぞれ、編集した際に updateCommunity を呼ぶ。というようにしてください。

---

### コメント 5

- **ファイル:** `admin/src/pages/community.vue`
- **投稿日時:** 2026/2/8 13:07:27

**コメント内容:**

> なんで basic に変えた？
> default は無名で使える特別な名前なので、一般的に最低一つもたせておくべき。
> あえて変える必要ない。
> 
> →　そもそも slot を2つもたせるのが間違い。CommunityEdit を2種作るのがベスト。
> 

---

### コメント 6

- **ファイル:** `base/src/stores/community.ts`
- **投稿日時:** 2026/2/8 13:05:06

**コメント内容:**

> 必要ない。DB から取得した完全なデータがあることを前提としているため、あえて Partial は作っていない。
> 必ず updateCommunity を使う

---

### コメント 7

- **ファイル:** `base/src/stores/community.ts`
- **投稿日時:** 2026/2/8 13:00:24

**コメント内容:**

> toFirestore を直接呼んではだめ
> withConverter を削除するのもだめ
> toFirestore は FirestoreDataConverter 内のみで使用されることを想定している。
> 

---

## PR #1760: イベント論理削除は404を表示する

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1760
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `admin/src/router/index.ts`
- **投稿日時:** 2026/2/18 20:20:42

**コメント内容:**

> ここで getLoadedEvent を使う
> まさにこういうケースのための getLoadedEvent

---

## PR #1736: ユーザープロフィール画像の登録不具合修正

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1736
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `user/src/pages/profile.vue`
- **投稿日時:** 2026/2/12 12:57:06

**コメント内容:**

> `:user="userImagePreview ?? currentUser"`

---

### コメント 2

- **ファイル:** `base/src/components/UserAvatar.vue`
- **投稿日時:** 2026/2/12 12:56:02

**コメント内容:**

> いらない。 すでに user が string だった場合、希望の動作をする

---

## PR #1738: イベントのコピー機能

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1738
- **ステータス:** closed
- **作成者:** kokufu

### コメント 1

- **ファイル:** `user/src/components/manage/community/events.vue`
- **投稿日時:** 2026/2/12 12:48:33

**コメント内容:**

> 機能的に殺す場合は v-if

---

### コメント 2

- **ファイル:** `user/src/components/manage/community/CopyEventDialog.vue`
- **投稿日時:** 2026/2/12 12:46:55

**コメント内容:**

> 曜日でしか区別していないので 7 日で十分では？

---

### コメント 3

- **ファイル:** `base/src/components/EventList.vue`
- **投稿日時:** 2026/2/12 12:45:31

**コメント内容:**

> こういう色指定を直接しない。
> Theme を使う。

---

## PR #1710: 注文時の参加人数の設定機能 （event_num_membersの更新）

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1710
- **ステータス:** open
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `common/src/schemas/Event.ts`
- **行番号:** 154
- **投稿日時:** 2026/2/8 14:23:31

**コメント内容:**

> いらない

---

### コメント 2

- **ファイル:** `common/src/schemas/Event.ts`
- **行番号:** 122
- **投稿日時:** 2026/2/8 14:23:10

**コメント内容:**

> いらない。UI で計算しない以上、 functions での書き込みのみに制限する方がよい。

---

### コメント 3

- **ファイル:** `base/src/components/pages/cart.vue`
- **行番号:** 46
- **投稿日時:** 2026/2/8 14:18:34

**コメント内容:**

> codex の言うとおり、リアクティブ変数を関数内で直接使ってはいけない。

---

### コメント 4

- **ファイル:** `base/src/composable/useEventMembers.ts`
- **行番号:** 1
- **投稿日時:** 2026/1/31 21:35:44

**コメント内容:**

> composable ではなく store で計算すべき

---

### コメント 5

- **ファイル:** `base/src/components/EventCard.vue`
- **投稿日時:** 2026/1/31 21:33:16

**コメント内容:**

> リアクティブに

---

### コメント 6

- **ファイル:** `common/src/schemas/Event.ts`
- **行番号:** 197
- **投稿日時:** 2026/1/31 21:07:10

**コメント内容:**

> この実装だと、members との乖離が生まれるので、 event_num_members は getter でないとダメ

---

## PR #1704: 注文時の参加人数の設定機能 （member_countフィールドの追加）

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1704
- **ステータス:** open
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `base/src/stores/event.ts`
- **行番号:** 265
- **投稿日時:** 2026/2/8 13:53:47

**コメント内容:**

> `UpdateMemberCountInCartRequest` を直で引数にとるのはユーザーに不親切では？
> あえて定義しなおしている意味を考えてください。
> 

---

### コメント 2

- **ファイル:** `base/src/components/pages/cart.vue`
- **投稿日時:** 2026/1/31 21:42:49

**コメント内容:**

> これも

---

### コメント 3

- **ファイル:** `base/src/components/pages/cart.vue`
- **投稿日時:** 2026/1/31 21:42:37

**コメント内容:**

> こういうのに watch を使わない

---

### コメント 4

- **ファイル:** `base/src/stores/event.ts`
- **投稿日時:** 2026/1/31 21:39:51

**コメント内容:**

> 何故、独自type?

---

### コメント 5

- **ファイル:** `base/src/components/pages/cart.vue`
- **投稿日時:** 2026/1/31 21:37:43

**コメント内容:**

> リアクティブに

---

### コメント 6

- **ファイル:** `common/src/schemas/EventOrder.ts`
- **投稿日時:** 2026/1/28 21:56:19

**コメント内容:**

> こっちは optional ではない。新規のものは必須にする。

---

### コメント 7

- **ファイル:** `common/src/schemas/EventOrder.ts`
- **投稿日時:** 2026/1/28 21:52:09

**コメント内容:**

> いらないはず。現在も使われていないし、親（event）が既に持っている情報を重複させるのは、特別な事情がない場合はやってはいけない。

---

## PR #1729: user_image_url:null によるeventInformationMailの不具合修正

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1729
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `functions/default/src/eventInformationMail.ts`
- **投稿日時:** 2026/2/8 13:33:21

**コメント内容:**

> sgMail.send 自体は呼ばれた時点で実行されているのでコメントが不適切。
> バッチサイズで待つのは駄目ではないが、その後の待機時間はいらないのでは？
> ジェネレーターなので既に API 呼び出しには一定のディレイがはいっているため。
> ここで 1秒もいれると恐らく function のタイムアウトの方にひっかかる。
> 
> ジェネレーターにしたことで、むしろバッチは不要な方向なはずですが、何故このタイミングでバッチ導入？
> 何らかの理由があってこの実装ですか？

---

### コメント 2

- **ファイル:** `common/src/schemas/User.ts`
- **投稿日時:** 2026/2/8 13:21:42

**コメント内容:**

> こちらは修正しちゃだめ

---

## PR #1732:  新着イベントメール送信不具合修正

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1732
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `functions/default/src/orderCompletionMail.ts`
- **行番号:** 136
- **投稿日時:** 2026/2/7 16:23:37

**コメント内容:**

> 何で？の理由が欲しい。

---

### コメント 2

- **ファイル:** `functions/default/src/orderCompletionMail.ts`
- **投稿日時:** 2026/2/6 20:09:39

**コメント内容:**

> ここで Event オブジェクトを返せば良いだけ

---

### コメント 3

- **ファイル:** `functions/default/src/orderCompletionMail.ts`
- **投稿日時:** 2026/2/5 19:55:34

**コメント内容:**

> transaction 内でもう一度読み込んでいるので、意味がない。

---

## PR #1711: 請求書一覧画面の金額表示に手数料10%を反映

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1711
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `user/src/components/manage/community/invoice.vue`
- **投稿日時:** 2026/2/5 19:39:38

**コメント内容:**

> 数字に falsy 計算は用いない （0にも反応する）

---

### コメント 2

- **ファイル:** `common/src/utils/invoice.ts`
- **投稿日時:** 2026/2/5 19:38:56

**コメント内容:**

> こういうのは早期 return ではないほうがよい。
> 言語によっては以下のように書け、「fee を計算する」という並列の動作をしているということが明確になる。（Javascript ではこの書き方は今の所出来ないが、変わる可能性はある）
> ```
> const fee = if (xxx) {
>  a
> } else if (yyyy) {
>   b
> } else {
>   c
> }
> ```
> こうすることで、将来的に多段になったときもミスが少なくなる。
> 早期 return は多用しないこと。
> 他に問題なければ、OK にしても良いくらいの問題だが、こういうのを普段から意識してください。

---

### コメント 3

- **ファイル:** `user/tsconfig.app.json`
- **投稿日時:** 2026/2/5 19:33:53

**コメント内容:**

> これはだめ

---

### コメント 4

- **ファイル:** `user/src/components/manage/community/invoice.vue`
- **投稿日時:** 2026/2/3 22:25:51

**コメント内容:**

> Date オブジェクトは実行環境で UNIX タイムの値がかわるので引数にとってはダメ
> 必ず UNIX Time にする
> 
> `CUTOFF_UNIX_TIME_2025_11_01_JST` と同じ理由で common に定義する
> 
> `getTotalPrice` という関数に UNIX Time を取るより、`calculateInvoiceCommission(price: number, time: number)` 等の別関数を設け、合算する方がよい。（PDF などの途中計算を正しく処理できる）
> さらに、 `EventOrder` には totalPrice というプロパティが（今は）あるので、こちらを使う方がよい

---

### コメント 5

- **ファイル:** `user/src/components/manage/community/invoice.vue`
- **投稿日時:** 2026/2/3 22:16:03

**コメント内容:**

> legacy から将来的に移行することも念頭におき、 common に定義する

---

### コメント 6

- **ファイル:** `user/src/components/manage/community/invoice.vue`
- **投稿日時:** 2026/2/3 22:15:24

**コメント内容:**

> Date オブジェクトは実行環境で UNIX タイムの値がかわるので必ず luxon を使う

---

## PR #1713: イベントステータス更新時の更新者指定を必須化

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1713
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `functions/default/src/stores/event.ts`
- **投稿日時:** 2026/2/1 23:26:48

**コメント内容:**

> これは確かに。
> たかが log message だが、こういう細かい相違でデバッグ時に時間がかかる。

---

### コメント 2

- **ファイル:** `functions/default/src/stores/event.ts`
- **行番号:** 205
- **投稿日時:** 2026/2/1 23:24:18

**コメント内容:**

> 1 PR に含めるべき責務を逸脱しているのは確かだが、 `updateEventStatus` を使用している関数が一つしかない、かつ、そもそもの実装に問題があったため、これは許可されると思われる。

---

### コメント 3

- **ファイル:** `functions/default/src/stores/event.ts`
- **投稿日時:** 2026/2/1 16:16:02

**コメント内容:**

> > 本来チェックする必要のないものまで入れると可読性が下がる
> 
> まさにこれですね
> 
> 更に言うと、この箇所に変更をしないといけない時に、
> 「何らかの意図があってやっているのか？」→「自分が気づいてない何らかの意図があるのかもしれない」→「触りたくない」→「なんか変な実装でごまかす」
> で、コードが複雑になっていき、余計触れなくなるというネガティブスパイラルにはいります。

---

### コメント 4

- **ファイル:** `functions/default/src/stores/event.ts`
- **投稿日時:** 2026/1/31 21:00:54

**コメント内容:**

> trim はいりません。
> ユーザーの入力した値ではないので、なるべく生の値を使うべきです。
> Copilot が言わんとしていたのは、 `updateUserId !== ''` とすべきという話です。
> falsy チェックは基本的に文字列に使用してはいけません。

---

## PR #1709: イベント作成時のメニュー選択機能

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1709
- **ステータス:** open
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `functions/default/src/updateEventMenus.ts`
- **投稿日時:** 2026/1/31 21:52:52

**コメント内容:**

> 新規ファイルでは logger を使うべき

---

### コメント 2

- **ファイル:** `base/src/stores/event.ts`
- **投稿日時:** 2026/1/31 21:50:56

**コメント内容:**

> 基本的に callable は json にシリアライズされて送られるので、オブジェクトとしては一部の機能が落ちます。なので、できるだけプリミティブ以外のデータは送らない方が良いです。
> stripe 等、一部送っている API があるのですが、これはデータベース上にデータがなく、直接送るしか手がないためです。（使用する方で気をつけて使用しなければならない。コメントは書いておいたほうが良いかもしれない）
> このケースのように既にデータがデータベース上にある場合は id のリストを送るのが安全です。

---

### コメント 3

- **ファイル:** `base/src/components/EventEdit.vue`
- **投稿日時:** 2026/1/31 21:29:53

**コメント内容:**

> ちゃんと読んでないのですが、こんなに `watch` が並んでいる時点でおかしい。
> 基本的には computed で計算できるはず。
> （過去、DB を直接呼び出していた箇所は watch を使わざるをえず、その名残でしょうがなく残っているだけです）

---

### コメント 4

- **ファイル:** `functions/default/src/stores/event.ts`
- **投稿日時:** 2026/1/31 21:21:01

**コメント内容:**

> こういった変換に簡易版を独自実装しない。
> util の関数を利用する。

---

## PR #1706: イベント編集時に店舗一覧が表示されない不具合を修正

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1706
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `base/src/components/EventEdit.vue`
- **投稿日時:** 2026/1/28 21:25:30

**コメント内容:**

> location.value に値を入れる、という並列の処理を記述する場合は 早期リターンを使うより else を使うほうが良いです。
> 後々、両方の処理後に xxx をする。というようなものを書いた場合、問題がおこりにくくなります。
> 
> 早期リターンはエラーハンドリングのような、「明らかにそこで処理が終了する」場合にのみ使用するようにしたほうがよいです。

---

## PR #1694: ログイン状態監視をログアウト時のみ動作するように修正

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1694
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `admin/src/router/index.ts`
- **投稿日時:** 2026/1/24 16:14:46

**コメント内容:**

> よくかんがえると、別タブでのログアウトを lastUser が保存して検知する必要はない。何故ならば `router.isReady()` が呼ばれるのはそのタブの初期化時のみだから。なので問題はなかったと思われる。
> `isReady` がなくなったことで、router 初期化前に `replace` が呼ばれる危険性があるが、これまでも問題なく動いていたため、とりあえず現状維持が良いと思われる。

---

## PR #1686: Event involice を receipt に変更

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1686
- **ステータス:** closed
- **作成者:** kokufu

### コメント 1

- **ファイル:** `user/src/pages/receipt.vue`
- **投稿日時:** 2026/1/14 20:03:05

**コメント内容:**

> @nijuni-yasu 
> どのような状況で発生していますか？
> 私のところでは再現しません。

---

## PR #1685: レター予約送信の2重送信問題を修正

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1685
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `functions/default/src/letter.ts`
- **行番号:** 212
- **投稿日時:** 2026/1/14 19:37:15

**コメント内容:**

> 情報が重複している

---

### コメント 2

- **ファイル:** `functions/default/src/letter.ts`
- **行番号:** 29
- **投稿日時:** 2026/1/14 19:36:45

**コメント内容:**

> こういう文字列はインラインのままでも良かったが

---

### コメント 3

- **ファイル:** `functions/default/src/letter.ts`
- **投稿日時:** 2026/1/12 14:17:28

**コメント内容:**

> そもそも functions の中で console を使うのはよくありません。
> logger を使うべきです。
> https://firebase.google.com/docs/functions/writing-and-viewing-logs

---

## PR #1658: 全てのログイン必須ページで /login へリダイレクト

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1658
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `user/src/router/index.ts`
- **投稿日時:** 2026/1/10 20:42:32

**コメント内容:**

> いらない。これはユーザーをスイッチできる UI の時に使用されるモデルで、現行では無意味。
> かつ、将来的にユーザーをスイッチできる形に変更した場合、この実装だけでは不十分。
> 中途半端な汎化は混乱を招くのでNG。
> 

---

### コメント 2

- **ファイル:** `user/src/router/index.ts`
- **投稿日時:** 2026/1/3 12:01:18

**コメント内容:**

> こっちの方が親切では？
> ```
>     const path = router.currentRoute.value.path
>     const fullPath = router.currentRoute.value.fullPath
>     if (user == null && isLoginRequired(path)) {
>       router.replace({ path: '/login', state: { redirect: fullPath } })
>     }
> ```

---

### コメント 3

- **ファイル:** `user/src/router/index.ts`
- **行番号:** 41
- **投稿日時:** 2026/1/2 15:34:40

**コメント内容:**

> 消しちゃだめ。

---

### コメント 4

- **ファイル:** `user/src/components/UserProfile.vue`
- **投稿日時:** 2026/1/2 15:34:29

**コメント内容:**

> これはダメ。ログイン、ログアウトはイベントで捕まえるのが鉄則。

---

## PR #1657: 新着イベント通知メールの送信失敗時にフラグが立たない不具合を修正

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1657
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `functions/default/src/orderCompletionMail.ts`
- **投稿日時:** 2026/1/4 13:12:46

**コメント内容:**

> これはレースコンディションを起こすので NG
> これを避けるために transaction を使う

---

### コメント 2

- **ファイル:** `functions/default/src/orderCompletionMail.ts`
- **投稿日時:** 2026/1/2 16:28:35

**コメント内容:**

> transaction を入れるなら ここで取るのは eventId で直に event を取ってはいけない。
> `is_public` も `sent_new_event_mail_at` も transaction 外でチェックされている。

---

### コメント 3

- **ファイル:** `functions/default/src/stores/event.ts`
- **投稿日時:** 2026/1/2 16:16:23

**コメント内容:**

> 何でもかんでも store に入れれば良いというものではない。
> getEvent と saveEvent のみで対応できる内容。ビジネスロジックを store になるべく持ち込まない。

---

### コメント 4

- **ファイル:** `functions/default/src/stores/event.ts`
- **投稿日時:** 2026/1/2 16:13:48

**コメント内容:**

> converter のついてない ref の使用はNG。（ただ、この関数自体不要なので無意味）

---

## PR #1660: ヘッダーにおける「ログイン」「イベント参加」「イベント主催」ボタンの改善

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1660
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `user/src/layouts/default.vue`
- **投稿日時:** 2026/1/3 12:18:29

**コメント内容:**

> しれっと外部オープンが router に置き換わっているのは良くないです。
> この手の変更は動作的にはあまり変わらないけど、内部の動作が大きく変わるので、これを起点に別のバグが発生する可能性があります。
> できれば別 PR にした方がよいけれど、この PR に含めるにしても別 Issue を作って、それに紐付けた Commit にするようにしてください。
> git blame で追えない（追いづらい）状況になったときに、どの時点で入った変更なのか追いやすくなります。

---

## PR #1625: マイページの参加イベント一覧にページネーションを実装

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1625
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `base/src/stores/orderList.ts`
- **行番号:** 39
- **投稿日時:** 2026/1/2 16:08:33

**コメント内容:**

> 言ってることは正しい。
> せっかく重要な指摘をしてくれているので握りつぶさない。
> ただ、他の pagenationExecutor を使っているもの全てに関わるので別イシューで対応するのが良い

---

### コメント 2

- **ファイル:** `user/src/pages/u/[userId].vue`
- **行番号:** 202
- **投稿日時:** 2026/1/2 16:07:10

**コメント内容:**

> これだと初期ロード時に何も表示されないので `totalCount ?? Number.MAX_SAFE_INTEGER` の方がよい。
> ただ、他にもこの書き方をしているところがあるので、別チケットで対応するのも可。

---

### コメント 3

- **ファイル:** `base/src/stores/userOrderList.ts`
- **投稿日時:** 2026/1/2 15:58:40

**コメント内容:**

> admin での order リストなど、他にも流用する可能性が高いので filter 固定にするのはNG。
> 後で改修するのが大変なので。簡単に汎用的にできるところは汎用化しておく。

---

## PR #1601: カート画面のメニュー個数調整機能（+ボタン/-ボタン）の実装

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1601
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `base/src/stores/event.ts`
- **投稿日時:** 2025/12/31 15:51:09

**コメント内容:**

> せっかく common の apis も書いているので、base の apis も定義してください。

---

### コメント 2

- **ファイル:** `functions/default/src/orders.ts`
- **投稿日時:** 2025/12/31 15:49:06

**コメント内容:**

> Copilot の言うとおり count は常に 1 以上で固定されているので filteredMenus.length === 0 になることはありえない。
> 

---

## PR #1654: 郵便番号位置情報取得エラーの処理を追加

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1654
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `admin/src/pages/shop.vue`
- **投稿日時:** 2025/12/29 13:58:11

**コメント内容:**

> 恐らく、
> 既に 「東京都千代田区神田練塀町2-1-4 xxxビル230」という住所が設定されている場合に、再度 「1010022」と入力した時の挙動について言っています。
> ほぼありえないとは思いますが、これでこれまで書いた住所が消えると「何で？」と思うユーザーはいるかとは思います。

---

### コメント 2

- **ファイル:** `admin/src/pages/shop.vue`
- **投稿日時:** 2025/12/29 13:38:43

**コメント内容:**

> notification はモーダルではありません。
> 誤ったコメントは誤解を招きます。

---

### コメント 3

- **ファイル:** `admin/src/pages/shop.vue`
- **投稿日時:** 2025/12/29 13:09:42

**コメント内容:**

> 不要
> postalcode 自体がローカル変数なので。（正確にはパラメータ変数は再代入可能な let に近いので const で受ける意味はあるが、その場合は関数の入口直後で行う）
> 加えて、 `shop.value == null` も不要。以下のように書くことで、余計な `as string` を省ける。（as はなるべく使わない）
> 
> ```
> watchDebounced(
>   () => shop.value?.shop_postcode,
>   async (requestPostalCode) => {
>     if (requestPostalCode == null) {
>       return
>     }
> ```

---

### コメント 4

- **ファイル:** `admin/src/pages/shop.vue`
- **投稿日時:** 2025/12/29 13:09:38

**コメント内容:**

> validatedPostalCode.value = null
> をあちこちに書いてあるのはバッドプラクティス
> 基本的には最初に null にしておいて、成功したときだけ上書きする。
> 必ず入れる時は finally に入力をまとめるのと同じ理由。
> 
> （現在の仕様だと一瞬、緯度経度が消えるが、本来はローディングなどにするほうがよい。ただ、多分見えないのでとりあえずはOKか）
> 
> 加えて latitude, longitude も空文字にしておかないと、成功したときの値がのこってしまう。
> つまり、以下を最初の一回だけ書いて、成功時にだけ値を入力する。
> ```
>         validatedPostalCode.value = null
>       shop.value.shop_address_latitude = undefined
>       shop.value.shop_address_longitude = undefined
> ```
> ```
> finally {
>    if (validatedPostalCode.value == null) {
>           shop.value.shop_postcode = ''
>       shop.value.shop_address = ''
>    }
> }
> ```
> 

---

## PR #1622: メール送信機能の不要なフォールバック処理を削除

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1622
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `common/src/utils/datetime.ts`
- **投稿日時:** 2025/12/29 12:33:51

**コメント内容:**

> DateTime ではなく number を返すように。（別チケットにしたほうが良いが、PR としては同じで良い）
> インターフェースはなるべく揃える。（この utitily は `number` (EpochTime) と `string` を変換する）もし例外を設ける場合は必ずコメントする。
> 
> legacy から default に移行する時に入ったバグだと思われる。まだ使用されていないので発見されなかった。
> こういうのを発見しやすくなるので、戻り値の型を書くのは正解。

---

### コメント 2

- **ファイル:** `functions/default/src/orderDeadlineMail.ts`
- **行番号:** 152
- **投稿日時:** 2025/12/27 18:52:06

**コメント内容:**

> 元のコミットに全く関係ない修正

---

### コメント 3

- **ファイル:** `functions/default/src/orderDeadlineMail.ts`
- **行番号:** 110
- **投稿日時:** 2025/12/27 18:51:55

**コメント内容:**

> 元のコミットに全く関係ない修正

---

### コメント 4

- **ファイル:** `functions/default/src/orderDeadlineMail.ts`
- **行番号:** 45
- **投稿日時:** 2025/12/27 18:50:03

**コメント内容:**

> 元のコミットに全く関係ない修正
> ちょっとしたタイポ修正等なら紛れ込ませることもあるが、型の修正のような重要なものを混ぜるべきではない。

---

## PR #1606: 飲食店向け注文締切メールに主催者情報が足りていない不具合を修正

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1606
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `functions/default/src/orderDeadlineMail.ts`
- **行番号:** 50
- **投稿日時:** 2025/12/26 12:28:51

**コメント内容:**

> ちょっと言っていることが噛み合っていないです。
> まず、 Event オブジェクトで string に固定されているフィールドを `||` で再デフォルト化すべきではありません。仮にするとしても `??` ですが、ここではしてはいけません。
> また、 `event.event_place` も同様です。
> 
> Copilot の言っているのは DbEvent スキーマの方なので、こことは関係ありませんが、別件として、スキーマの `optional` を取っておくべきというのは正しいです。
> 
> 

---

## PR #1611: 管理者招待URL 取得フローの改善

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1611
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `user/src/router/index.ts`
- **投稿日時:** 2025/12/23 22:50:36

**コメント内容:**

> && を使う。不要な if の入れ子は混乱のもと

---

### コメント 2

- **ファイル:** `base/src/components/pages/c/[communityId]/invites.vue`
- **投稿日時:** 2025/12/23 22:46:16

**コメント内容:**

> isProcessing, isCompleted はリアクティブである必要はない（やってはいけない）
> 

---

## PR #1587: Xプロフィール画像取得失敗時にユーザー登録が500で落ちないようエラーハンドリングを改善

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1587
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `functions/default/src/user.ts`
- **投稿日時:** 2025/12/20 18:30:05

**コメント内容:**

> fetchXXXImage でインターフェースを揃えているのは共通に扱えるようにするためなので、個々で try catch する必要はないし冗長。
> また、 `blob = null` は冗長。
> （冗長ということは何か意味があるのかもと誤解を生む）

---

### コメント 2

- **ファイル:** `common/src/utils/user.ts`
- **投稿日時:** 2025/12/20 13:13:22

**コメント内容:**

> null と Error を投げるのが別途定義されているので、このように修正するのは NG。
> fetchTwitterImage を使用しているところで catch するように修正する。
> もしくは fetchFacebookImage を含めてエラーハンドリングの定義を修正する。

---

### コメント 3

- **ファイル:** `functions/default/src/user.ts`
- **投稿日時:** 2025/12/20 13:10:38

**コメント内容:**

> 空文字の時に startsWith が true になることはないので冗長。
> 無駄な判定は何か意味があるのか探らなければいけなくなる。

---

## PR #1561: PartnerShopのスキーマに shop_timeのnumber型とstring型の型変換を追加

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1561
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `common/src/schemas/PartnerShop.ts`
- **投稿日時:** 2025/12/11 13:26:14

**コメント内容:**

> codex も copilot も指摘していますが、タイムゾーンが適切にハンドリングされないので、functions ではこの実装は NG です。
> 基本的に（ブラウザであっても）独自の日付文字列変換は問題が多いので避けるべきです。
> luxon を使用してください。

---

### コメント 2

- **ファイル:** `common/src/schemas/PartnerShop.ts`
- **投稿日時:** 2025/12/11 13:21:35

**コメント内容:**

> App にかける必要はありません。
> batch 処理しない予定ならあっても良いですが、その場合、「number, string どっちが DB に保存されていても良しとする」という方針になります。ある一定の規模以上になるとそういう運用も必要になってきますが、一般的に後方互換性を維持すると一気に運用が難しくなるので避けられるなら避けるべきです。

---

## PR #1518: アプリ内ログインでコピーする際、イベントページのリダイレクトがなくなる

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1518
- **ステータス:** closed
- **作成者:** kokufu

### コメント 1

- **ファイル:** `user/src/pages/inapp-login.vue`
- **行番号:** 13
- **投稿日時:** 2025/12/9 21:40:38

**コメント内容:**

> コメントにも書きましたが、 afterEach の方が先に呼ばれるので to.path=`/login` の afterEach がまず呼ばれます。その時点で セッションストレージに保存されます。
> その後、上記の beforeEach が呼ばれ `to.path === '/login' && isInApp` が処理されるてリダイレクトされるので、再度 afterEach が呼ばれて無駄な処理が走ります。大した問題ではありませんが。

---

### コメント 2

- **ファイル:** `user/src/router/index.ts`
- **行番号:** 45
- **投稿日時:** 2025/12/9 21:28:49

**コメント内容:**

> この修正はいらないです。 inapp-login を直接開く routing が存在しない、かつ '/login' を経由した時点で保存されているからです。
> あっても害はないはずですが。
> 
> なお、これとセッションストレージから削除しないようにする修正は全く関係ないので別コミットにすべきです。

---

### コメント 3

- **ファイル:** `user/src/pages/inapp-login.vue`
- **行番号:** 13
- **投稿日時:** 2025/12/9 13:40:14

**コメント内容:**

> beforeEach より afterEach の方が先に呼ばれるため、 setRedirectPath は `/login` にアクセスした時点で呼ばれます。

---

## PR #1547: 店舗設定画面の修正（営業時間・配送距離と個数のバリデーション イベントURLの修正）

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1547
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `admin/src/pages/shop.vue`
- **行番号:** 43
- **投稿日時:** 2025/12/9 21:03:30

**コメント内容:**

> これは絶対にやってはいけない変更です。
> sortable value に文字列を使うのは9割型間違いだと認識してください。
> そもそも DB に文字列で保存されているのが間違いなのですが、そういった DB のレガシーな事情を反映させるのなら、 zod の transform を使うべきです。
> 
> 

---

## PR #1543: 店舗管理画面 メニュー設定の不具合修正

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1543
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `admin/src/components/MenuEditCard.vue`
- **投稿日時:** 2025/12/9 20:08:01

**コメント内容:**

> 細かい話ですが、 Vue のバージョンが上がって以下のように書けるようになったので、関連する箇所を修正する場合は合わせて直していくことをおすすめします。
> ```
> defineEmits<{
>   save: [menu: BokudeliPartnerMenu, file: File | null]
> }>()
> ```
> 

---

### コメント 2

- **ファイル:** `common/src/schemas/PartnerMenu.ts`
- **投稿日時:** 2025/12/9 19:59:54

**コメント内容:**

> Not optional

---

### コメント 3

- **ファイル:** `common/src/schemas/PartnerMenu.ts`
- **投稿日時:** 2025/12/9 19:59:18

**コメント内容:**

> optional ではなく 単純な nullabale で default null

---

### コメント 4

- **ファイル:** `common/src/schemas/PartnerMenu.ts`
- **投稿日時:** 2025/12/9 19:58:41

**コメント内容:**

> `?` はいりません。

---

### コメント 5

- **ファイル:** `common/src/schemas/firebase/index.ts`
- **投稿日時:** 2025/12/9 19:57:25

**コメント内容:**

> こういうのは format check にひっかかります。
> エディターのオートフォーマットを有効にしておくことをお勧めします。

---

### コメント 6

- **ファイル:** `common/src/schemas/firebase/index.ts`
- **投稿日時:** 2025/12/8 21:44:52

**コメント内容:**

> NonEmptyString は 空文字をはじくためのもので、NonEmptyTimestamp という名称はイマイチです。
> また、Timestamp は本来一度設定したら、消すことは無いのが原則ですが、これは例外的なフィールドなので、まさに `nullable` を使うべき典型かと思います。
> このような複雑な Schema を定義するのではなく、 `nullable` を検討すべきです。

---

## PR #1492: functions/default/src/rejectOrderMail.ts で予約変更メールが送信されない

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1492
- **ステータス:** closed
- **作成者:** kokufu

### コメント 1

- **ファイル:** `functions/default/src/rejectOrderMail.ts`
- **行番号:** 74
- **投稿日時:** 2025/12/5 22:17:52

**コメント内容:**

> Right, but it's an indivisual bug.
> I made a new bug issue #1507 

---

## PR #1495: email のないアカウントで pass-code 認証が必要

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1495
- **ステータス:** closed
- **作成者:** kokufu

### コメント 1

- **ファイル:** `user/src/pages/pass-code.vue`
- **行番号:** 63
- **投稿日時:** 2025/12/4 21:49:56

**コメント内容:**

> `personalInformation.user_email` is changed in the CloudRun function `confirmEmailChange`, so it's not mandatory to handle it. However, it allows us to reflect the change rapiddly, so I will change it.

---

## PR #1472: メアドなしユーザーのメールアドレス登録の不具合

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1472
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `base/src/stores/currentUser.ts`
- **投稿日時:** 2025/11/29 13:22:06

**コメント内容:**

> codex の指摘のとおり、消してはいけません。

---

### コメント 2

- **ファイル:** `common/src/schemas/UserPersonalInformation.ts`
- **投稿日時:** 2025/11/27 18:03:47

**コメント内容:**

> `.optional()` は不要です

---

## PR #1232: ショップリスト・ショップページの実装

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1232
- **ステータス:** open
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `user/src/pages/shoplist/index.vue`
- **行番号:** 16
- **投稿日時:** 2025/11/27 18:38:39

**コメント内容:**

> このコメントは自明なので書く必要はないのでは？
> これを書くのであれば全ての store を使用している view に書いておかなければならない。

---

### コメント 2

- **ファイル:** `base/src/components/EventMenuList.vue`
- **行番号:** 9
- **投稿日時:** 2025/11/27 18:32:25

**コメント内容:**

> `undefined` 不要
> また、細かいことですが、 component にはビジネスロジックを持ち込まない方がよいです。
> `canOrder` や `showOrderButton` などにする方が良いです。
> 更にいうと、 slot に分離しても良いです。

---

### コメント 3

- **ファイル:** `base/src/components/ShopCard.vue`
- **行番号:** 4
- **投稿日時:** 2025/11/27 18:25:09

**コメント内容:**

> これを base に書くのは NG

---

### コメント 4

- **ファイル:** `base/src/stores/partnerList.ts`
- **行番号:** 44
- **投稿日時:** 2025/11/27 18:24:45

**コメント内容:**

> 各 type を明示的に書くこの書き方は古いので新規で書くべきではありません。 `banner.ts` などを参考にしてください。
> 
> 

---

## PR #1400: #806 #1246 #829 メール追加対応

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1400
- **ステータス:** closed
- **作成者:** yokochie

### コメント 1

- **ファイル:** `functions/default/src/utils/image.ts`
- **投稿日時:** 2025/11/19 21:57:17

**コメント内容:**

> Sizes の定義が functions と common の両方にあるのはイマイチなので、 `getUserImageUrl` も common へ移動して良いと思います。

---

### コメント 2

- **ファイル:** `common/src/utils/buildThumbnailsLinks.ts`
- **投稿日時:** 2025/11/19 21:53:43

**コメント内容:**

> この書き方だとエミュレーターで動作させるときに動かなくなってしまうので、`buildThumbnailsLinks` の第3引数に firebaseStorageBaseUrl を取るようにしてください。
> functions の方も、 utils/urls.ts 内などに FIREBASE_STORAGE_BASE_URL を定義するなどして、一括管理するようにしてください。

---

### コメント 3

- **ファイル:** `functions/default/src/utils/image.ts`
- **行番号:** 1
- **投稿日時:** 2025/11/15 13:48:36

**コメント内容:**

> buildThumbnailsLinks は base にあるもののコピーで重複管理になるのでここに書かないでください。
> base の buildThumbnailsLinks を common に移動し、使用するように変更してください。
> また、getUserImageUrl も common 管理でよいはずです。

---

### コメント 4

- **ファイル:** `functions/default/src/utils/mail.ts`
- **投稿日時:** 2025/11/15 13:45:25

**コメント内容:**

> TypeScript が正しく動作していれば community_id が nullable になることはありません。
> また、フォールバックとして community_account を使うと「想定外に動いてしまう」可能性があり、別のバグを誘発するので、この行は必要ありません。

---

### コメント 5

- **ファイル:** `functions/default/src/orderCompletionMail.ts`
- **投稿日時:** 2025/11/15 13:39:38

**コメント内容:**

> console.log は lint で弾かれるので消すか、 info 等に変更してください

---

## PR #1437: 管理者招待URLアクセス時のログイン画面とリダイレクト

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1437
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `base/src/components/pages/c/[communityId]/invites.vue`
- **投稿日時:** 2025/11/17 17:36:49

**コメント内容:**

> ここも同じです。 base にパスを書くということが問題です。

---

### コメント 2

- **ファイル:** `base/src/components/pages/c/[communityId]/invites.vue`
- **投稿日時:** 2025/11/17 17:35:47

**コメント内容:**

> Warning を消すためだと思いますが、こういうことではありません。
> emit 等を用いて、コンポーネントを汎化する必要があるということです。
> また、base の components/pages は deprecated であり、まずはこれを直すのが先決です。
> 中途半端に Warning を消去すると、修正の機会を失うので、このような修正は行うべきではありません。（たとえ今回は根本的に直さないとしても）

---

## PR #1416: 「コミュニティに参加する」「コミュニティを退会する」ボタン

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1416
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `base/src/stores/community.ts`
- **投稿日時:** 2025/11/17 17:29:28

**コメント内容:**

> 不要です

---

### コメント 2

- **ファイル:** `common/src/schemas/Community.ts`
- **投稿日時:** 2025/11/17 17:27:03

**コメント内容:**

> community_num_members はあくまでソート用で functions で処理されるもので、ここに加えると不整合がおこるので、追加してはいけません。
> なお、この旨をコメントとして書いておくほうがよいかもしれません。

---

### コメント 3

- **ファイル:** `base/src/composable/useCommunityMemberFlags.ts`
- **投稿日時:** 2025/11/17 17:22:34

**コメント内容:**

> 今回のケースでは問題にならないかもしれませんが、Sore は基本的に各 Composable に紐付いているべきなので、 CommunityStore は中で再取得すべきです。
> また、同様の理由で ComputedRef ではなく、currentUserStore を中で取得する方が良いはずです。

---

### コメント 4

- **ファイル:** `base/src/components/CommunityMembershipButton.vue`
- **投稿日時:** 2025/11/11 16:51:24

**コメント内容:**

> [isMember: boolean] では？

---

## PR #1415: #1414 any型はlintが通らずデプロイできないので修正

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1415
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `functions/default/src/stores/event.ts`
- **投稿日時:** 2025/11/15 14:24:13

**コメント内容:**

> status が RawEventStatusType で保証されているので、このチェックは必要ありません。
> 

---

## PR #1424: 店舗管理画面UI修正

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1424
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `admin/src/pages/order/[eventId].vue`
- **行番号:** 91
- **投稿日時:** 2025/11/15 14:18:30

**コメント内容:**

> computed で処理すべきです

---

## PR #1374: 請求書払い手数料 +10% 対応

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1374
- **ステータス:** closed
- **作成者:** kokufu

### コメント 1

- **ファイル:** `functions/legacy/src/eventBillInvoice.js`
- **投稿日時:** 2025/10/4 13:27:56

**コメント内容:**

> ありがとございます。直しました。

---

## PR #1199: コミュニティ新規作成時のランダム値（カバー画像 / アイコン画像 / コミュニテイURL）

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1199
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `base/src/components/CommunityEdit.vue`
- **投稿日時:** 2025/6/23 12:54:32

**コメント内容:**

> これを CommunityEdit に直接書くのはあまり良くないです。CommunityIcon
> Random, CommunityCoverRandom のようなコンポーネントに分離してください。

---

## PR #1202: コミュニティ情報を扱うメール送信関数のdefault 対応

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1202
- **ステータス:** closed
- **作成者:** yokochie

### コメント 1

- **ファイル:** `functions/default/src/communityMail.ts`
- **行番号:** 97
- **投稿日時:** 2025/6/23 12:50:24

**コメント内容:**

> ```
> {
>     secrets: ['SENDGRID_API_KEY'],
>   }
> ```
> がないとメールが送れません。

---

### コメント 2

- **ファイル:** `functions/default/src/communityMail.ts`
- **行番号:** 85
- **投稿日時:** 2025/6/23 12:50:17

**コメント内容:**

> ```
> {
>     secrets: ['SENDGRID_API_KEY'],
>   }
> ```
> がないとメールが送れません。

---

## PR #1201: テスト送信の不具合修正

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1201
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `base/src/components/LetterEdit.vue`
- **投稿日時:** 2025/6/23 12:44:08

**コメント内容:**

> 将来的なことも考慮に入れると、 `addLetter` を以下のように書き換える方が良いと思います。
> ```ts
>       const addLetter = async (data: Letter) => {
>         const newLetterRef = doc(await getLetterRef())
>         const newData = {
>           ...data,
>           letter_id: newLetterRef.id,
>           updated_at: Timestamp.now(),
>         }
>         await setDoc(newLetterRef, newData)
>         return newData
>       }
> ```

---

## PR #1189: レタータイプがイベントの時、0人では配信できないようにする

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1189
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `base/src/components/LetterEdit.vue`
- **投稿日時:** 2025/6/15 23:35:27

**コメント内容:**

> if ステートメントを 中括弧なしで書いてはいけません。Lint 通らないはずです。

---

## PR #948: バナー機能

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/948
- **ステータス:** closed
- **作成者:** kokufu

### コメント 1

- **ファイル:** `base/src/components/Banners.vue`
- **投稿日時:** 2025/6/15 23:25:04

**コメント内容:**

> FIRESTORE_LOADING のときは一般的には `false` では？

---

## PR #1138: OGP Description からHTMLタグを削除

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1138
- **ステータス:** closed
- **作成者:** yokochie

### コメント 1

- **ファイル:** `functions/default/src/index.ts`
- **投稿日時:** 2025/6/10 18:03:07

**コメント内容:**

> ワンライナーのメリットを殺してしまっています。
> 以下のように書きます
> ```
> export const { getInvitationUrlForCommunityManager, acceptInvitationForCommunityManager, handleOgpRequest } = Object.assign(
>   {},
>   ...(await Promise.all([import('./communityManager.js'), import('ogpRequest.js')])),
> )
> ```

---

## PR #1150: Dev/letter fix

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1150
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `user/src/componentsLocal/manage/event/letter.vue`
- **投稿日時:** 2025/6/5 20:48:28

**コメント内容:**

> falsy

---

### コメント 2

- **ファイル:** `user/src/componentsLocal/manage/community/letter.vue`
- **投稿日時:** 2025/6/5 20:48:09

**コメント内容:**

> boolean で無いものに `!` をつけると falsy チェックになってしまうので != null に変更してください

---

## PR #1087: 【飲食店】注文期限の直前化

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1087
- **ステータス:** closed
- **作成者:** yokochie

### コメント 1

- **ファイル:** `base/src/components/eventcreate/EventShop.vue`
- **行番号:** 35
- **投稿日時:** 2025/5/29 20:59:11

**コメント内容:**

> これも本来は computed を使いたいところですが、今のデータ構造だと仕方ないですね。
> common 等で計算ロジックを統一すると computed も使いやすくなるのですが、今のところはこれで。

---

### コメント 2

- **ファイル:** `admin/src/pages/shop.vue`
- **投稿日時:** 2025/5/29 20:57:54

**コメント内容:**

> ちゃんとロジック見れてないのですが、 `onDeadlineDaysBeforeChange` のようなイベントドリブンにするより、 computed を用いたリアクティブの方が安定動作すると思うのですが、あえて変更した理由ってありますか？
> 

---

## PR #1033: バナー機能

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/1033
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `user/src/assets/images/banner/banner_line.gif`
- **行番号:** 1
- **投稿日時:** 2025/5/6 17:48:52

**コメント内容:**

> こういったアセットを修正するたびにコードの修正と PR 確認、リリースが発生するようではオペレーションがまわらなくなります。全てのアセットは サーバー側で管理するようにしてください。
> 
> Top もそうですが、アセットをどこで管理するのかがシッチャカメッチャカになると余計な分岐が増えてバグの可能性が上がります。

---

### コメント 2

- **ファイル:** `base/src/components/Carousel.vue`
- **行番号:** 81
- **投稿日時:** 2025/5/6 17:44:55

**コメント内容:**

> 共通コンポーネントの中でこういう分岐をし始めると、最終的に収集がつかなくなります。
> 全てを firestore で管理するように変更してください。
> あと、細かい話ですが、ここでは `props` は不要です。

---

### コメント 3

- **ファイル:** `base/src/schemes/carousel.ts`
- **行番号:** 1
- **投稿日時:** 2025/5/6 17:43:07

**コメント内容:**

> 細かい話ですが、class 名はアッパーキャメルケースで書くのが一般的です。
> このプロジェクトではないですが、使い方を間違えてしまうケース（new をつけないで実体化してしまうなど）を見たことはちょくちょくあります。なので、なるべくデファクトスタンダードに従っておくのは大切です。
> これからは、AI 等が勘違いしたりケースもあるかと。

---

## PR #995: 主催者画面 チラシ機能 backend

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/995
- **ステータス:** closed
- **作成者:** Michikoo29avril

### コメント 1

- **ファイル:** `functions/shokujii-pdf/src/flyer.js`
- **投稿日時:** 2025/4/22 19:32:15

**コメント内容:**

> index 0 で固定してしまうのは NG です。
> 後でいくらでも変わる可能性があるので。（今の所動いていたけど、全然関係ない修正で突然動かなくなるのが最も怖いバグです）
> 別途 EVENT_HOST を定義しなおしてください

---

## PR #982: 人事図書館向け 参加者非表示機能

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/982
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `base/src/components/EventMemberList.vue`
- **投稿日時:** 2025/4/18 21:01:47

**コメント内容:**

> null or undefined のときは？

---

### コメント 2

- **ファイル:** `base/src/components/EventMemberList.vue`
- **投稿日時:** 2025/4/18 20:54:18

**コメント内容:**

> i18n 対応

---

### コメント 3

- **ファイル:** `base/src/components/CommunityBioPanel.vue`
- **行番号:** 34
- **投稿日時:** 2025/4/18 20:51:26

**コメント内容:**

> null の場合は？

---

### コメント 4

- **ファイル:** `base/src/components/EventDetailsCard.vue`
- **投稿日時:** 2025/4/18 20:50:31

**コメント内容:**

> isShowMember が booleaen なので冗長

---

### コメント 5

- **ファイル:** `base/src/components/EventDetailsCard.vue`
- **投稿日時:** 2025/4/18 20:49:50

**コメント内容:**

> falsy 対応できていない

---

### コメント 6

- **ファイル:** `base/src/components/EventDetailsCard.vue`
- **行番号:** 100
- **投稿日時:** 2025/4/18 20:47:05

**コメント内容:**

> null の場合は？

---

## PR #936: イベント編集画面の修正開発

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/936
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `base/src/components/eventcreate/EventBasicInfoCard.vue`
- **投稿日時:** 2025/4/14 22:09:03

**コメント内容:**

> var は NG

---

### コメント 2

- **ファイル:** `base/src/components/eventcreate/EventShopNotice.vue`
- **行番号:** 1
- **投稿日時:** 2025/4/14 22:06:53

**コメント内容:**

> このケースだと動いてしまうのですが、リアクティブではない書き方なので NG です。
> また、こういった初期化は各ファイルではなくモデルが行うべきです。
> これまでは、とりあえず動かすの優先でやってきましたが、この手を放置したことによる問題が増えてきているため、モデルでやるようにしてください。

---

## PR #925: 店舗管理画面の注文一覧にもアイコン表示 #856

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/925
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `admin/src/pages/order/[eventId].vue`
- **投稿日時:** 2025/4/8 21:12:34

**コメント内容:**

> これは機能していない。何か別の意図？

---

## PR #872: ハッシュタグ機能 の改善

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/872
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `base/src/components/eventcreate/EventDetailCard.vue`
- **投稿日時:** 2025/3/25 18:01:37

**コメント内容:**

> ここで `as string` は NG

---

### コメント 2

- **ファイル:** `base/src/utils/shareSnsButton.ts`
- **投稿日時:** 2025/3/24 18:00:35

**コメント内容:**

> 大した問題ではないが、`+` でつなげる必要はない。なぜ「詳細」だけ書き方を変えている？

---

### コメント 3

- **ファイル:** `base/src/utils/shareSnsButton.ts`
- **投稿日時:** 2025/3/24 17:59:48

**コメント内容:**

> falsy の比較

---

### コメント 4

- **ファイル:** `base/src/components/UserSuccessJoinEventDialog.vue`
- **投稿日時:** 2025/3/24 17:55:15

**コメント内容:**

> falsy の比較

---

### コメント 5

- **ファイル:** `base/src/components/EventDetailsCard.vue`
- **投稿日時:** 2025/3/24 17:54:57

**コメント内容:**

> falsy の比較

---

### コメント 6

- **ファイル:** `base/src/components/eventcreate/EventDetailCard.vue`
- **投稿日時:** 2025/3/24 17:44:23

**コメント内容:**

> falsy の比較

---

### コメント 7

- **ファイル:** `base/src/components/eventcreate/EventDetailCard.vue`
- **投稿日時:** 2025/3/24 17:43:58

**コメント内容:**

> 不要なインポート

---

### コメント 8

- **ファイル:** `base/src/components/CommunityEdit.vue`
- **投稿日時:** 2025/3/24 17:36:06

**コメント内容:**

> 不要な import

---

### コメント 9

- **ファイル:** `base/src/schemes/bokudeliEvent.ts`
- **行番号:** 1
- **投稿日時:** 2025/3/24 17:33:10

**コメント内容:**

> このファイルに有効な変更はない

---

### コメント 10

- **ファイル:** `base/src/components/EventEdit.vue`
- **行番号:** 1
- **投稿日時:** 2025/3/24 17:32:15

**コメント内容:**

> このファイルに有効な変更はない

---

### コメント 11

- **ファイル:** `base/src/components/eventcreate/EventDetailCard.vue`
- **投稿日時:** 2025/3/18 17:35:25

**コメント内容:**

> community と同様、watch は駄目

---

### コメント 12

- **ファイル:** `base/src/components/CommunityEdit.vue`
- **行番号:** 28
- **投稿日時:** 2025/3/18 17:23:31

**コメント内容:**

> 状況によっては無限ループになる。以下のように書く。
> ```
> // ハッシュタグの値を監視してトリムする
> const community_sns_hash_tag= computed({
>   get: () => community.value.community_sns_hash_tag,
>   set: (value) => {
>     community.value.community_sns_hash_tag = value
>   }
> })
> ```  

---

### コメント 13

- **ファイル:** `base/src/utils/hashTag.ts`
- **投稿日時:** 2025/3/18 17:13:34

**コメント内容:**

> この書き方は falsy 全てにに反応してしまうため、バッドプラクティスです。
> string の場合はまだ動くケースが多いのですが、number では誤動作を誘発します。本来全体で禁止してもよいのですが、過去資産でビルドが通らなくなるため残してあります。新規で書く場合は正しく比較文を書くようにしてください。
> 

---

## PR #868: 主催者支払い設定

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/868
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `base/src/schemes/bokudeliEvent.ts`
- **投稿日時:** 2025/3/18 17:00:06

**コメント内容:**

> i18n に移行する

---

### コメント 2

- **ファイル:** `base/src/components/eventcreate/EventDetailCard.vue`
- **投稿日時:** 2025/3/18 16:59:24

**コメント内容:**

> props と model を同時に定義するのは NG

---

## PR #716: Dev/manager 250207

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/716
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `user/src/pages/manage/community/index.vue`
- **投稿日時:** 2025/2/8 19:33:38

**コメント内容:**

> `communityListStore &&` はいらないです

---

## PR #719: Dev/top carousel

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/719
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `user/src/pages/index.vue`
- **投稿日時:** 2025/2/8 19:21:39

**コメント内容:**

> , mdiChevronLeft, mdiChevronRight
> は使用されていません。

---

## PR #640: [functions]user_email が空の場合メールを送らないように修正

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/640
- **ステータス:** closed
- **作成者:** yokochie

### コメント 1

- **ファイル:** `functions/sendgrid-mail.js`
- **投稿日時:** 2025/1/16 19:54:32

**コメント内容:**

> 恐らく #639 の名残かと思います。

---

## PR #237: Dev/community contact

- **URL:** https://github.com/nijuniinc/bokudeli-event-new/pull/237
- **ステータス:** closed
- **作成者:** nijuni-yasu

### コメント 1

- **ファイル:** `functions/functions/sendgrid-mail.js`
- **行番号:** 429
- **投稿日時:** 2023/12/26 19:47:39

**コメント内容:**

> @nijuni-yasu
> 動作確認してないですが、おそらくそれで大丈夫です。

---

### コメント 2

- **ファイル:** `functions/functions/sendgrid-mail.js`
- **行番号:** 429
- **投稿日時:** 2023/12/26 18:12:22

**コメント内容:**

> onCall は Authentication への問い合わせは自動でやってくれますが、それによって弾くかどうか等の判断は自分でしなければなりません。
> 以下のような感じ。
> ```
> if (context.auth == null) {
>   return
> }
> ```
> 

---

