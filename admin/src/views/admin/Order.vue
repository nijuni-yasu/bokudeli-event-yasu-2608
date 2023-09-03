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
      v-if="events.length==0"
      class="display-2 my-6 mx-5"
    >
      注文履歴はありません
    </div>
    <div v-else>
      <v-row>
        <v-col
          v-for="(event,key) in events"
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
                    イベントID
                  </td>
                  <td>{{ event.event_id }}</td>
                </tr>
                <tr>
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:0px 8px;"
                  >
                    イベント名
                  </td>
                  <td>{{ event.event_name }}</td>
                </tr>
                <tr>
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:0px 8px;"
                  >
                    イベント開始日時
                  </td>
                  <td>{{ event.event_start_datetime.toDate().toLocaleString('ja-JP').slice( 0, -3 ) }}</td>
                </tr>
                <tr>
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:0px 8px;"
                  >
                    注文締切日時
                  </td>
                  <td>{{ event.event_deadline_datetime.toDate().toLocaleString('ja-JP').slice( 0, -3 ) }}</td>
                </tr>
                <tr>
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:12px 8px;"
                  >
                    配送日時
                  </td>
                  <td>
                    ※イベント開始時刻の15分前にはお届けしてください。
                  </td>
                </tr>
                <tr>
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:0px 8px;"
                  >
                    開催場所
                  </td>
                  <td>{{ event.event_address }}</td>
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
                    主催者名
                  </td>
                  <td>{{ event.community_name }}</td>
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
                      :href="`tel:${event.community_phone}`"
                    >
                      {{ event.community_phone }}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:0px 8px;"
                  >
                    メールアドレス
                  </td>
                  <td>{{ event.community_email }}</td>
                </tr>

                <tr>
                  <td
                    class="primary--text"
                    style="width:100px; font-size:10.5px; padding:0px 8px;"
                  >
                    配送メモ
                  </td>
                  <td>{{ event.user_memo }}</td>
                </tr>
              </tbody>
            </v-simple-table>
            <v-simple-table
              class="my-5"
            >
              <thead>
                <tr>
                  <th class="primary--text">
                    #
                  </th>
                  <th class="primary--text">
                    なまえ
                  </th>
                  <th class="primary--text">
                    メニュー（金額 x 個数）
                  </th>
                  <th class="primary--text">
                    小計
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(userOrder,index, key) in event.userOrders"
                  :key="key"
                >
                  <td>{{ index + 1 }}</td>
                  <td>{{ userOrder.userInfo.user_name }}</td>
                  <td>
                    <div
                      v-for="(menu,key) in userOrder.menus"
                      :key="key"
                    >
                      <div> {{ menu.name }} （ ¥{{ menu.price }} x {{ menu.count }}個）</div>
                    </div>
                  </td>
                  <td>¥{{ userOrder.subtotal }}</td>
                </tr>
              </tbody>
            </v-simple-table>
            <v-simple-table
              class="ma-3"
            >
              <tbody>
                <tr>
                  <td
                    class="display-2"
                  >
                    決済数: {{ event.userOrders.length }}
                  </td>
                  <td
                    class="display-2"
                  >
                    メニュー数: {{ event.eventTotalCount }}個
                  </td>
                  <td
                    class="display-2"
                  >
                    合計金額: ¥{{ event.eventTotalPrice }}
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
    name: 'Orders',

    data: () => ({
      events: [],
      orders: [],
    }),
    created: async function () {
      this.events = await this.getEvetsOrders()
      console.log(this.events)
    },
    methods: {
      dateFormat: function (date) {
        const d = Number(date.slice(0, 4)) + '/' + Number(date.slice(5, 7)) + '/' + Number(date.slice(8, 10))
        return d
      },
      getEvetsOrders: async function () {
        return new Promise((resolve, reject) => {
          const events = []
          // 全てのイベントから注文店舗のイベントを取得
          db.collectionGroup('events').where('partner_id', '==', partnerId).get().then((snapshot) => {
            snapshot.forEach((doc) => {
              events.push(doc.data())
            })
            // イベントの個々の注文情報を追加
            events.forEach((event) => {
              event.userOrders = []
              console.log(event)
              db.collection('communities').doc(event.community_id).collection('events').doc(event.event_id).collection('orders').where('status', '==', 'ordered').get().then((snapshot) => {
                event.eventTotalPrice = 0
                event.eventTotalCount = 0
                snapshot.forEach((order) => {
                  const userOrder = order.data()
                  userOrder.subtotal = 0
                  userOrder.menus.forEach((menu) => {
                    userOrder.subtotal += menu.price * menu.count
                    event.eventTotalPrice += menu.price * menu.count
                    event.eventTotalCount += menu.count
                  })
                  // 個々の注文情報からユーザー名を取得
                  db.collection('users').doc(userOrder.user_id).get().then((doc) => {
                    userOrder.userInfo = doc.data()
                    event.userOrders.push(userOrder)
                  })
                })
              })
            })
            resolve(events)
          })
        })
      },
    },
  }
</script>
