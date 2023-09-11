<template>
  <v-row>
    <v-dialog
      v-model="dialog"
      persistent
      max-width="600px"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-container
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>
            {{ icon }}
          </v-icon>
          {{ title }}
        </v-container>
      </template>
      <validation-observer v-slot="{ handleSubmit }">
        <form @submit.prevent="handleSubmit(validateForm)">
          <v-card>
            <v-card-title>
              <span class="headline">{{ card_title }}</span>
            </v-card-title>
            <v-card-text>
              <v-container>
                <v-row>
                  <v-col cols="12">
                    <validation-provider
                      v-slot="{ errors }"
                      name="メニュー名称"
                      rules="required"
                    >
                      <v-text-field
                        v-model="menu_name"
                        :error-messages="errors"
                        label="メニュー名称"
                      />
                    </validation-provider>
                  </v-col>
                  <v-col cols="12">
                    <validation-provider
                      v-slot="{ errors }"
                      name="説明文"
                      rules="max:140"
                    >
                      <v-textarea
                        v-model="menu_description"
                        :error-messages="errors"
                        label="説明文"
                      />
                    </validation-provider>
                  </v-col>
                  <v-col
                    cols="12"
                    sm="6"
                  >
                    <validation-provider
                      v-slot="{ errors }"
                      name="税込価格"
                      rules="required|min_value:100|max_value:10000"
                    >
                      <v-text-field
                        v-model="menu_price"
                        :error-messages="errors"
                        prepend-icon="mdi-currency-jpy"
                        label="税込価格"
                        type="number"
                      />
                    </validation-provider>
                  </v-col>
                  <v-col
                    cols="12"
                    sm="6"
                  >
                    <validation-provider
                      v-slot="{ errors }"
                      name="メニュー画像"
                    >
                      <v-file-input
                        v-model="menu_image_file"
                        :error-messages="errors"
                        accept="image/png, image/jpeg, image/bmp"
                        prepend-icon="mdi-camera"
                        label="メニュー画像 (600x600推奨)"
                      />
                    </validation-provider>
                  </v-col>
                  <v-card-title
                    class="my-5"
                  >
                    <span class="headline">期間限定・上限数・売切設定</span>
                  </v-card-title>
                  <v-col
                    cols="12"
                    sm="6"
                  >
                    <v-dialog
                      ref="dialogDateStart"
                      v-model="modalDateStart"
                      :return-value.sync="menu_date_start"
                      persistent
                      width="290px"
                    >
                      <template v-slot:activator="{ on, attrs }">
                        <v-text-field
                          v-model="menu_date_start"
                          class="my-3"
                          label="期間限定・開始日"
                          prepend-icon="mdi-calendar"
                          readonly
                          clearable
                          hint="期間限定の場合、日付を設定してください。イベント当日の値となります。"
                          v-bind="attrs"
                          v-on="on"
                        />
                      </template>
                      <v-date-picker
                        v-model="menu_date_start"
                        scrollable
                        locale="ja"
                      >
                        <v-spacer />
                        <v-btn
                          text
                          color="primary"
                          @click="modalDateStart = false"
                        >
                          Cancel
                        </v-btn>
                        <v-btn
                          text
                          color="primary"
                          @click="$refs.dialogDateStart.save(menu_date_start)"
                        >
                          OK
                        </v-btn>
                      </v-date-picker>
                    </v-dialog>
                  </v-col>
                  <v-col
                    cols="12"
                    sm="6"
                  >
                    <v-dialog
                      ref="dialogDateEnd"
                      v-model="modalDateEnd"
                      :return-value.sync="menu_date_end"
                      persistent
                      width="290px"
                    >
                      <template v-slot:activator="{ on, attrs }">
                        <v-text-field
                          v-model="menu_date_end"
                          class="my-3"
                          label="期間限定・終了日"
                          prepend-icon="mdi-calendar"
                          readonly
                          clearable
                          hint="期間限定の場合、日付を設定してください。イベント当日の値となります。"
                          v-bind="attrs"
                          v-on="on"
                        />
                      </template>
                      <v-date-picker
                        v-model="menu_date_end"
                        scrollable
                        locale="ja"
                      >
                        <v-spacer />
                        <v-btn
                          text
                          color="primary"
                          @click="modalDateEnd = false"
                        >
                          Cancel
                        </v-btn>
                        <v-btn
                          text
                          color="primary"
                          @click="$refs.dialogDateEnd.save(menu_date_end)"
                        >
                          OK
                        </v-btn>
                      </v-date-picker>
                    </v-dialog>
                  </v-col>
                  <v-col
                    cols="12"
                    sm="12"
                  >
                    <validation-provider
                      v-slot="{ errors }"
                      name="1イベントの上限数"
                      rules="min_value:1|max_value:1000"
                    >
                      <v-text-field
                        v-model="menu_stock_per_event"
                        :error-messages="errors"
                        prepend-icon="mdi-counter"
                        label="1イベントの上限数"
                        type="number"
                        hint="1回のイベントにおける注文個数の上限を設定することができます。"
                        clearable
                      />
                    </validation-provider>
                  </v-col>
                  <v-col
                    cols="12"
                    sm="12"
                  >
                    <validation-provider
                      v-slot="{ errors }"
                      name="売り切れ設定"
                    >
                      <v-switch
                        v-model="is_soldout"
                        :error-messages="errors"
                        :label="`${is_soldout?'売り切れ':'販売中'}`"
                      />
                    </validation-provider>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                color="success"
                text
                @click="dialog = false"
              >
                閉じる
              </v-btn>
              <v-btn
                :disabled="buttonLoading"
                :loading="buttonLoading"
                color="success"
                default
                type="submit"
              >
                保存する
              </v-btn>
            </v-card-actions>
          </v-card>
        </form>
      </validation-observer>
    </v-dialog>
  </v-row>
