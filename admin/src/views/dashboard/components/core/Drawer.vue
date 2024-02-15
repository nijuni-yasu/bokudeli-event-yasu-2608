<template>
  <v-navigation-drawer
    id="core-navigation-drawer"
    v-model="drawer"
    :dark="barColor !== 'rgba(228, 226, 226, 1), rgba(255, 255, 255, 0.7)'"
    :expand-on-hover="expandOnHover"
    :right="$vuetify.rtl"
    :src="barImage"
    mobile-break-point="960"
    app
    mini-variant-width="80"
    width="260"
    v-bind="$attrs"
  >
    <template v-slot:img="props">
      <v-img
        :gradient="`to bottom, ${barColor}`"
        v-bind="props"
      />
    </template>

    <v-list-item two-line>
      <v-list-item-content>
        <v-list-item-title class="font-weight-regular">
          <div class="display-3">
            <span class="logo-mini">❤️</span>
            <span class="logo-normal">shokujii</span>
          </div>
          <div class="display-1">
            <span class="logo-mini">😋</span>
            <span class="logo-normal">（旧ぼくデリ）</span>
          </div>
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-divider class="mb-1" />

    <v-list
      expand
      nav
    >
      <!-- Style cascading bug  -->
      <!-- https://github.com/vuetifyjs/vuetify/pull/8574 -->
      <div />

      <template v-for="(item, i) in items">
        <base-item
          :item="item"
        />
      </template>
      <base-item
        :item="{ icon: 'mdi-logout', title: 'ログアウト' }"
        @click.native="clickLogOut"
      />

      <!-- Style cascading bug  -->
      <!-- https://github.com/vuetifyjs/vuetify/pull/8574 -->
      <div />
      <v-divider class="mb-2" />

      <div class="username my-4 ml-4">
        {{ shopDoc.shop_name }} <br>
        {{ partner_email }} <br>
      </div>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
  // Utilities
  import {
    mapState,
  } from 'vuex'
  import firebase from 'firebase/app'
  import 'firebase/auth'
  import 'firebase/firestore'
  const db = firebase.firestore()

  export default {
    props: {
      expandOnHover: {
        type: Boolean,
        default: true,
      },
    },
    data: () => ({
      partner_email: '',
      partner_id: '',
      shopDoc: {},
      items: [
        {
          icon: 'mdi-home',
          title: 'HOME',
          to: '/',
        },
        {
          icon: 'mdi-storefront-outline',
          title: '店舗設定',
          to: '/shop',
        },
        {
          icon: 'mdi-food-fork-drink',
          title: 'メニュー設定',
          to: '/menu',
        },
        {
          icon: 'mdi-bicycle',
          title: '注文一覧',
          to: '/order',
        },
        {
          icon: 'mdi-lightbulb-on-outline',
          title: '店舗マニュアル',
          href: 'https://drive.google.com/drive/folders/1R40T-y5WqHRZu5ANILIQxgagqoBTlgSr?usp=sharing',
        },
      ],
    }),
    computed: {
      ...mapState(['barColor', 'barImage']),
      drawer: {
        get () {
          return this.$store.state.drawer
        },
        set (val) {
          this.$store.commit('SET_DRAWER', val)
        },
      },
    },
    watch: {
      '$vuetify.breakpoint.smAndDown' (val) {
        this.$emit('update:expandOnHover', !val)
      },
    },
    created () {
      this.partner_id = firebase.auth().currentUser.uid
      this.partner_email = firebase.auth().currentUser.email
      db.collection('partners').doc(this.partner_id).collection('shops').get().then((snapshot) => {
        snapshot.forEach((doc) => {
            this.shopDoc = doc.data()
        })
      })
    },
    methods: {
      clickLogOut: function () {
        // this.shop_name = ''
        this.shopDoc = {}
        this.partner_email = ''
        this.partner_id = ''
        firebase.auth().signOut().then(() => {
          // alert('LogOut!')
          this.$router.push('/pages/login')
        })
      },
    },
  }
</script>

<style lang="sass">
  .username
    color: white
    font-size: 14px
  @import '~vuetify/src/styles/tools/_rtl.sass'
  #core-navigation-drawer
    &.v-navigation-drawer--mini-variant
      .v-list-item
        justify-content: flex-start !important

      .v-list-group--sub-group
        display: block !important

    .v-list-group__header.v-list-item--active:before
      opacity: .24

    .v-list-item
      &__icon--text,
      &__icon:first-child
        justify-content: center
        text-align: center
        width: 20px

        +ltr()
          margin-right: 24px
          margin-left: 12px !important

        +rtl()
          margin-left: 24px
          margin-right: 12px !important

    .v-list--dense
      .v-list-item
        &__icon--text,
        &__icon:first-child
          margin-top: 10px

    .v-list-group--sub-group
      .v-list-item
        +ltr()
          padding-left: 8px

        +rtl()
          padding-right: 8px

      .v-list-group__header
        +ltr()
          padding-right: 0

        +rtl()
          padding-right: 0

        .v-list-item__icon--text
          margin-top: 19px
          order: 0

        .v-list-group__header__prepend-icon
          order: 2

          +ltr()
            margin-right: 8px

          +rtl()
            margin-left: 8px
</style>
