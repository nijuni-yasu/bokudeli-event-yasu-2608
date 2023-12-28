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
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>
            mdi-food-fork-drink
          </v-icon>
          <modal-menu-form
            justify="start"
            title="メニューを追加する"
            card_title="メニューの追加"
            @menu-added-event="menuView"
          />
        </v-btn>
      </v-col>

      <v-col
        v-for="(item,key) in menus"
        :key="key"
        cols="12"
        sm="4"
        md="3"
      >
        <base-material-card
          color="transparent"
          image
          hover-reveal
        >
          <template v-slot:image>
            <v-img
              :src="item.menu_image_url"
              aspect-ratio="1"
            >
              <template v-slot:placeholder>
                <v-row
                  class="fill-height ma-0"
                  align="center"
                  justify="center"
                >
                  <v-progress-circular
                    indeterminate
                    color="grey lighten-5"
                  />
                </v-row>
              </template>
            </v-img>
          </template>

          <template v-slot:reveal-actions>
            <v-tooltip bottom>
              <template v-slot:activator="{ attrs, on }">
                <v-btn
                  class="mx-1"
                  color="white"
                  :elevation="0"
                  v-bind="attrs"
                  v-on="on"
                >
                  <modal-menu-form
                    justify="start"
                    class="success--text"
                    card_title="メニューの編集"
                    icon="mdi-pencil"
                    :menu_id="item.menu_id"
                    :menu_name="item.menu_name"
                    :menu_description="item.menu_description"
                    :menu_price="item.menu_price"
                    :menu_stock_per_event="item.menu_stock_per_event"
                    :is_soldout="item.is_soldout"
                    :menu_date_start="item.menu_date_start"
                    :menu_date_end="item.menu_date_end"
                    @menu-added-event="menuView"
                  />
                </v-btn>
              </template>
              <span>編集</span>
            </v-tooltip>
            <v-tooltip bottom>
              <template v-slot:activator="{ attrs, on }">
                <v-btn
                  v-bind="attrs"
                  class="mx-1"
                  color="error"
                  light
                  icon
                  v-on="on"
                  @click="deleteMenu(item.menu_id)"
                >
                  <v-icon class="error--text">
                    mdi-close
                  </v-icon>
                </v-btn>
              </template>
              <span>削除</span>
            </v-tooltip>
          </template>

          <v-card-title class="display-2 justify-start mt-3 font-weight-bold pb-2">
            {{ item.menu_name }}
          </v-card-title>
          <v-card-text class="justify-start font-weight-light py-1">
            {{ item.menu_description }}
          </v-card-text>
          <v-card-text class="display-2 font-weight-light pt-1 pb-10">
             ¥{{ item.menu_price }}
          </v-card-text>
          <v-card-text
            v-if="item.menu_date_start&&item.menu_date_end"
            class="py-2 red--text"
          >
            【期間限定】{{ item.menu_date_start }}〜{{ item.menu_date_end }}
          </v-card-text>
          <v-card-text
            v-if="item.menu_stock_per_event"
            class="font-weight-light py-2 red--text"
          >
            【1イベントの上限数】 {{ item.menu_stock_per_event }} 個
          </v-card-text>
          <v-card-text
            v-if="item.is_soldout==true"
            class="py-2 red--text"
          >
            【売切設定】売り切れ
          </v-card-text>
        </base-material-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  import firebase from 'firebase/app'
  import 'firebase/firestore'
  import 'firebase/storage'

  const db = firebase.firestore()

  export default {
    name: 'Menu',
    components: {
      ModalMenuForm: () => import('../admin/ModalMenuForm'),
    },

    data: () => ({
      menus: [],
      partner_id: '',
    }),
    created () {
      this.menuView()

    },
    methods: {
      menuView: function () {
        const me = this
        me.menus = []
        db.collection('partners').doc(me.$store.state.partner_id).collection('menus').orderBy('updatedAt', 'desc').get().then((snapshot) => {
          snapshot.forEach((menuDoc) => {
            const menu = menuDoc.data()
            menu.menu_id = menuDoc.id
            if (!menu.is_deleted) {
              me.menus.push(menu)
            }
          })
        })
      },
      deleteMenu: function (menuId) {
        const me = this
        if (confirm('メニューを削除しますか？')) {
          db.collection('partners').doc(me.$store.state.partner_id).collection('menus').doc(menuId).delete().then(() => {
            window.alert('メニューを削除しました')
            me.menuView()
          }).catch((error) => {
            window.alert('メニューを削除できませんでした')
            console.error(error)
          })
        }
      },
    },
  }
</script>
