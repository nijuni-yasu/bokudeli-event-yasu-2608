<template>
  <v-container
    id="regular-tables"
    fluid
    tag="section"
  >
    <base-material-card
      inline
      icon="mdi-heart"
      title="shokujiiについて"
      class="px-5 py-3 my-10"
    >
      <div class="ma-10 display-1" style="line-height: 2.0;">
        2024年2月22日をもちまして
        「コミュニティフードデリバリーぼくデリ」は<b>「食事でつながるshokujii」</b>に生まれ変わりました。<br>
        「孤食を減らし、団欒を増やす」をミッションに掲げ、人と人を食事でつないでいくサービスづくりに、邁進してまいります。<br>
        変わらぬご愛顧をいただきますようお願いいたします。<br>
        <br>
        <a :href="'https://shokujii.jp/'" target="_blank">shokujii公式サイト</a><br>
        <a :href="'https://about.shokujii.jp/'" target="_blank">shokujiiって？</a><br>
      </div>
    </base-material-card>

    <base-material-card
      inline
      icon="mdi-check-outline"
      title="店舗公開 TODOリスト"
      class="px-5 py-3 my-10"
    >
      <v-simple-table>
        <thead>
          <tr>
            <th class="primary--text pa-0">
              STEP
            </th>
            <th class="primary--text">
              TODO
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>STEP0</td>
            <td
              class="py-5"
            >
              <a
                :href="'https://drive.google.com/drive/folders/1R40T-y5WqHRZu5ANILIQxgagqoBTlgSr?usp=sharing'"
                target="_blank"
              >
                店舗マニュアル
              </a>
              を一読し「設定方法」や「注文受付」「配送」の流れをチェック👀✅
            </td>
          </tr>
          <tr>
            <td>STEP1</td>
            <td
              class="py-5"
            >
              <router-link to="/shop">
                店舗設定画面
              </router-link>
              で「店舗情報」「最小注文個数」「配送距離」「営業曜日・時間」「お届け時間」「メールアドレス」などを入力して、店舗設定をしてください✍
            </td>
          </tr>
          <tr>
            <td>STEP2</td>
            <td
              class="py-5"
            >
              <router-link to="/menu">
                メニュー設定画面
              </router-link>
              で「メニュー名称」「メニュー説明文」「メニュー価格」「メニュー画像」を入力して追加🍔🍛🍜<br>
            </td>
          </tr>
          <tr>
            <td>STEP3</td>
            <td
              class="py-5"
            >
              店舗設定 と メニュー設定 が完了したら「開店設定」で「開店」に設定してください。<br>
              「開店設定」にしていただくと、サポートチームにメールにて通知が入ります。<br>
              内容確認後、公開完了！お客さまからのご注文をお待ちください。
            </td>
          </tr>
          <tr>
            <td />
            <td
              class="py-5"
            >
              ご不明点などありましたらメールにてお気軽にご連絡ください👍<br>
              （メールアドレス : support@nijuni.jp ）
            </td>
          </tr>
        </tbody>
      </v-simple-table>
    </base-material-card>

    <!-- <base-material-card
      inline
      icon="mdi-note-text-outline"
      title="NEWS"
      class="px-5 py-3"
    >
      <v-simple-table>
        <thead>
          <tr>
            <th class="primary--text">
              Date
            </th>
            <th class="primary--text">
              News
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>2021/4/24</td>
            <td>
              <a
                :href="'https://www.shibuyamov.com/news/--mov-tora.html'"
                target="_blank"
              >
                コクヨ株式会社主催イベント「モヴーの虎」に出場いたしました
              </a>
            </td>
          </tr>
          <tr>
            <td>2021/2/4</td>
            <td>
              <a
                :href="'https://drive.google.com/file/d/12FS70_JLWhMqkk7DSWORvIJmewPMucK6/view'"
                target="_blank"
              >
                めざましテレビの「最新便利＆お得宅配サービス」のコーナーに出演いたしました
              </a>
            </td>
          </tr>
          <tr>
            <td>2021/1/21</td>
            <td>
              <a
                :href="'https://prtimes.jp/main/html/rd/p/000000006.000052186.html'"
                target="_blank"
              >
                グループ注文特化型フードデリバリー『ぼくデリ』をリリース
              </a>
            </td>
          </tr>
        </tbody>
      </v-simple-table>
    </base-material-card> -->
  </v-container>
</template>