</template>

<script>
  import firebase from 'firebase/app'
  import 'firebase/firestore'
  import 'firebase/auth'
  import 'firebase/storage'

  const db = firebase.firestore()
  const partnerId = firebase.auth().currentUser.uid
  const storage = firebase.storage()

  export default {
    name: 'ModalMenuForm',

    props: {
      title: {
        type: String,
        default: '',
      },
      icon: {
        type: String,
        default: '',
      },
      card_title: {
        type: String,
        default: '',
      },
      menu_name: {
        type: String,
        default: '',
      },
      menu_description: {
        type: String,
        default: '',
      },
      menu_price: {
        type: Number,
        default: 0,
      },
      menu_id: {
        type: String,
        default: '',
      },
      menu_image_file: {
        type: String,
        default: '',
      },
      menu_stock_per_event: {
        type: Number,
        default: null,
      },
      is_soldout: {
        type: Boolean,
        default: false,
      },
      menu_date_start: {
        type: String,
        default: '',
      },
      menu_date_end: {
        type: String,
        default: '',
      },

    },
    $_veeValidate: {
      validator: 'new',
    },

    data: () => ({
      dialog: false,
      buttonLoading: false,
      dialogDateStart: false,
      dialogDateEnd: false,
      modalDateStart: false,
      modalDateEnd: false,
    }),
    methods: {
      validateForm (scope) {
        // thisのスコープ外になるのでmeに代入
        const me = this
        // menu_priceをnumber型に変換
        me.menu_price = Number(me.menu_price)
        // 上限数が設定されている場合は、Number型に変換
        if (me.menu_stock_per_event) {
          me.menu_stock_per_event = Number(me.menu_stock_per_event)
        }
        // ファイル名は日付
        const fileName = Date.now()
        // 期間限定は開始日と終了日どちらも設定
        if ((me.menu_date_start && !me.menu_date_end) || (!me.menu_date_start && me.menu_date_end)) {
          window.alert('期間限定設定は開始日と終了日の両方を入力してください')
          return
        }
        // メニューIDが存在していない場合は新規作成
        if (!me.menu_id) {
          // 新規作成時にメニュー画像がない場合はアラート
          if (!this.menu_image_file) {
            alert('メニュー画像を入力してください')
            return
          }
          // 保存ボタンのローディング開始
          me.buttonLoading = true
          storage
            .ref()
            .child('partners/' + partnerId + '/menus/menu_' + fileName + '.jpeg')
            .put(this.menu_image_file).then(function (snapshot) {
              snapshot.ref.getDownloadURL().then(function (url) {
                // console.log(url) // ダウンロードURL取得
                // menu画像のアップロード完了後に、partnerId直下にmenu情報のdoc追加
                // チェーン店などの系列ならメニュー情報はPartnerIdで共通。(将来的に)それを店舗ごとに表示/非表示する機能をいれる。
                db
                  .collection('partners')
                  .doc(partnerId)
                  .collection('menus')
                  .add({
                    menu_name: me.menu_name,
                    menu_description: me.menu_description,
                    menu_price: me.menu_price,
                    menu_image_url: url,
                    menu_stock_per_event: me.menu_stock_per_event,
                    is_soldout: me.is_soldout,
                    menu_date_start: me.menu_date_start,
                    menu_date_end: me.menu_date_end,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                  }).then(function () {
                    alert('メニューを追加しました')
                    me.menu_name = null
                    me.menu_description = null
                    me.menu_price = 0
                    me.menu_image_file = null
                    me.menu_stock_per_event = null
                    me.is_soldout = false
                    me.menu_date_start = ''
                    me.menu_date_end = ''
                    me.dialog = false
                    me.buttonLoading = false
                    // firebaseへのメニュー追加完了したら親コンポーネントのmenuでダウンロードして表示
                    me.$emit('menu-added-event')
                  }).catch(function (error) {
                    alert('メニューを追加できませんでした')
                    console.log('error: ' + error)
                    me.dialog = false
                    me.buttonLoading = false
                  })
              }).catch(function (error) {
                console.log(error)
              })
            }).catch(error => {
              console.log(error)
            })
        // メニューIDが存在している場合は上書きアップデート
        } else if (me.menu_id) {
          // 保存ボタンのローディング開始
          me.buttonLoading = true
          // メニュー画像が選択されてるときは画像更新
          if (this.menu_image_file) {
            storage
              .ref()
              .child('partners/' + partnerId + '/menus/menu_' + fileName + '.jpeg')
              .put(this.menu_image_file).then(function (snapshot) {
                snapshot.ref.getDownloadURL().then(function (url) {
                  db
                    .collection('partners')
                    .doc(partnerId)
                    .collection('menus')
                    .doc(me.menu_id)
                    .update({
                      menu_name: me.menu_name,
                      menu_description: me.menu_description,
                      menu_price: me.menu_price,
                      menu_image_url: url,
                      menu_stock_per_event: me.menu_stock_per_event,
                      is_soldout: me.is_soldout,
                      menu_date_start: me.menu_date_start,
                      menu_date_end: me.menu_date_end,
                      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    }).then(function () {
                      alert('メニューを更新しました')
                      me.menu_name = null
                      me.menu_description = null
                      me.menu_price = 0
                      me.menu_image_file = null
                      me.menu_stock_per_event = null
                      me.is_soldout = false
                      me.menu_date_start = ''
                      me.menu_date_end = ''
                      me.dialog = false
                      me.buttonLoading = false
                      me.$emit('menu-added-event')
                    }).catch(function (error) {
                      alert('メニューを更新できませんでした')
                      console.log('error: ' + error)
                      me.dialog = false
                      me.buttonLoading = false
                    })
                }).catch(function (error) {
                  console.log(error)
                })
              }).catch(error => {
                console.log(error)
              })
          // メニュー画像が選択されてないときは画像更新なし
          } else if (!this.menu_image_file) {
            db
              .collection('partners')
              .doc(partnerId)
              .collection('menus')
              .doc(me.menu_id)
              .update({
                menu_name: me.menu_name,
                menu_description: me.menu_description,
                menu_price: me.menu_price,
                menu_stock_per_event: me.menu_stock_per_event,
                is_soldout: me.is_soldout,
                menu_date_start: me.menu_date_start,
                menu_date_end: me.menu_date_end,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
              }).then(function () {
                alert('メニューを更新しました')
                me.menu_name = null
                me.menu_description = null
                me.menu_price = 0
                me.menu_image_file = null
                me.menu_stock_per_event = null
                me.is_soldout = false
                me.menu_date_start = ''
                me.menu_date_end = ''
                me.dialog = false
                me.buttonLoading = false
                me.$emit('menu-added-event')
              }).catch(function (error) {
                alert('メニューを更新できませんでした')
                console.log('error: ' + error)
                me.dialog = false
                me.buttonLoading = false
              })
          }
        } else {
          console.log('キャンセルされました')
        }
      },
    },
  }
</script>
