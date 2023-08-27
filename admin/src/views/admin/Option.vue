<template>
  <v-container
    id="dashboard"
    fluid
    tag="section"
  >
    <v-row>
      <v-col
        cols="12"
      >
        <v-btn
          class="mb-5"
          color="success"
          rounded
          x-large
          :elevation="5"
          @click="toOptionCreate"
        >
          <v-icon>
            mdi-pencil
          </v-icon>
          オプションを新規作成する
        </v-btn>
      </v-col>
      <v-row>
        <v-col
          v-for="(item,key) in options"
          :key="key"
          cols="12"
          sm="6"
          md="4"
        >
          <v-card
            color="white"
            inline
            icon="mdi-bullhorn-variant-outline"
            class="px-5 py-5 mx-0 mb-0"
            v-on="on"
            @click="toOptionEdit(item.option_id)"
          >
            <v-card-text class="display-2 justify-start font-weight-light pa-0 ">
              {{ item.option_name }}
            </v-card-text>
            <v-card-text class="body-1 justify-start font-weight-light pa-0 ma-1">
              オプションID : {{ item.option_id }}
            </v-card-text>
            <v-card-text class="body-1 justify-start font-weight-light pa-0 ma-1">
              カテゴリ : {{ item.option_category.name }}
            </v-card-text>
            <v-card-text class="body-1 justify-start font-weight-light pa-0 ma-1">
              説明文 : {{ item.option_description }}
            </v-card-text>
            <v-card-text class="body-1 justify-start font-weight-light pa-0 ma-1">
              更新日 : {{ item.updatedAt.toDate().toLocaleString('ja-JP').slice( 0, -3 ) }}
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-row>
  </v-container>
</template>

<script>
  // import { db } from '../../plugins/firebase.js'
  import firebase from 'firebase/app'
  import 'firebase/firestore'
  import 'firebase/auth'
  import 'firebase/storage'
  const db = firebase.firestore()
  const partnerId = firebase.auth().currentUser.uid

  export default {
    name: 'Option',
    data: () => ({
      options: [],
    }),
    created () {
      this.optionsView()
    },
    methods: {
      optionsView: function () {
        this.options = [] // 呼び出される度に一度空にする
        db.collection('partners').doc(partnerId).collection('options').orderBy('updatedAt', 'desc').get().then((snapshot) => {
          snapshot.forEach((doc) => {
            const option = doc.data()
            this.options.push(option)
          })
        })
      },
      toOptionCreate: function () {
        // option_idを新規発行
        const newOptionDoc = db.collection('partners').doc(partnerId).collection('options').doc()
        this.$store.commit('SET_OPTION_ID', newOptionDoc.id)
        this.$router.push('optionEdit')
      },
      toOptionEdit: function (optionId) {
        this.$store.commit('SET_OPTION_ID', optionId)
        this.$router.push('optionEdit')
      },
    },
  }
</script>
