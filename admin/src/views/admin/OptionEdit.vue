<template>
  <v-container
    fluid
    tag="section"
  >
    <v-row justify="center">
      <v-col
        cols="12"
        md="10"
      >
        <base-material-card
          color="success"
          icon="mdi-pencil"
          title="オプション名"
        >
          <validation-observer v-slot="{ handleSubmit }">
            <form @submit.prevent="handleSubmit(validateForm)">
              <v-row
                justify="center"
                class="pa-10"
              >
                <v-col
                  cols="12"
                  class="mx-5 px-3 py-3"
                >
                  <v-row>
                    <v-col
                      cols="10"
                    >
                      <v-text-field
                        v-model="option_id"
                        label="オプションID (disabled)"
                        disabled
                        prepend-icon="mdi-identifier"
                      />
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col
                      cols="10"
                    >
                      <validation-provider
                        v-slot="{ errors }"
                        name="オプション種類"
                        rules="required"
                      >
                        <v-select
                          v-model="option_category"
                          :error-messages="errors"
                          :items="option_category_array"
                          item-text="name"
                          prepend-icon="mdi-format-list-bulleted"
                          label="オプション種類"
                          return-object
                        />
                      </validation-provider>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col
                      cols="10"
                    >
                      <validation-provider
                        v-slot="{ errors }"
                        name="オプション名"
                        rules="required"
                      >
                        <v-text-field
                          v-model="option_name"
                          :error-messages="errors"
                          prepend-icon="mdi-pencil"
                          label="オプション名"
                        />
                      </validation-provider>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col
                      cols="10"
                    >
                      <validation-provider
                        v-slot="{ errors }"
                        name="オプション説明"
                        rules="required"
                      >
                        <v-textarea
                          v-model="option_description"
                          :error-messages="errors"
                          prepend-icon="mdi-pencil"
                          label="オプション説明"
                        />
                      </validation-provider>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col
                      cols="12"
                      class="text-right"
                    >
                      <v-btn
                        color="success"
                        class="mr-0"
                        type="submit"
                      >
                        更新する
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </form>
          </validation-observer>
        </base-material-card>
      </v-col>
      <v-col
        cols="12"
        md="10"
      >
        <base-material-card
          color="success"
          icon="mdi-format-list-bulleted"
          title="アイテム設定"
        >
          <validation-observer v-slot="{ handleSubmit }">
            <form @submit.prevent="handleSubmit(validateForm)">
              <v-row
                justify="center"
                class="pa-10"
              >
                <v-col
                  cols="12"
                  class="mx-5 px-3 py-3"
                >
                  <v-row
                    v-for="(item, index) in option_items"
                    :key="index"
                    :item="item"
                  >
                    <v-col
                      cols="5"
                    >
                      <validation-provider
                        v-slot="{ errors }"
                        name="アイテム名"
                        rules="required"
                      >
                        <v-text-field
                          v-model="item.name"
                          :error-messages="errors"
                          prepend-icon="mdi-pencil"
                          label="アイテム名"
                        />
                      </validation-provider>
                    </v-col>
                    <v-col
                      cols="5"
                    >
                      <validation-provider
                        v-slot="{ errors }"
                        name="アイテム価格（円）"
                        rules="required|numeric"
                      >
                        <v-text-field
                          v-model="item.price"
                          :error-messages="errors"
                          prepend-icon="mdi-cash-100"
                          label="アイテム価格（円）"
                        />
                      </validation-provider>
                    </v-col>
                    <v-col
                      cols="1"
                      class="text-right"
                    >
                      <v-btn
                        color="#777"
                        class="ma-0"
                        @click="deleteItem(index)"
                      >
                        <v-icon>
                          mdi-trash-can-outline
                        </v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col
                      cols="12"
                      class="text-right"
                    >
                      <v-btn
                        color="success"
                        class="mr-0"
                        @click="addItem"
                      >
                        アイテムを追加
                      </v-btn>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col
                      cols="12"
                      class="text-right"
                    >
                      <v-btn
                        color="success"
                        class="mr-0"
                        type="submit"
                      >
                        更新する
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </form>
          </validation-observer>
        </base-material-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  // import { firebase, db, storage, storageRef } from '../../plugins/firebase.js'
  import firebase from 'firebase/app'
  import 'firebase/firestore'
  import 'firebase/auth'
  import 'firebase/storage'
  const db = firebase.firestore()
  const partnerId = firebase.auth().currentUser.uid

  export default {
    name: 'OptionEdit',
    data: () => ({
      option_id: '',
      option_name: '',
      option_description: '',
      option_category: '',
      option_category_array: [{ name: '単一必須オプション', value: 'single_required' }, { name: '単一任意オプション', value: 'single_optional' }, { name: '複数任意オプション', value: 'multiple_optional' }],
      option_items: [{ name: '', price: 0 }],
    }),
    created () {
      this.option_id = this.$store.state.option_id
      this.optionEditView()
    },
    methods: {
      optionEditView: function () {
        db.collection('partners').doc(partnerId).collection('options').doc(this.$store.state.option_id).get().then((doc) => {
          this.option_name = doc.data().option_name
          this.option_category = doc.data().option_category
          this.option_description = doc.data().option_description
          this.option_items = doc.data().option_items
        }).catch(function (error) {
          console.log('error: ' + error)
        })
      },
      validateForm: function (scope) {
        db.collection('partners').doc(partnerId).collection('options').doc(this.$store.state.option_id).set({
          partner_id: partnerId,
          option_id: this.$store.state.option_id,
          option_name: this.option_name,
          option_category: this.option_category,
          option_description: this.option_description,
          option_items: this.option_items,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }).then(function () {
          alert('オプション情報を更新しました')
        }).catch(function (error) {
          alert('オプション情報を更新できませんでした')
          console.log('error: ' + error)
        })
      },
      addItem: function () {
        const item = { name: '', price: 0 }
        this.option_items.push(item)
      },
      deleteItem: function (index) {
        console.log(this.option_items)
        this.option_items.splice(index, 1)
      },
    },
  }
</script>
