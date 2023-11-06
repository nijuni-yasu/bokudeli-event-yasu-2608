<template>
  <v-container
    id="regular-tables"
    fluid
    tag="section"
  >
    <v-row justify="center">
      <v-col
        cols="12"
        md="9"
      >
        <base-material-card
          inline
          icon="mdi-truck"
          class="px-5 py-3"
          :title="title"
        >
          <div class="mt-5">
            <p>【イベントID】{{ event.event_id }}</p>
            <p>【イベント名】{{ event.event_name }}</p>
            <p>【イベントURL】
              <a
                :href="getEventUrl(event.community_account, event.event_id)"
                target="_blank"
              >
                {{ getEventUrl(event.community_account, event.event_id) }}
              </a>
            </p>
            <p>【配送日時】{{ millisToDateTimeString(timestampToMillis(event.event_start_datetime, - 30 * 60 * 1000)) }}〜{{ millisToTimeString(timestampToMillis(event.event_start_datetime)) }}</p>
            <p>【注文期限】{{ millisToDateTimeString(timestampToMillis(event.event_deadline_datetime)) }}</p>
            <p>【開催場所】{{ event.event_address }}</p>
            <p>【コミュニティ名】{{ event.community_name }}</p>
            <p>【担当者名】{{ event.organizer_fullname }}</p>
            <p>【会社名】{{ event.organizer_company }}</p>
            <p>【電話番号(個人)】{{ event.organizer_phone_personal }}</p>
            <p>【電話番号(会社)】{{ event.organizer_phone_company }}</p>
            <p>【メールアドレス】{{ event.organizer_email }}</p>
            <p>【配送メモ】{{ event.organizer_memo }}</p>
          </div>
          <div v-if="event.event_status == 'applying_reservation'">
            <validation-observer v-slot="{ handleSubmit }">
              <form @submit.prevent="handleSubmit(validateForm)">
                <v-radio-group
                  v-model="radio01"
                  column
                >
                  <v-radio
                    label="予約を受け付ける"
                    :value="0"
                  />
                  <v-radio
                    label="予約内容の変更を依頼する"
                    :value="1"
                  />
                </v-radio-group>
                <v-text-field
                  v-model="text01"
                  outlined
                  :placeholder="(radio01 === 0) ? 'ご予約ありがとうございます。' : 'この時間は予約がいっぱいのため、日程の変更をお願いできますでしょうか。'"
                />
                <v-btn
                  color="success"
                  default
                  type="submit"
                >
                  主催者に送信する
                </v-btn>
              </form>
            </validation-observer>
          </div>
          <div v-else-if="event.event_status == 'accepting_order'">
            <h2 class="mt-10">注文内容</h2>
            <v-simple-table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>メニュー名</th>
                  <th>金額</th>
                  <th>名前</th>
                  <th>注文時刻</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(order,key) in orders"
                  :key="`order-${key}`"
                >
                  <td>{{ key + 1 }}</td>
                  <td>{{ order.menu_name }}</td>
                  <td>¥{{ order.menu_price }}</td>
                  <td>{{ order.user_name }}</td>
                  <td>{{ millisToDateTimeString(order.order_datetime) }}</td>
                </tr>
              </tbody>
            </v-simple-table>
            <h2 class="mt-10">メニュー別小計</h2>
            <v-simple-table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>メニュー名</th>
                  <th>個数</th>
                  <th>単価</th>
                  <th>小計</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(order,key) in ordersTotal"
                  :key="`total-${key}`"
                >
                  <td>{{ key + 1 }}</td>
                  <td>{{ order.menu_name }}</td>
                  <td>{{ order.count }}</td>
                  <td>¥{{ order.menu_price }}</td>
                  <td>¥{{ order.menu_price * order.count }}</td>
                </tr>
              </tbody>
            </v-simple-table>
            <h2 class="mt-10">合計</h2>
            <v-simple-table>
              <thead>
                <tr>
                  <th>合計個数</th>
                  <th>合計金額</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><h1>{{ ordersTotal.reduce((sum, o) => sum + o.count, 0) }}</h1></td>
                  <td><h1>¥{{ ordersTotal.reduce((sum, o) => sum + o.count * o.menu_price, 0) }}</h1></td>
                </tr>
              </tbody>
            </v-simple-table>
          </div>
        </base-material-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  import firebase from 'firebase/app'
  import 'firebase/firestore'
  import 'firebase/auth'
  import { timestampToMillis, millisToDateTimeString, millisToTimeString } from '@/methods/date'
  import { getEventUrl } from '@/methods/event'

  const db = firebase.firestore()

  // TODO validate ID
  export default {
    data () {
      return {
        event: {},
        orders: [],
        radio01: 0,
        text01: '',
      }
    },
    computed: {
      title () {
        switch (this.event.event_status) {
          case 'applying_reservation':
            return '予約申請中'
          case 'accepting_order':
            return '注文受付中'
          default:
            return ''
        }
      },
      ordersTotal () {
        const orders = new Map()
        this.orders.forEach((order) => {
          const o = orders.get(order.menu_name)
          if (o === undefined) {
            orders.set(order.menu_name, {
              menu_name: order.menu_name,
              menu_price: order.menu_price,
              count: 1,
            })
          } else {
            o.count++
          }
        })
        return Array.from(orders.values())
      },
    },
    created () {
      this.initEvent()
    },
    methods: {
      timestampToMillis,
      millisToDateTimeString,
      millisToTimeString,
      getEventUrl,
      async initEvent () {
        const eventsSnapshot = await db.collectionGroup('events').where('event_id', '==', this.$route.params.id).get()
        this.event = eventsSnapshot.docs[0].data()
        const ordersSnapshot = await db.collection('communities').doc(this.event.community_id).collection('events').doc(this.event.event_id).collection('orders').get()
        // TODO ヘルパー関数に切り出す
        const orders = []
        ordersSnapshot.forEach((order) => {
          orders.push(order.data())
        })
        for (const order of orders) {
          const userSnapshot = await db.collection('users').doc(order.user_id).get()
          for (const menu of order.menus) {
            Object.assign(order, {
              menu_name: menu.name,
              menu_price: menu.price,
              user_name: userSnapshot.get('user_name'),
              order_datetime: order.created_at?.toMillis(),
            })
          }
        }
        this.orders = orders
      },
      validateForm () {
        console.log(this.radio01)
        console.log(this.text01)
      },
    },
  }
</script>
