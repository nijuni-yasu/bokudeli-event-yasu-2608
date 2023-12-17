<template>
  <v-container
    id="validation-forms"
    fluid
    tag="section"
  >
    <!-- <base-v-component
      heading="Forms"
      link="components/forms"
    /> -->
    <v-row>
      <v-col cols="12">
        <validation-observer v-slot="{ handleSubmit }">
          <form @submit.prevent="handleSubmit(validateForm)">
            <base-material-card
              color="success"
              icon="mdi-storefront-outline"
              title="店舗情報"
              class="py-3 px-5"
            >
              <v-row
                align="center"
                dense
              >
                <v-col
                  class="text-right body-1 grey--text"
                  cols="3"
                >
                  店舗名
                </v-col>
                <v-col
                  cols="9"
                  sm="8"
                >
                  <validation-provider
                    v-slot="{ errors }"
                    name="店舗名"
                    rules="required"
                  >
                    <v-text-field
                      v-model="shop_name"
                      :error-messages="errors"
                    />
                  </validation-provider>
                </v-col>
              </v-row>

              <v-row
                align="center"
                dense
              >
                <v-col
                  class="text-right body-1 grey--text"
                  cols="3"
                >
                  郵便番号
                </v-col>

                <v-col
                  cols="9"
                  sm="8"
                >
                  <validation-provider
                    v-slot="{ errors }"
                    name="郵便番号"
                    rules="required|digits:7"
                  >
                    <v-text-field
                      v-model="shop_postcode"
                      :error-messages="errors"
                      @change="fetchLocation(shop_postcode)"
                    />
                    <!-- <v-text-field
                      v-else
                      v-model="shop_postcode"
                      :error-messages="errors"
                      readonly
                      filled
                      color="secondary"
                      hint="店舗住所の変更・修正はサポートチームまでご連絡ください。"
                    /> -->
                  </validation-provider>
                </v-col>
              </v-row>

              <v-row
                align="center"
                dense
              >
                <v-col
                  class="text-right body-1 grey--text"
                  cols="3"
                >
                  住所
                </v-col>
                <v-col
                  cols="9"
                  sm="8"
                >
                  <validation-provider
                    v-slot="{ errors }"
                    name="店舗住所"
                    rules="required"
                  >
                    <v-text-field
                      v-model="shop_address"
                      :error-messages="errors"
                    />
                    <!-- <v-text-field
                      v-else
                      v-model="shop_address"
                      :error-messages="errors"
                      readonly
                      filled
                      color="secondary"
                      hint="店舗住所の変更・修正はサポートチームまでご連絡ください。"
                    /> -->
                  </validation-provider>
                </v-col>
              </v-row>

              <v-row
                align="center"
                dense
              >
                <v-col
                  class="text-right body-1 grey--text"
                  cols="3"
                >
                  電話番号
                </v-col>
                <v-col
                  cols="9"
                  sm="8"
                >
                  <validation-provider
                    v-slot="{ errors }"
                    name="電話番号"
                    rules="required|numeric"
                  >
                    <v-text-field
                      v-model="shop_phone"
                      :error-messages="errors"
                    />
                    <!-- <v-text-field
                      v-else
                      v-model="shop_phone"
                      :error-messages="errors"
                      readonly
                      filled
                      color="secondary"
                      hint="電話番号の変更・修正はサポートチームまでご連絡ください。"
                    /> -->
                  </validation-provider>
                </v-col>
              </v-row>

              <v-row
                align="center"
                dense
              >
                <v-col
                  class="text-right body-1 grey--text"
                  cols="3"
                >
                  カテゴリ
                </v-col>
                <v-col
                  cols="9"
                  sm="8"
                >
                  <validation-provider
                    v-slot="{ errors }"
                    name="カテゴリ"
                    rules="required"
                  >
                    <v-select
                      v-model="shop_genre"
                      :error-messages="errors"
                      :items="shop_genre_array"
                    />
                  </validation-provider>
                </v-col>
              </v-row>

              <v-row
                align="center"
                dense
              >
                <v-col
                  class="text-right body-1 grey--text"
                  cols="3"
                >
                  店舗紹介文
                </v-col>
                <v-col
                  cols="9"
                  sm="8"
                >
                  <validation-provider
                    v-slot="{ errors }"
                    name="店舗紹介文"
                    rules="required|max:300"
                  >
                    <v-text-field
                      v-model="shop_description"
                      :error-messages="errors"
                      hint="店舗紹介文は最大300文字までです"
                    />
                  </validation-provider>
                </v-col>
              </v-row>
              <v-row
                align="center"
                dense
              >
                <v-col
                  class="text-right body-1 grey--text"
                  cols="3"
                >
                  店舗情報URL
                </v-col>
                <v-col
                  cols="9"
                  sm="8"
                >
                  <v-text-field
                    v-model="shop_url"
                    type="url"
                    hint="店舗公式HPまたは食べログなどのURLを入力してください"
                  />
                </v-col>
              </v-row>
              <v-row
                align="center"
                dense
              >
                <v-col
                  class="text-right body-1 grey--text"
                  cols="3"
                >
                  Twitter URL
                </v-col>
                <v-col
                  cols="9"
                  sm="8"
                >
                  <v-text-field
                    v-model="shop_url_twitter"
                    type="url"
                    hint="TwitterアカウントのURLを入力してください"
                  />
                </v-col>
              </v-row>
              <v-row
                align="center"
                dense
              >
                <v-col
                  class="text-right body-1 grey--text"
                  cols="3"
                >
                  Facebook URL
                </v-col>
                <v-col
                  cols="9"
                  sm="8"
                >
                  <v-text-field
                    v-model="shop_url_facebook"
                    type="url"
                    hint="FacebookページのURLを入力してください"
                  />
                </v-col>
              </v-row>
              <v-row
                align="center"
                dense
              >
                <v-col
                  class="text-right body-1 grey--text"
                  cols="3"
                >
                  Instagram URL
                </v-col>
                <v-col
                  cols="9"
                  sm="8"
                >
                  <v-text-field
                    v-model="shop_url_instagram"
                    type="url"
                    hint="InstagramアカウントのURLを入力してください"
                  />
                </v-col>
              </v-row>
              <div class="pa-3 text-center">
                <v-btn
                  color="success"
                  default
                  type="submit"
                >
                  保存する
                </v-btn>
              </div>
            </base-material-card>
          </form>
        </validation-observer>
      </v-col>

      <v-col cols="12">
        <validation-observer v-slot="{ handleSubmit }">
          <form @submit.prevent="handleSubmit(validateForm_image)">
            <base-material-card
              color="success"
              icon="mdi-file-image-outline"
              title="店舗画像"
              class="py-3 px-5"
            >
              <v-row
                align="center"
                justify="center"
              >
                <v-col
                  cols="12"
                  sm="8"
                >
                  <v-row
                    justify="center"
                  >
                    <v-img
                      :src="shop_image_url"
                      aspect-ratio="1.5"
                      max-width="600"
                    />
                  </v-row>
                </v-col>
              </v-row>
              <v-row
                align="center"
                dense
              >
                <v-col
                  class="text-right body-1 grey--text"
                  cols="3"
                  sm="3"
                >
                  店舗画像
                </v-col>
                <v-col
                  cols="9"
                  sm="6"
                >
                  <v-file-input
                    v-model="shop_image_file"
                    accept="image/png, image/jpeg, image/bmp"
                    prepend-icon="mdi-camera"
                    hint="※画像サイズは600x450推奨です"
                    persistent-hint
                  />
                </v-col>
              </v-row>

              <div class="pa-3 text-center">
                <v-btn
                  color="success"
                  default
                  type="submit"
                >
                  保存する
                </v-btn>
              </div>
            </base-material-card>
          </form>
        </validation-observer>
      </v-col>

      <v-col cols="12">
        <validation-observer v-slot="{ handleSubmit }">
          <form @submit.prevent="handleSubmit(validateForm)">
            <base-material-card
              color="success"
              icon="mdi-earth"
              title="配送中心地"
              class="py-3 px-5"
            >
              <v-row
                align="center"
                dense
              >
                <v-col
                  class="text-right body-1 grey--text"
                  cols="2"
                  sm="3"
                  md="3"
                  lg="3"
                  xl="3"
                >
                  緯度
                </v-col>
                <v-col
                  cols="4"
                  sm="3"
                >
                  <validation-provider
                    v-slot="{ errors }"
                    name="緯度"
                  >
                    <v-text-field
                      v-model="shop_address_latitude"
                      placeholder="(例) 35.1234567"
                      readonly
                      :error-messages="errors"
                    />
                  </validation-provider>
                </v-col>
                <v-col
                  class="text-right body-1 grey--text"
                  cols="2"
                  sm="1"
                  md="1"
                  lg="1"
                  xl="1"
                >
                  経度
                </v-col>
                <v-col
                  cols="4"
                  sm="3"
                >
                  <validation-provider
                    v-slot="{ errors }"
                    name="経度"
                  >
                    <v-text-field
                      v-model="shop_address_longitude"
                      placeholder="(例) 139.1234567"
                      readonly
                      :error-messages="errors"
                    />
                  </validation-provider>
                </v-col>
              </v-row>
              <v-card-text
                class="my-3 text-center text-body-1 font-weight-light"
              >
                ※配送中心地は、店舗の郵便番号
                <span
                  class="text-h3"
                >
                  {{ shop_postcode }}
                </span>
                をもとに自動算出しています。
              </v-card-text>
            </base-material-card>
          </form>
        </validation-observer>
      </v-col>

      <v-col cols="12">
        <validation-observer v-slot="{ handleSubmit }">
          <form @submit.prevent="handleSubmit(validateForm)">
            <base-material-card
              color="success"
              icon="mdi-bicycle"
              title="配送距離＆注文最小個数"
              class="py-3 px-5"
            >
              <v-container
                v-for="(item,key) in shop_range_min_orders"
                :key="key"
                fluid
              >
                <v-row justify="center">
                  <v-col
                    class="d-flex text-right"
                    cols="12"
                    sm="1"
                  >
                    <v-text
                      class="mx-2 my-5 text-right"
                      style="color:#9E9E9E;"
                    >
                      {{ item.label }}
                    </v-text>
                  </v-col>
                  <v-col
                    class="d-flex"
                    cols="12"
                    sm="3"
                  >
                    <v-select
                      v-model="item.range"
                      :items="shop_range_array"
                      label="配送距離(半径km)"
                    />
                  </v-col>
                  <v-col
                    class="d-flex"
                    cols="12"
                    sm="3"
                  >
                    <v-select
                      v-model="item.min_orders"
                      :items="shop_min_orders_array"
                      label="注文最小個数"
                    />
                  </v-col>
                </v-row>
              </v-container>
              <v-card-text
                class="px-20 my-3 text-center text-body-1 font-weight-light"
              >
                ※「配送距離」と「注文最小個数」は複数設定することができます。<br>
                ※【設定1】5km 5個 【設定2】10km 7個 【設定3】15km 10個のように小さい値から設定してください。<br>
              </v-card-text>
              <div class="pa-3 text-center">
                <v-btn
                  color="success"
                  default
                  type="submit"
                >
                  保存する
                </v-btn>
              </div>
            </base-material-card>
          </form>
        </validation-observer>
      </v-col>

      <v-col cols="12">
        <validation-observer v-slot="{ handleSubmit }">
          <form @submit.prevent="handleSubmit(validateForm)">
            <base-material-card
              color="success"
              icon="mdi-clock-time-three-outline"
              title="営業曜日・配送時間"
              class="py-3 px-5"
            >
              <v-container
                v-for="(item,key) in shop_time"
                :key="key"
                fluid
              >
                <v-row justify="center">
                  <v-col
                    class="d-flex text-right"
                    cols="12"
                    sm="2"
                  >
                    <v-switch
                      v-model="item.is_open"
                      class="mx-2"
                      :label="item.label_ja"
                    />
                  </v-col>
                  <v-col
                    class="d-flex"
                    cols="12"
                    sm="3"
                  >
                    <v-select
                      v-model="item.time_start"
                      :items="shop_time_array"
                      label="開始時刻（第1部）"
                    />
                  </v-col>
                  <v-col
                    class="d-flex"
                    cols="12"
                    sm="3"
                  >
                    <v-select
                      v-model="item.time_end"
                      :items="shop_time_array"
                      label="終了時刻（第1部）"
                    />
                  </v-col>
                </v-row>
                <v-row justify="center">
                  <v-col
                    class="d-flex text-right"
                    cols="12"
                    sm="2"
                  />
                  <v-col
                    class="d-flex"
                    cols="12"
                    sm="3"
                  >
                    <v-select
                      v-model="item.time_start2"
                      :items="shop_time_array"
                      label="開始時刻（第2部）"
                    />
                  </v-col>
                  <v-col
                    class="d-flex"
                    cols="12"
                    sm="3"
                  >
                    <v-select
                      v-model="item.time_end2"
                      :items="shop_time_array"
                      label="終了時刻（第2部）"
                    />
                  </v-col>
                </v-row>
              </v-container>

              <div class="pa-3 text-center">
                <v-btn
                  color="success"
                  default
                  type="submit"
                >
                  保存する
                </v-btn>
              </div>
            </base-material-card>
          </form>
        </validation-observer>
      </v-col>
      <v-col cols="12">
        <validation-observer v-slot="{ handleSubmit }">
          <form @submit.prevent="handleSubmit(validateForm)">
            <base-material-card
              color="success"
              icon="mdi-clock-fast"
              title="注文締切日時"
              class="py-3 px-5"
            >
              <v-container
                fluid
              >
                <v-row
                  align="center"
                >
                  <v-col
                    class="text-right body-1 grey--text"
                    cols="12"
                    sm="2"
                  >
                    注文締切日時
                  </v-col>
                  <v-col
                    class="d-flex"
                    cols="12"
                    sm="4"
                  >
                    <v-select
                      v-model="shop_deadline_date"
                      :items="shop_deadline_date_array"
                      label="締切日"
                      hint="※注文の締切日時を設定できます"
                      persistent-hint
                    />
                  </v-col>
                  <v-col
                    class="d-flex"
                    cols="12"
                    sm="4"
                  >
                    <v-select
                      v-model="shop_deadline_time"
                      :items="shop_deadline_time_array"
                      label="締切時刻"
                    />
                  </v-col>
                </v-row>
                <!-- <v-row
                  align="center"
                >
                  <v-col
                    class="text-right body-1 grey--text"
                    cols="12"
                    sm="2"
                  >
                    配送時間幅
                  </v-col>
                  <v-col
                    class="d-flex"
                    cols="12"
                    sm="8"
                  >
                    <v-select
                      v-model="shop_margin_time"
                      :items="shop_margin_time_array"
                      label="配送時間幅(分)"
                      hint="※15分の設定で [12:00〜12:15配送予定]、30分の設定で [12:00〜12:30配送予定] と配送時間に幅を持たせることができます"
                      persistent-hint
                    />
                  </v-col>
                </v-row> -->
              </v-container>
              <div class="pa-3 text-center">
                <v-btn
                  color="success"
                  default
                  type="submit"
                >
                  保存する
                </v-btn>
              </div>
            </base-material-card>
          </form>
        </validation-observer>
      </v-col>

      <v-col cols="12">
        <validation-observer v-slot="{ handleSubmit }">
          <form @submit.prevent="handleSubmit(validateForm)">
            <base-material-card
              color="success"
              icon="mdi-calendar"
              title="休業日"
              class="py-3 px-5"
            >
              <v-row justify="center">
                <v-col
                  cols="9"
                >
                  <v-menu
                    ref="menu"
                    v-model="menu"
                    :close-on-content-click="false"
                    :return-value.sync="shop_holidays"
                    transition="scale-transition"
                    offset-y
                    min-width="290px"
                  >
                    <template v-slot:activator="{ on, attrs }">
                      <v-combobox
                        v-model="shop_holidays"
                        multiple
                        chips
                        small-chips
                        label="休業日"
                        prepend-icon="mdi-calendar"
                        hint="※不定期の休業日を設定することができます"
                        persistent-hint
                        readonly
                        v-bind="attrs"
                        v-on="on"
                      />
                    </template>
                    <v-date-picker
                      v-model="shop_holidays"
                      multiple
                      no-title
                      scrollable
                    >
                      <v-spacer />
                      <v-btn
                        text
                        color="primary"
                        @click="menu = false"
                      >
                        Cancel
                      </v-btn>
                      <v-btn
                        text
                        color="primary"
                        @click="$refs.menu.save(shop_holidays)"
                      >
                        OK
                      </v-btn>
                    </v-date-picker>
                  </v-menu>
                </v-col>
              </v-row>
              <div class="pa-3 text-center">
                <v-btn
                  color="success"
                  default
                  type="submit"
                >
                  保存する
                </v-btn>
              </div>
            </base-material-card>
          </form>
        </validation-observer>
      </v-col>
      <v-col cols="12">
        <validation-observer v-slot="{ handleSubmit }">
          <form @submit.prevent="handleSubmit(validateForm)">
            <base-material-card
              color="success"
              icon="mdi-email-multiple-outline"
              title="サブメールアドレス"
              class="py-3 px-5"
            >
              <v-row
                align="center"
                dense
              >
                <v-col
                  class="text-right body-1 grey--text"
                  cols="3"
                >
                  メールアドレス
                </v-col>
                <v-col
                  cols="9"
                  sm="8"
                >
                  <validation-provider
                    v-slot="{ errors }"
                    name="メールアドレス"
                    rules="email"
                  >
                    <v-text-field
                      v-model="shop_email"
                      :error-messages="errors"
                      color="secondary"
                      readonly
                      filled
                    />
                  </validation-provider>
                </v-col>
              </v-row>
              <v-row
                align="center"
                dense
              >
                <v-col
                  class="text-right body-1 grey--text"
                  cols="3"
                >
                  サブメールアドレス1
                </v-col>
                <v-col
                  cols="9"
                  sm="8"
                >
                  <validation-provider
                    v-slot="{ errors }"
                    name="サブメールアドレス1"
                    rules="email"
                  >
                    <v-text-field
                      v-model="shop_email_sub1"
                      :error-messages="errors"
                    />
                  </validation-provider>
                </v-col>
              </v-row>
              <v-row
                align="center"
                dense
              >
                <v-col
                  class="text-right body-1 grey--text"
                  cols="3"
                >
                  サブメールアドレス2
                </v-col>
                <v-col
                  cols="9"
                  sm="8"
                >
                  <validation-provider
                    v-slot="{ errors }"
                    name="サブメールアドレス2"
                    rules="email"
                  >
                    <v-text-field
                      v-model="shop_email_sub2"
                      :error-messages="errors"
                    />
                  </validation-provider>
                </v-col>
              </v-row>
              <v-row
                align="center"
                dense
              >
                <v-col
                  class="text-right body-1 grey--text"
                  cols="3"
                >
                  サブメールアドレス3
                </v-col>
                <v-col
                  cols="9"
                  sm="8"
                >
                  <validation-provider
                    v-slot="{ errors }"
                    name="サブメールアドレス3"
                    rules="email"
                  >
                    <v-text-field
                      v-model="shop_email_sub3"
                      :error-messages="errors"
                    />
                  </validation-provider>
                </v-col>
              </v-row>
              <v-card-text
                class="mb-3 text-center text-body-2 font-weight-light"
                style="color:#9E9E9E;"
              >
                ※サブメールアドレスを設定すると注文メールが配信されるようになります。<br>
                ※サブメールアドレスの入力ミスには十分ご注意ください。
              </v-card-text>
              <div class="pa-3 text-center">
                <v-btn
                  color="success"
                  default
                  type="submit"
                >
                  保存する
                </v-btn>
              </div>
            </base-material-card>
          </form>
        </validation-observer>
      </v-col>

      <v-col cols="12">
        <validation-observer v-slot="{ handleSubmit }">
          <form @submit.prevent="handleSubmit(validateForm)">
            <base-material-card
              color="success"
              icon="mdi-storefront-outline"
              title="開店設定"
              class="py-3 px-5"
            >
              <v-row
                align="center"
                dense
              >
                <v-col
                  class="text-right body-1 grey--text"
                  cols="3"
                >
                  開店設定
                </v-col>
                <v-col
                  cols="9"
                  sm="8"
                >
                  <v-switch
                    v-model="is_open"
                    :label="`${is_open?'開店(OPEN)':'閉店(CLOSE)'}`"
                  />
                </v-col>
              </v-row>
              <v-row
                justify="center"
              >
                <v-col
                  cols="6"
                >
                  <v-card-text
                    class="mb-3 mx-20 text-body-2 primary--text"
                  >
                    ※「開店」とすると、ユーザーからの予約や注文が可能になります。<br>
                    ※「閉店」とすると、非公開となり、新規の予約は入りません。<br>
                    ※ すべての設定が完了したら「開店」として「保存」してください。<br>
                    ※ サポートチームが確認したのちに、店舗が公開されます。
                  </v-card-text>
                </v-col>
              </v-row>

              <div class="pa-3 text-center">
                <v-btn
                  color="success"
                  default
                  type="submit"
                >
                  保存する
                </v-btn>
              </div>
            </base-material-card>
          </form>
        </validation-observer>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  import firebase from 'firebase/app'
  import 'firebase/firestore'
  import 'firebase/auth'
  import 'firebase/storage'
  import { fetchLocationByPostalcode } from '@/methods/fetchLocation'

  const db = firebase.firestore()
  const partnerId = firebase.auth().currentUser.uid
  const storage = firebase.storage()
  let shopId = '' // shopのドキュメントID。docがなかったら発行する。
  let shopDoc = '' // firebaseから読み込んだ値をグローバルに代入できる変数

  // firestoreのデータ取得手順方法
  // https://www.wakuwakubank.com/posts/723-firebase-firestore-query/
  // (async () => {
  //   const db = firebase.firestore()
  //   const partner_uid = firebase.auth().currentUser.uid
  //   const postRef = db.collection('partners').doc(partner_uid).collection('shops').doc('shop001')
  //   const postDoc = await postRef.get()
  //   if (postDoc) {
  //     console.log(firebase.auth().currentUser.email)
  //     console.log(firebase.auth().currentUser.uid)
  //     console.log(postDoc)
  //     console.log(postDoc.exists) //ture
  //     console.log(postDoc.id)
  //     console.log(postDoc.data()) //docの全データオブジェクト
  //     console.log(postDoc.data().shop_name) // shop_nameを.dataから取得
  //     console.log(postDoc.get('shop_name')) // shop_nameを.get(引数)で取得
  //     // console.log(firebase.firestore().collection('partners').doc(partner_uid).collection('shops').doc('shop001').get().data())
  //     // 直接.get().data をつなげてもdataはとれない。awaitで非同期に.getでデータ取得完了後にdata()で表示する。.then()する
  //   } else {
  //     console.log('No such document!')
  //   }
  // })()

  export default {
    name: 'DashboardFormsValidationForms',

    $_veeValidate: {
      validator: 'new',
    },

    data: () => ({
      shop_name: '',
      shop_postcode: '',
      shop_address: '',
      shop_address_latitude: 0,
      shop_address_longitude: 0,
      shop_phone: '',
      shop_url: '',
      shop_url_twitter: '',
      shop_url_facebook: '',
      shop_url_instagram: '',
      shop_image_file: '',
      shop_image_url: require('@/assets/600x450.png'),
      shop_description: '',
      shop_genre: '',
      // shop_range: '',
      // shop_min_orders: '',
      shop_time: [
        { label_en: 'sun', label_ja: '日曜日', is_open: false, time_start: '', time_end: '', time_start2: '', time_end2: '' },
        { label_en: 'mon', label_ja: '月曜日', is_open: false, time_start: '', time_end: '', time_start2: '', time_end2: '' },
        { label_en: 'tue', label_ja: '火曜日', is_open: false, time_start: '', time_end: '', time_start2: '', time_end2: '' },
        { label_en: 'wed', label_ja: '水曜日', is_open: false, time_start: '', time_end: '', time_start2: '', time_end2: '' },
        { label_en: 'thu', label_ja: '木曜日', is_open: false, time_start: '', time_end: '', time_start2: '', time_end2: '' },
        { label_en: 'fli', label_ja: '金曜日', is_open: false, time_start: '', time_end: '', time_start2: '', time_end2: '' },
        { label_en: 'sat', label_ja: '土曜日', is_open: false, time_start: '', time_end: '', time_start2: '', time_end2: '' },
      ],
      shop_range_min_orders: [
        { label: '設定1', range: '', min_orders: '' },
        { label: '設定2', range: '', min_orders: '' },
        { label: '設定3', range: '', min_orders: '' },
        { label: '設定4', range: '', min_orders: '' },
        { label: '設定5', range: '', min_orders: '' },
      ],
      shop_deadline_date: '当日',
      shop_deadline_time: '11:00',
      shop_margin_time: '30',
      shop_email: firebase.auth().currentUser.email,
      shop_email_sub1: '',
      shop_email_sub2: '',
      shop_email_sub3: '',
      shop_min_orders_array: ['', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
      shop_range_array: ['', 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 35, 40, 45, 50],
      shop_genre_array: ['弁当', '丼もの', 'おにぎり', '和食', '寿司', '魚介料理', '海鮮料理', '天ぷら', '揚げ物', 'そば', 'うどん', '麺類', 'うなぎ・どじょう・あなご', '焼鳥', '串焼', '鳥料理', 'すき焼き', 'しゃぶしゃぶ', 'おでん', 'お好み焼き', 'たこ焼き', '日本料理', '郷土料理', 'ステーキ', 'ハンバーグ', '鉄板焼き', 'パスタ', 'ピザ', 'ハンバーガー', '洋食', '欧風料理', 'フレンチ', 'イタリアン', 'スペイン料理', '西洋各国料理', '中華料理', '餃子', '肉まん', '中華粥', '中華麺', '韓国料理', '東南アジア料理', '南アジア料理', '西アジア料理', '中南米料理', 'アフリカ料理', 'アジア・エスニック', 'カレーライス', '欧風カレー', 'インドカレー', 'スパイスカレー', 'タイカレー', 'スープカレー', 'カレー', '焼肉', 'ホルモン', 'ジンギスカン', 'ちゃんこ鍋', 'うどんすき', 'もつ鍋', '水炊き', 'ちりとり鍋・てっちゃん鍋', '中国鍋・火鍋', '韓国鍋', 'タイスキ', '鍋', '居酒屋', 'ダイニングバー', '創作料理', 'イノベーティブ・フュージョン', '無国籍料理', 'ファミレス', 'レストラン', '自然食', '薬膳', 'ラーメン', '油そば', '台湾まぜそば', '汁なし担々麺', 'つけ麺', 'カフェ', '喫茶店', 'コーヒー専門店', '紅茶専門店', '中国茶専門店', '日本茶専門店', 'パン', 'サンドイッチ', 'ベーグル', '洋菓子', '和菓子・甘味処', '中華菓子', 'スイーツ', '低糖質', 'キッチンカー', 'キムチ', '焼き芋', 'その他'],
      shop_time_array: ['', '6:00', '6:15', '6:30', '6:45', '7:00', '7:15', '7:30', '7:45', '8:00', '8:15', '8:30', '8:45', '9:00', '9:15', '9:30', '9:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45', '19:00', '19:15', '19:30', '19:45', '20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30', '21:45', '22:00', '22:15', '22:30', '22:45', '23:00', '23:15', '23:30', '23:45', '24:00'],
      shop_deadline_date_array: ['当日', '前日', '2日前', '3日前', '4日前', '5日前'],
      shop_deadline_time_array: ['6:00', '6:15', '6:30', '6:45', '7:00', '7:15', '7:30', '7:45', '8:00', '8:15', '8:30', '8:45', '9:00', '9:15', '9:30', '9:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45', '19:00', '19:15', '19:30', '19:45', '20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30', '21:45', '22:00', '22:15', '22:30', '22:45', '23:00', '23:15', '23:30', '23:45', '24:00'],
      shop_margin_time_array: ['10', '15', '20', '30', '40', '50', '60'],
      // shop_order_method: ['現金'],
      shop_holidays: [],
      is_open: false,
      menu: false,
      shopTimeCheck: true,
      shopRangeCheck: true,
    }),

    created () {
      // console.log('partnerId: ' + partnerId)
      // console.log(firebase.auth().currentUser.email)

      // まずshopIDをsnapshot.getで取得する
      db.collection('partners').doc(partnerId).collection('shops').get().then((snapshot) => {
        // console.log(snapshot)
        // console.log(snapshot.size)
        // console.log(snapshot.empty)
        // console.log(snapshot.docs)
        // console.log(typeof (snapshot))
        snapshot.forEach((doc) => {
          // console.log(doc.id, ' => ', JSON.stringify(doc.data()))
          shopDoc = doc.data()
          // console.log(shopDoc)
          shopId = doc.id
          // console.log('shopID: ' + shopId)
        })
        if (shopDoc) {
          // dbに店舗情報が存在したら、v-modelでバインディングしてるformに値を代入
          this.shop_name = shopDoc.shop_name
          this.shop_postcode = shopDoc.shop_postcode
          this.shop_address = shopDoc.shop_address
          this.shop_phone = shopDoc.shop_phone
          this.shop_url = shopDoc.shop_url
          this.shop_description = shopDoc.shop_description
          this.shop_genre = shopDoc.shop_genre
          // this.shop_range = shopDoc.shop_range
          // this.shop_min_orders = shopDoc.shop_min_orders
          if (shopDoc.shop_image_url) {
            // 店舗画像未登録のときはデフォルト画像
            this.shop_image_url = shopDoc.shop_image_url
          }
          if (shopDoc.shop_time) {
            this.shop_time = shopDoc.shop_time
          }
          if (shopDoc.shop_holidays) {
            this.shop_holidays = shopDoc.shop_holidays
          }
          if (shopDoc.shop_range_min_orders) {
            this.shop_range_min_orders = shopDoc.shop_range_min_orders
          }
          if (shopDoc.shop_address_latitude && shopDoc.shop_address_longitude) {
            this.shop_address_latitude = shopDoc.shop_address_latitude
            this.shop_address_longitude = shopDoc.shop_address_longitude
          }
          if (shopDoc.shop_url_twitter) {
            this.shop_url_twitter = shopDoc.shop_url_twitter
          }
          if (shopDoc.shop_url_facebook) {
            this.shop_url_facebook = shopDoc.shop_url_facebook
          }
          if (shopDoc.shop_url_instagram) {
            this.shop_url_instagram = shopDoc.shop_url_instagram
          }
          if (shopDoc.shop_deadline_date) {
            this.shop_deadline_date = shopDoc.shop_deadline_date
          }
          if (shopDoc.shop_deadline_time) {
            this.shop_deadline_time = shopDoc.shop_deadline_time
          }
          if (shopDoc.shop_margin_time) {
            this.shop_margin_time = shopDoc.shop_margin_time
          }
          if (shopDoc.shop_email_sub1) {
            this.shop_email_sub1 = shopDoc.shop_email_sub1
          }
          if (shopDoc.shop_email_sub2) {
            this.shop_email_sub2 = shopDoc.shop_email_sub2
          }
          if (shopDoc.shop_email_sub3) {
            this.shop_email_sub3 = shopDoc.shop_email_sub3
          }
          this.is_open = shopDoc.is_open ?? true
        } else {
          console.log('店舗情報未登録なのでshopIdをローカルで新規発行')
          shopId = firebase.firestore().collection('partners').doc(partnerId).collection('shops').doc().id
          console.log('shopId: ' + shopId)
        }
      })

      // 店舗画像をダウンロードして表示。thisのスコープ外なので変数meに代入
      // var me = this
      // storage.ref().child(partnerId + '/shops/shop001.jpg').getDownloadURL().then(function (url) {
      //   console.log('url:' + url) // ダウンロードURL
      //   me.shop_image_src = url
      // })
    },

    methods: {
      validateForm (scope) {
        // 配送時間設定のバリデーション
        this.validateShopTime()
        if (this.shopTimeCheck === false) {
          this.shopTimeCheck = true
          return alert('配送時間を正しく設定してください。')
        }
        // 配送距離と最小注文個数のバリデーション
        this.validateShopRangeMinOrders()
        if (this.shopRangeCheck === false) {
          this.shopRangeCheck = true
          return
        }
        if ((this.shop_email === this.shop_email_sub1 && this.shop_email_sub1.length > 0) ||
          (this.shop_email === this.shop_email_sub2 && this.shop_email_sub2.length > 0) ||
          (this.shop_email === this.shop_email_sub3 && this.shop_email_sub3.length > 0) ||
          (this.shop_email_sub1 === this.shop_email_sub2 && this.shop_email_sub1.length > 0 && this.shop_email_sub2.length > 0) ||
          (this.shop_email_sub1 === this.shop_email_sub3 && this.shop_email_sub1.length > 0 && this.shop_email_sub3.length > 0) ||
          (this.shop_email_sub2 === this.shop_email_sub3 && this.shop_email_sub2.length > 0 && this.shop_email_sub3.length > 0)) {
          return alert('同一のサブメールアドレスを設定することはできません')
        }
        // Number型に変換
        if (this.shop_address_latitude || this.shop_address_longitude) {
          this.shop_address_latitude = Number(this.shop_address_latitude)
          this.shop_address_longitude = Number(this.shop_address_longitude)
        }
        // shopDocが存在しないときは新規作成set()
        if (!shopDoc) {
          db.collection('partners').doc(partnerId).collection('shops').doc(shopId).set({
            partner_id: partnerId, // partnerIdを冗長化
            shop_id: shopId, // shopIdを冗長化
            shop_email: firebase.auth().currentUser.email, // アカウントのメアドをSHOPのメアドとして冗長化
            shop_name: this.shop_name,
            shop_postcode: this.shop_postcode,
            shop_address: this.shop_address,
            shop_phone: this.shop_phone,
            shop_url: this.shop_url,
            shop_url_twitter: this.shop_url_twitter,
            shop_url_facebook: this.shop_url_facebook,
            shop_url_instagram: this.shop_url_instagram,
            shop_description: this.shop_description,
            shop_genre: this.shop_genre,
            // shop_range: this.shop_range,
            // shop_min_orders: this.shop_min_orders,
            shop_range_min_orders: this.shop_range_min_orders,
            shop_time: this.shop_time,
            shop_holidays: this.shop_holidays,
            shop_address_latitude: this.shop_address_latitude,
            shop_address_longitude: this.shop_address_longitude,
            shop_deadline_date: this.shop_deadline_date,
            shop_deadline_time: this.shop_deadline_time,
            shop_margin_time: this.shop_margin_time,
            shop_email_sub1: this.shop_email_sub1,
            shop_email_sub2: this.shop_email_sub2,
            shop_email_sub3: this.shop_email_sub3,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(), // 新規作成日時
            is_open: this.is_open,
          }).then(function () {
            // 新規作成後にshopDocにデータを入れる。画像登録できるように
            db.collection('partners').doc(partnerId).collection('shops').doc(shopId).get().then((doc) => {
              // console.log(doc.id, ' => ', JSON.stringify(doc.data()))
              shopDoc = doc.data()
              // console.log(shopDoc)
            })
            alert('店舗情報を新規作成しました')
          }).catch(function (error) {
            alert('店舗情報を新規作成できませんでした')
            console.log('error: ' + error)
          })
        // shopDocが存在するときはupdate()
        } else if (shopDoc) {
          db.collection('partners').doc(partnerId).collection('shops').doc(shopId).update({
            shop_name: this.shop_name,
            shop_postcode: this.shop_postcode,
            shop_address: this.shop_address,
            shop_phone: this.shop_phone,
            shop_url: this.shop_url,
            shop_url_twitter: this.shop_url_twitter,
            shop_url_facebook: this.shop_url_facebook,
            shop_url_instagram: this.shop_url_instagram,
            shop_description: this.shop_description,
            shop_genre: this.shop_genre,
            // shop_range: this.shop_range,
            // shop_min_orders: this.shop_min_orders,
            shop_range_min_orders: this.shop_range_min_orders,
            shop_time: this.shop_time,
            shop_holidays: this.shop_holidays,
            shop_address_latitude: this.shop_address_latitude,
            shop_address_longitude: this.shop_address_longitude,
            shop_deadline_date: this.shop_deadline_date,
            shop_deadline_time: this.shop_deadline_time,
            shop_margin_time: this.shop_margin_time,
            shop_email_sub1: this.shop_email_sub1,
            shop_email_sub2: this.shop_email_sub2,
            shop_email_sub3: this.shop_email_sub3,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(), // 更新日時
            is_open: this.is_open,
          }).then(function () {
            alert('店舗情報を更新しました')
          }).catch(function (error) {
            alert('店舗情報を更新できませんでした')
            console.log('error: ' + error)
          })
        }
      },
      validateForm_image (scope) {
        // thisのスコープ外のためme： https://tadaken3.hatenablog.jp/entry/vue-scope-this
        var me = this
        if (!shopDoc) {
          alert('先に店舗情報から登録してください')
        } else {
          storage
            .ref()
            .child('partners/' + partnerId + '/shops/' + shopId + '/shop.jpg')
            .put(this.shop_image_file).then(function (snapshot) {
              snapshot.ref.getDownloadURL().then(function (url) {
                // console.log(url) // ダウンロードURL
                me.shop_image_url = url // 表示されている店舗画像を更新した画像に差し替える
                db.collection('partners').doc(partnerId).collection('shops').doc(shopId).set({
                  shop_image_url: url, // shop情報に画像URLをupdateする
                }, { merge: true })
              }).catch(function (error) {
                console.log(error)
              })
              alert('店舗画像を更新しました')
            }).catch(error => {
              console.log(error)
              alert('店舗画像を更新できませんでした')
            })
        }
      },
      validateShopTime () {
        // console.log('validateShopTime')
        function timeConvert (timeString) {
          if (timeString) {
            const arr = timeString.split(':')
            const timeNumber = Number(arr[0]) + Number(arr[1]) / 60
            return timeNumber
          } else {
            return 0
          }
        }
        this.shop_time.forEach(item => {
          // 第1部の開始時刻が終了時刻より遅い
          if (timeConvert(item.time_end) <= timeConvert(item.time_start) && item.time_end && item.time_start) {
            this.shopTimeCheck = false
          }
          // 第2部の開始時刻が終了時刻より遅い
          if (timeConvert(item.time_end2) <= timeConvert(item.time_start2) && item.time_end2 && item.time_start2) {
            this.shopTimeCheck = false
          }
          // 第2部の開始時刻が第1部の終了時刻より遅い
          if (timeConvert(item.time_start2) <= timeConvert(item.time_end) && item.time_end && item.time_start2) {
            this.shopTimeCheck = false
          }
          // 第1部の開始時刻と終了時刻のどちらかしか設定していない
          if ((item.time_end && !item.time_start) || (!item.time_end && item.time_start)) {
            this.shopTimeCheck = false
          }
          // 第2部の開始時刻と終了時刻のどちらかしか設定していない
          if ((item.time_end2 && !item.time_start2) || (!item.time_end2 && item.time_start2)) {
            this.shopTimeCheck = false
          }
        })
      },
      validateShopRangeMinOrders () {
        // console.log('validateShopRangeMinOrders')
        for (let i = 0; i < 4; i++) {
          if (this.shop_range_min_orders[i + 1].min_orders > 0 && this.shop_range_min_orders[i].min_orders === '') {
            // console.log('配送距離＆注文最小個数は低い設定から、正しく設定してください。')
            alert('配送距離＆注文最小個数は低い設定から、正しく設定してください。')
            this.shopRangeCheck = false
            return
          }
          if (this.shop_range_min_orders[i + 1].range > 0 && this.shop_range_min_orders[i].range === '') {
            // console.log('配送距離＆注文最小個数は低い設定から、正しく設定してください。')
            alert('配送距離＆注文最小個数は低い設定から、正しく設定してください。')
            this.shopRangeCheck = false
            return
          }
        }
        for (let i = 0; i < 4; i++) {
          if (this.shop_range_min_orders[i].range >= this.shop_range_min_orders[i + 1].range && this.shop_range_min_orders[i + 1].range !== '') {
            // console.log(this.shop_range_min_orders[i].range)
            // console.log(this.shop_range_min_orders[i + 1].range)
            // console.log('配送距離が小さい順になっていません')
            alert('配送距離が小さい順になっていません。正しく設定してください。')
            this.shopRangeCheck = false
            return
          }
          if (this.shop_range_min_orders[i].min_orders >= this.shop_range_min_orders[i + 1].min_orders && this.shop_range_min_orders[i + 1].min_orders !== '') {
            // console.log(this.shop_range_min_orders[i].min_orders)
            // console.log(this.shop_range_min_orders[i + 1].min_orders)
            // console.log('配送個数が小さい順になっていません')
            alert('最小注文個数が小さい順になっていません。正しく設定してください。')
            this.shopRangeCheck = false
            return
          }
        }
        for (let i = 0; i < 5; i++) {
          if (this.shop_range_min_orders[i].min_orders > 0 && this.shop_range_min_orders[i].range === '') {
            // console.log('配送個数は設定してあるが、配送距離が空')
            alert('配送距離が空の値です。正しく設定してください。')
            this.shopRangeCheck = false
            return
          }
          if (this.shop_range_min_orders[i].min_orders === '' && this.shop_range_min_orders[i].range > 0) {
            // console.log('配送距離は設定してあるが、最小注文個数が空')
            alert('最小注文個数が空の値です。正しく設定してください。')
            this.shopRangeCheck = false
            return
          }
        }
        // this.shop_range_min_orders.forEach(item => {
        //   console.log(typeof (item.range))
        //   console.log(item.range)
        //   console.log(typeof (item.min_orders))
        //   console.log(item.min_orders)
        //   console.log(typeof (item.label))
        //   console.log(item.label)
        // })
      },
      fetchLocation: async function(postalcode) {
        const location = await fetchLocationByPostalcode(postalcode)
        this.shop_address_longitude = location.longitude
        this.shop_address_latitude = location.latitude
        this.shop_address = location.address
      }
    },
  }
</script>
