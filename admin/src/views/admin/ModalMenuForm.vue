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
                      rules="required|min_value:10|max_value:10000"
                    >
                      <v-text-field
                        v-model="menu_price"
                        :error-messages="errors"
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
                </v-row>
              </v-container>
              <small class="grey--text text--lighten-1">全ての項目を入力のうえ保存してください。</small>
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
    },
    $_veeValidate: {
      validator: 'new',
    },

    data: () => ({
      dialog: false,
      buttonLoading: false,
    }),
    methods: {
      validateForm (scope) {
        // thisのスコープ外になるのでmeに代入
        var me = this
        // menu_priceをnumber型に変換
        me.menu_price = Number(me.menu_price)
        // ファイル名は日付
        const fileName = Date.now()
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
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                  }).then(function () {
                    alert('メニューを追加しました')
                    me.menu_name = null
                    me.menu_description = null
                    me.menu_price = 0
                    me.menu_image_file = null
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
                      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    }).then(function () {
                      alert('メニューを更新しました')
                      me.menu_name = null
                      me.menu_description = null
                      me.menu_price = 0
                      me.menu_image_file = null
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
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
              }).then(function () {
                alert('メニューを更新しました')
                me.menu_name = null
                me.menu_description = null
                me.menu_price = 0
                me.menu_image_file = null
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
