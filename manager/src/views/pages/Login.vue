<template>
  <v-container
    id="login"
    class="fill-height justify-center"
    tag="section"
  >
    <v-row justify="center">
      <v-slide-y-transition appear>
        <base-material-card
          color="success"
          light
          max-width="95%"
          width="400"
          class="px-5 py-1"
        >
          <template v-slot:heading>
            <div class="text-center">
              <h1 class="display-2 font-weight-bold my-1">
                運営マネージャー
              </h1>
            </div>
          </template>

          <v-card-text class="text-center">
            <v-text-field
              v-model="username"
              color="secondary"
              label="Email..."
              prepend-icon="mdi-email"
            />

            <v-text-field
              v-model="password"
              class="mb-1"
              color="secondary"
              label="Password..."
              type="password"
              prepend-icon="mdi-lock-outline"
            />

            <pages-btn
              large
              color=""
              depressed
              class="display-1 v-btn--text success--text"
              @click="logIn"
            >
              ログイン
            </pages-btn>
            <div class="text-center">
              <h1 class="caption my-5">
                ログインできない場合はサポートにご連絡ください<br>
                MAIL : support@nijuni.jp / TEL : 050-3580-5122
              </h1>
            </div>
          </v-card-text>
        </base-material-card>
      </v-slide-y-transition>
    </v-row>
  </v-container>
</template>

<script>
  import firebase from 'firebase/app'
  import 'firebase/auth'

  export default {
    name: 'PagesLogin',
    components: {
      PagesBtn: () => import('./components/Btn'),
    },
    data: function () {
      return {
        username: '',
        password: '',
      }
    },
    // created: function () {
    //   setTimeout(function () {
    //     window.alert('新しい店舗管理サイトへリダイレクトします')
    //     location.href = 'https://partner.bokudeli.jp/'
    //   }, 1000)
    // },
    methods: {
      logIn: function () {
        firebase.auth().signInWithEmailAndPassword(this.username, this.password).then(
          user => {
            const loginEmail = firebase.auth().currentUser.email
            if(loginEmail !== 'support+admin@nijuni.jp'){
              firebase.auth().signOut().then(() => {
                window.alert('不正なログインです')
                this.$router.push('/pages/login')
              })
            } else {
              this.$router.push('/')
            }
          },
          err => {
            console.log(err)
            alert(err.message)
            // alert('パスワードが間違っている、もしくはパスワード設定がされていません。ログインできない場合はサポートまでご連絡ください。')
          },
        )
      },
    },
  }
</script>
