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
      title="Simple Table"
      class="px-5 py-3"
    >
      <v-simple-table>
        <thead>
          <tr>
            <th class="primary--text">
              #
            </th>
            <th class="primary--text">
              ID
            </th>
            <th class="primary--text">
              注文日
            </th>
            <th class="primary--text">
              注文時刻
            </th>
            <th class="primary--text">
              配送日
            </th>
            <th class="primary--text">
              配送時刻
            </th>
            <th class="primary--text">
              店舗
            </th>
            <th class="primary--text">
              注文金額
            </th>
            <th class="primary--text">
              注文個数
            </th>
            <th
              class="primary--text"
              style="width:400px;"
            >
              注文内容
            </th>
            <th class="primary--text">
              注文者名
            </th>
            <th class="primary--text">
              注文会社名
            </th>
            <th class="primary--text">
              注文者郵便番号
            </th>
            <th class="primary--text">
              注文者住所
            </th>
            <th
              class="primary--text"
              style="width:200px;"
            >
              配送メモ
            </th>
            <th class="primary--text">
              支払方法
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(item,key) in orders"
            :key="key"
            cols="12"
            sm="12"
            md="6"
          >
            <td>{{ key + 1 }}</td>
            <td>{{ item.order_simple_id }}</td>
            <td>{{ item.createdAt.toDate().getFullYear() + '/' + (Number(item.createdAt.toDate().getMonth()) + 1) + '/' +item.createdAt.toDate().getDate() }}</td>
            <!-- <td>{{ item.createdAt.toDate().toLocaleString('ja-JP').slice( 0, 9 ) }}</td> -->
            <td>{{ item.createdAt.toDate().toLocaleString('ja-JP').slice( -8 ).slice( 0, 5 ) }}</td>
            <td>{{ item.order_date.toDate().getFullYear() + '/' + (Number(item.order_date.toDate().getMonth()) + 1) + '/' +item.order_date.toDate().getDate() }}</td>
            <!-- <td>{{ item.order_date.toDate().toLocaleString('ja-JP').slice( 0, 9 ) }}</td> -->
            <td>{{ item.order_date.toDate().toLocaleString('ja-JP').slice( -8 ).slice( 0, 5 ) }}</td>
            <!-- <td>{{ item.order_date.toDate().toLocaleString('ja-JP').slice( 0, -3 ) }}</td> -->
            <td>{{ item.shop_name }}</td>
            <td>{{ item.order_sum_price }}</td>
            <td>{{ item.order_sum_count }}</td>
            <td>
              <div
                v-for="(item,key) in item.order_menus"
                :key="key"
              >
                {{ item.menu_name }} ¥{{ item.menu_price }} {{ item.user_nickName }}<br>
              </div>
            </td>
            <td>{{ item.user_fullName }}</td>
            <td>{{ item.user_companyName }}</td>
            <td>{{ item.user_postcode }}</td>
            <!-- <td>{{ item.user_address1 + item.user_address2 + item.user_address3 }}</td> -->
            <td>
              {{ item.user_address1 }}<br>
              {{ item.user_address2 }}<br>
              {{ item.user_address3 }}<br>
            </td>
            <td>{{ item.user_memo }}</td>
            <td>{{ item.order_method }}</td>
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
    name: 'Analytics',

    data: () => ({
      orders: [],
    }),
    created () {
      // パートナー別の個別データ
      // db.collection('orders').where('partner_id', '==', partnerId).orderBy('order_date', 'desc').get().then((snapshot) => {
      //   snapshot.forEach((doc) => {
      //     this.orders.push(doc.data())
      //   })
      // })
      // すべての注文情報を取得し、simpleTableに表示
      db.collection('orders').orderBy('createdAt', 'desc').get().then((snapshot) => {
        snapshot.forEach((doc) => {
          this.orders.push(doc.data())
        })
      })
    },
    methods: {
      dateFormat: function (date) {
        const d = Number(date.slice(0, 4)) + '/' + Number(date.slice(5, 7)) + '/' + Number(date.slice(8, 10))
        return d
      },
    },
  }
</script>
