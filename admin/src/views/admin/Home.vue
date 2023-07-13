<template>
  <v-container
    id="regular-tables"
    fluid
    tag="section"
  >
    <!-- <base-v-component
      heading="Simple Tables"
      link="components/simple-tables"
    /> -->

    <base-material-card
      inline
      icon="mdi-check-outline"
      title="店舗公開 TODOリスト"
      class="px-5 py-3"
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
              を一読し、設定方法やデリバリーの流れをチェック👀✅
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
              で「店舗情報」「最小注文個数」「配送距離」「営業曜日・時間」「お届け時間」「支払方法」「サブメールアドレス」などを入力して、店舗設定を完了させてください✍
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
              ※メニューの価格は「店頭価格」「税込価格」にてお願いいたします。
            </td>
          </tr>
          <tr>
            <td>STEP3</td>
            <td
              class="py-5"
            >
              店舗設定 と メニュー設定 が完了したら
              <a
                :href="'https://line.me/R/ti/p/%40547chcok'"
                target="_blank"
              >
                サポートLINE
              </a>
              もしくはメールやお電話にてご連絡ください👍<br>
              （MAIL : support@nijuni.jp / TEL : 050-3580-5122）
            </td>
          </tr>
          <tr>
            <td>STEP4</td>
            <td
              class="py-5"
            >
              サポートスタッフから「テスト注文」を行います！<br>
              １）店舗の電話番号に「自動音声電話」が鳴るかどうか📞<br>
              ２）メールアドレス、サブメールアドレスに「注文メール」が届くかどうか📩<br>
              の2点をご確認ください。テスト注文をご確認いただきましたら店舗を公開いたします🙌
            </td>
          </tr>
          <tr>
            <td>STEP5</td>
            <td
              class="py-5"
            >
              公開後、お客さまからのご注文が入ったら<br>
              「自動音声電話」→「注文メール」→「
              <router-link to="/order">
                注文一覧画面
              </router-link>
              」にて注文内容をご確認ください。<br>
              ご注文いただいた商品を、指定のお届け先住所、指定のお届け時刻に、店舗配送にてデリバリー🚲<br>
              <br>
              ※ デリバリーの出発前に
              <a
                :href="'https://drive.google.com/drive/folders/1R40T-y5WqHRZu5ANILIQxgagqoBTlgSr?usp=sharing'"
                target="_blank"
              >
                店舗マニュアル
              </a>
              は必ずご一読くださいますようお願いいたします。<br>
              ※ 代金は商品受け渡し時に「現金」もしくは「QRコード決済」でお受け取りください💰<br>
              ※ 商品の容器に注文した方の「なまえ(ニックネーム)」を書いてください✏️<br>
              ※ 大口注文を受けましたら感謝の気持ちの「おまけ」をつけてください☺️🍱
            </td>
          </tr>
          <tr>
            <td />
            <td
              class="py-5"
            >
              ご不明点などありましたら
              <a
                :href="'https://line.me/R/ti/p/%40547chcok'"
                target="_blank"
              >
                サポートLINE
              </a>
              もしくはメールや電話にてお気軽にご連絡ください👍<br>
              （MAIL : support@nijuni.jp / TEL : 050-3580-5122）
            </td>
          </tr>
        </tbody>
      </v-simple-table>
    </base-material-card>

    <div class="py-3" />

    <base-material-card
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
          <!-- <tr>
            <td>2020/11/1</td>
            <td>DMM.makeAKIBAにてユーザーテストを開始！</td>
          </tr> -->
          <!-- <tr>
            <td>2020/9/10</td>
            <td>ニュースサイトに「△△△△△△△△」の記事が掲載されました。</td>
          </tr> -->
          <!-- <tr>
            <td>2020/10/22</td>
            <td>
              <a
                :href="'https://bokudeli.studio.design'"
                target="_blank"
              >
                ぼくデリ
              </a>
              をリリースしました！
            </td>
          </tr> -->
        </tbody>
      </v-simple-table>
    </base-material-card>
  </v-container>
</template>
