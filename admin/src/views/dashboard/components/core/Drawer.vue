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
        <v-list-item-title class="text-uppercase font-weight-regular display-2">
          <span class="logo-mini">{{ $t('🧢') }}</span>
          <span class="logo-normal">ぼくデリ</span>
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-divider class="mb-1" />

    <!-- <v-list
      dense
      nav
    >
      <base-item-group :item="profile" />
    </v-list> -->

    <v-list
      expand
      nav
    >
      <!-- Style cascading bug  -->
      <!-- https://github.com/vuetifyjs/vuetify/pull/8574 -->
      <div />

      <template v-for="(item, i) in computedItems">
        <base-item-group
          v-if="item.children"
          :key="`group-${i}`"
          :item="item"
        />

        <base-item
          v-if="item.title=='ログアウト'"
          :key="`item-${i}`"
          :item="item"
          @click.native="clickLogOut"
        />
        <!-- <base-item
          v-if="item.title == 'ログアウト'"
          :key="`item-${i}`"
          :item="item"
          v-on:click="clickLogOut"
          class="hogehoge"
        /> -->

        <base-item
          v-else
          :key="`item-${i}`"
          :item="item"
        />
      </template>

      <!-- Style cascading bug  -->
      <!-- https://github.com/vuetifyjs/vuetify/pull/8574 -->
      <div />
      <v-divider class="mb-2" />

      <div class="username my-4 ml-4">
        {{ shop_name }} <br>
        {{ shop_email }} <br>
      </div>
      <!-- <div class="pl-4">
      <v-btn
        v-on:click="clickLogOut"
        rounded
        small
        max-width
        >
        <v-icon>
          mdi-logout
        </v-icon>
        ログアウト
      </v-btn>
      </div> -->
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
  const partnerId = firebase.auth().currentUser.uid
  let shopDoc = ''

  export default {
    name: 'DashboardCoreDrawer',

    props: {
      expandOnHover: {
        type: Boolean,
        // default: false,
        default: true,
      },
    },

    data: () => ({
      shop_name: '−',
      shop_email: firebase.auth().currentUser.email,
      items: [
        {
          icon: 'mdi-home',
          title: 'HOME',
          to: '/',
        },
        {
          icon: 'mdi-storefront-outline',
          title: '店舗設定',
          to: 'shop',
        },
        {
          icon: 'mdi-food-fork-drink',
          title: 'メニュー設定',
          to: 'menu',
        },
        {
          icon: 'mdi-format-list-bulleted',
          title: 'オプション設定',
          to: 'option',
        },
        {
          icon: 'mdi-bicycle',
          title: '注文一覧',
          to: 'order',
        },
        // {
        //   icon: 'mdi-chart-timeline-variant',
        //   title: '売上分析',
        //   to: '/charts',
        // },
        {
          icon: 'mdi-lightbulb-on-outline',
          title: '店舗マニュアル',
          href: 'https://drive.google.com/drive/folders/1R40T-y5WqHRZu5ANILIQxgagqoBTlgSr?usp=sharing',
        },
        // {
        //   icon: 'mdi-message-alert-outline',
        //   title: 'サポートLINE',
        //   href: 'https://lin.ee/7VwZjvC',
        // },
        // {
        //   icon: 'mdi-account',
        //   title: 'アカウント設定',
        //   to: '/pages/user',
        // },
        {
          icon: 'mdi-logout',
          title: 'ログアウト',
        },
        // {
        //   group: '/pages',
        //   icon: 'mdi-image',
        //   title: 'pages',
        //   children: [
        //     {
        //       title: 'pricing',
        //       to: 'pricing',
        //     },
        //     {
        //       title: 'rtl',
        //       to: 'rtl',
        //     },
        //     {
        //       title: 'timeline',
        //       to: 'timeline',
        //     },
        //     {
        //       title: 'login',
        //       to: 'login',
        //     },
        //     {
        //       title: 'register',
        //       to: 'pricing',
        //     },
        //     {
        //       title: 'lock',
        //       to: 'lock',
        //     },
        //     {
        //       title: 'user',
        //       to: 'user',
        //     },
        //     {
        //       title: 'error',
        //       to: '404',
        //     },
        //   ],
        // },
        // {
        //   group: '/components',
        //   icon: 'mdi-view-comfy',
        //   title: 'components',
        //   children: [
        //     {
        //       title: 'multi',
        //       group: '',
        //       children: [
        //         {
        //           title: 'example',
        //           href: '#',
        //         },
        //       ],
        //     },
        //     {
        //       title: 'buttons',
        //       to: 'buttons',
        //     },
        //     {
        //       title: 'grid',
        //       to: 'grid-system',
        //     },
        //     {
        //       title: 'tabs',
        //       to: 'tabs',
        //     },
        //     {
        //       title: 'notifications',
        //       to: 'notifications',
        //     },
        //     {
        //       title: 'icons',
        //       to: 'icons',
        //     },
        //     {
        //       title: 'typography',
        //       to: 'typography',
        //     },
        //   ],
        // },
        // {
        //   group: '/forms',
        //   icon: 'mdi-clipboard-outline',
        //   title: 'forms',
        //   children: [
        //     {
        //       title: 'rforms',
        //       to: 'regular',
        //     },
        //     {
        //       title: 'eforms',
        //       to: 'extended',
        //     },
        //     {
        //       title: 'vforms',
        //       to: 'validation',
        //     },
        //     {
        //       title: 'wizard',
        //       to: 'wizard',
        //     },
        //   ],
        // },
        // {
        //   group: '/tables',
        //   icon: 'mdi-grid',
        //   title: 'tables',
        //   children: [
        //     {
        //       title: 'rtables',
        //       to: 'regular-tables',
        //     },
        //     {
        //       title: 'etables',
        //       to: 'extended-tables',
        //     },
        //     {
        //       title: 'dtables',
        //       to: 'data-tables',
        //     },
        //   ],
        // },
        // {
        //   group: '/maps',
        //   icon: 'mdi-map-marker',
        //   title: 'maps',
        //   children: [
        //     {
        //       title: 'google',
        //       to: 'google-maps',
        //     },
        //     {
        //       title: 'fullscreen',
        //       to: 'full-screen-map',
        //     },
        //   ],
        // },
        // {
        //   icon: 'mdi-widgets',
        //   title: 'widgets',
        //   to: '/widgets',
        // },
        // {
        //   icon: 'mdi-chart-timeline-variant',
        //   title: 'charts',
        //   to: '/charts',
        // },
        // {
        //   icon: 'mdi-calendar-range',
        //   title: 'calendar',
        //   to: '/calendar',
        // },
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
      computedItems () {
        return this.items.map(this.mapItem)
      },
      profile () {
        return {
          avatar: true,
          group: '',
          title: this.$t('avatar'),
          children: [
            {
              href: '',
              title: this.$t('my-profile'),
            },
            {
              to: '',
              title: this.$t('edit-profile'),
            },
            {
              to: '',
              title: this.$t('settings'),
            },
          ],
        }
      },
    },

    watch: {
      '$vuetify.breakpoint.smAndDown' (val) {
        this.$emit('update:expandOnHover', !val)
      },
    },
    created () {
      db.collection('partners').doc(partnerId).collection('shops').get().then((snapshot) => {
        snapshot.forEach((doc) => {
          shopDoc = doc.data()
        })
        if (shopDoc) {
          if (shopDoc.shop_name) {
            this.shop_name = shopDoc.shop_name
          }
        } else {
          console.log('店舗名なし')
        }
      })
    },
    methods: {
      mapItem (item) {
        return {
          ...item,
          children: item.children ? item.children.map(this.mapItem) : undefined,
          title: this.$t(item.title),
        }
      },
      clickLogOut: function () {
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
