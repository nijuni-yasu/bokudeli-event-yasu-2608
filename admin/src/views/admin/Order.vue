<template>
  <v-container
    id="regular-tables"
    tag="section"
  >
    <!-- <base-v-component
      heading="Simple Tables"
      link="components/simple-tables"
    /> -->
    <div
      v-if="orders.length==0"
      class="display-2 my-6 mx-5"
    >
      注文履歴はありません
    </div>
    <div v-else>
      <v-row>
        <v-col
          v-for="(item,key) in orders"
          :key="key"
          cols="12"
          sm="12"
          md="6"
        >
          <base-material-card
            inline
            icon="mdi-bicycle"
            class="px-5 py-2"
          >
            <v-simple-table
              dense
              class="my-5"
            >
              <tbody>
                <tr>
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:0px 8px;"
                  >
                    注文ID
                  </td>
                  <td>{{ item.order_simple_id }}</td>
                </tr>
                <tr>
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:0px 8px;"
                  >
                    注文日時
                  </td>
                  <td>{{ item.createdAt.toDate().toLocaleString('ja-JP').slice( 0, -3 ) }}</td>
                </tr>
                <tr>
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:12px 8px;"
                  >
                    配送日時
                  </td>
                  <td>
                    <span class="display-2">{{ item.order_date.toDate().toLocaleString('ja-JP').slice( 0, -3 ) }}</span><br>
                    <span style="font-size:9px;">※注文時に前後15分の時間幅を了承いただいています。</span>
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
            <v-simple-table
              dense
              class="my-5"
            >
              <tbody>
                <tr>
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:0px 8px;"
                  >
                    会社名
                  </td>
                  <td
                    v-if="item.user_companyName"
                  >
                    {{ item.user_companyName }}
                  </td>
                  <td
                    v-else
                  >
                    −
                  </td>
                </tr>
                <tr>
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:0px 8px;"
                  >
                    注文者名
                  </td>
                  <td>{{ item.user_fullName }}</td>
                </tr>
                <tr>
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:0px 8px;"
                  >
                    電話番号
                  </td>
                  <td>
                    <a
                      target="_blank"
                      :href="`tel:${item.user_phone}`"
                    >
                      {{ item.user_phone }}
                    </a>
                    <!-- {{ item.user_phone.slice( 0, 3 ) }}-{{ item.user_phone.slice( 3, 7 ) }}-{{ item.user_phone.slice( 7, 11 ) }} -->
                  </td>
                </tr>
                <tr
                  v-if="item.user_address1"
                >
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:0px 8px;"
                  >
                    配送住所
                  </td>
                  <td>
                    〒{{ item.user_postcode.slice( 0, 3 ) }}-{{ item.user_postcode.slice( -4 ) }}<br>
                    {{ item.user_address1 }}<br>
                    {{ item.user_address2 }}<br>
                    {{ item.user_address3 }}<br>
                    <a
                      v-if="item.order_map_url"
                      target="_blank"
                      :href="item.order_map_url"
                    >
                      GoogleMap
                    </a>
                  </td>
                </tr>
                <tr
                  v-else-if="item.user_address"
                >
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:0px 8px;"
                  >
                    配送住所
                  </td>
                  <td>
                    〒{{ item.user_postcode.slice( 0, 3 ) }}-{{ item.user_postcode.slice( -4 ) }}<br>
                    {{ item.user_address }}<br>
                  </td>
                </tr>
                <tr>
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:0px 8px;"
                  >
                    配送メモ
                  </td>
                  <td>{{ item.user_memo }}</td>
                </tr>
                <tr>
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:0px 8px;"
                  >
                    支払い方法
                  </td>
                  <td>{{ item.order_method }}</td>
                </tr>
                <tr>
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:0px 8px;"
                  >
                    領収書の有無
                  </td>
                  <td>{{ item.user_receipt }}</td>
                </tr>
                <tr>
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:0px 8px;"
                  >
                    領収書の宛名
                  </td>
                  <td
                    v-if="item.user_receiptName"
                  >
                    {{ item.user_receiptName }}
                  </td>
                  <td
                    v-else
                  >
                    −
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
            <v-simple-table
              class="my-5"
            >
              <thead>
                <tr>
                  <th class="primary--text">
                    メニュー
                  </th>
                  <th class="primary--text">
                    なまえ
                  </th>
                  <th class="primary--text">
                    金額
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item,key) in item.order_menus"
                  :key="key"
                >
                  <td>{{ item.menu_name }}</td>
                  <td
                    v-if="item.user_nickName"
                    style="width:80px;"
                  >
                    {{ item.user_nickName }}
                  </td>
                  <td
                    v-else
                  >
                    –
                  </td>
                  <td>¥{{ item.menu_price }}</td>
                </tr>
                <tr>
                  <td>
                    合計
                  </td>
                  <td
                    class="display-2"
                  >
                    {{ item.order_sum_count }}個
                  </td>
                  <td
                    class="display-2"
                  >
                    ¥{{ item.order_sum_price }}
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
          </base-material-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script>
  import firebase from 'firebase/app'
  import 'firebase/firestore'
  import 'firebase/auth'

  const db = firebase.firestore()
  const partnerId = firebase.auth().currentUser.uid

  export default {
    name: 'History',

    data: () => ({
      orders: [],
    }),
    created () {
      // user情報を取得し、v-modelに表示
      db.collection('orders').where('partner_id', '==', partnerId).orderBy('order_date', 'desc').get().then((snapshot) => {
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
