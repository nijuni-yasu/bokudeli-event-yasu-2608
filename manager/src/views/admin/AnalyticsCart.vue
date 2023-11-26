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
      icon="mdi-clipboard-text"
      title="カート情報"
      class="px-5 py-3"
    >
      <v-simple-table>
        <thead>
          <tr>
            <th class="primary--text">
              #
            </th>
            <th class="primary--text">
              カート作成日
            </th>
            <th class="primary--text">
              カート更新日
            </th>
            <th class="primary--text">
              店舗
            </th>
            <th class="primary--text">
              type
            </th>
            <th class="primary--text">
              id
            </th>
            <th class="primary--text">
              作成者
            </th>
            <th class="primary--text">
              更新者
            </th>
            <th
              class="primary--text"
              style="width:400px;"
            >
              注文内容
            </th>
            <th class="primary--text">
              郵便番号
            </th>
            <th class="primary--text">
              住所
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(item,key) in carts"
            :key="key"
            cols="12"
            sm="12"
            md="6"
          >
            <td>{{ key + 1 }}</td>
            <!-- <td>{{ item.updatedAt }}</td> -->
            <td>{{ item.createdAt.toDate().toLocaleString('ja-JP').slice( 0, -3 ) }}</td>
            <td>{{ item.updatedAt.toDate().toLocaleString('ja-JP').slice( 0, -3 ) }}</td>
            <!-- <td>{{ item.updatedAt.toDate().getFullYear() + '/' + (Number(item.updatedAt.toDate().getMonth()) + 1) + '/' +item.updatedAt.toDate().getDate() }}</td>
            <td>{{ item.createdAt.toDate().getFullYear() + '/' + (Number(item.createdAt.toDate().getMonth()) + 1) + '/' +item.createdAt.toDate().getDate() }}</td> -->
            <td>{{ item.shop_name }}</td>
            <td>{{ item.room_type }}</td>
            <td>{{ item.room_id.slice(0, 6) }}</td>
            <td>{{ item.createdBy }}</td>
            <td>{{ item.updatedBy }}</td>
            <td>
              <div
                v-for="(item,key) in item.menus"
                :key="key"
              >
                {{ item.menu_name }} ¥{{ item.menu_price }} {{ item.user_lineName }}
                <span
                  v-if="item.is_canceled"
                  class="primary--text"
                >
                  (x)<br>
                </span>
              </div>
            </td>
            <td>{{ item.user_postcode }}</td>
            <td>{{ item.user_address }}</td>
          </tr>
        </tbody>
      </v-simple-table>
    </base-material-card>
  </v-container>
</template>

<script>
  import firebase from 'firebase/app'
  import 'firebase/firestore'
  import 'firebase/auth'

  const db = firebase.firestore()
  // const partnerId = firebase.auth().currentUser.uid

  export default {
    name: 'AnalyticsCart',

    data: () => ({
      carts: [],
    }),
    created () {
      // パートナー別の個別データ
      // db.collection('orders').where('partner_id', '==', partnerId).orderBy('order_date', 'desc').get().then((snapshot) => {
      //   snapshot.forEach((doc) => {
      //     this.orders.push(doc.data())
      //   })
      // })
      // すべての注文情報を取得し、simpleTableに表示
      // db.collection('orders').orderBy('createdAt', 'desc').get().then((snapshot) => {
      //   snapshot.forEach((doc) => {
      //     this.orders.push(doc.data())
      //   })
      // })
      db.collectionGroup('carts').orderBy('updatedAt', 'desc').get().then((snapshot) => {
        snapshot.forEach((doc) => {
          this.carts.push(doc.data())
        })
      })
    },
    methods: {
    },
  }
</script>
