<template>
  <v-container
    v-if="event != null"
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
          :title="$t(`event_status/${event.event_status}`)"
        >
          <div class="mt-5">
            <p>【イベントID】{{ event.event_id }}</p>
            <p>【イベント名】{{ event.event_name }}</p>
            <p>
              【イベントURL】
              <a
                :href="event.url"
                target="_blank"
              >
                {{ event.url }}
              </a>
            </p>
            <p>【配送日時】{{ millisToDateTimeString(event.event_start_datetime - 30 * 60 * 1000) }}〜{{ millisToTimeString(event.event_start_datetime) }}</p>
            <p>【注文期限】{{ millisToDateTimeString(event.event_deadline_datetime) }}</p>
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
          <div v-else-if="event.orders.length !== 0">
            <h2 class="mt-10">
              注文内容
            </h2>
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
                  v-for="(order, key) in event.orders"
                  :key="`order-${key}`"
                >
                  <td>{{ key + 1 }}</td>
                  <td>{{ order.name }}</td>
                  <td>¥{{ order.price }}</td>
                  <td>{{ order.user.user_name }}</td>
                  <td>{{ millisToDateTimeString(order.created_at) }}</td>
                </tr>
              </tbody>
            </v-simple-table>
            <h2 class="mt-10">
              メニュー別小計
            </h2>
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
                  v-for="(subtotalOrder,key) in event.orders.getSubtotalOrders()"
                  :key="`total-${key}`"
                >
                  <td>{{ key + 1 }}</td>
                  <td>{{ subtotalOrder.name }}</td>
                  <td>{{ subtotalOrder.count }}</td>
                  <td>¥{{ subtotalOrder.price }}</td>
                  <td>¥{{ subtotalOrder.price * subtotalOrder.count }}</td>
                </tr>
              </tbody>
            </v-simple-table>
            <h2 class="mt-10">
              合計
            </h2>
            <v-simple-table>
              <thead>
                <tr>
                  <th>合計個数</th>
                  <th>合計金額</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><h1>{{ event.orders.length }}</h1></td>
                  <td><h1>¥{{ event.orders.totalPrice }}</h1></td>
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
  import { millisToDateTimeString, millisToTimeString } from '@/methods/date'
  import { Event } from '@/models/Event'
  import { Orders } from '@/models/Orders'

  const db = firebase.firestore()

  // TODO validate ID
  export default {
    data () {
      return {
        event: null,
        radio01: 0,
        text01: '',
      }
    },
    created () {
      this.initEvent()
    },
    methods: {
      millisToDateTimeString,
      millisToTimeString,
      async initEvent () {
        const eventsSnapshot = await db.collectionGroup('events').where('event_id', '==', this.$route.params.id).get()
        const eventSnapshot = eventsSnapshot.docs[0]
        const event = new Event(eventSnapshot)
        const communityId = eventSnapshot.get('community_id')
        const eventId = eventSnapshot.get('event_id')
        const ordersSnapshot = await db.collection('communities').doc(communityId).collection('events').doc(eventId).collection('orders').where('status', '==', 'ordered').get()
        event.orders = new Orders(ordersSnapshot)
        for (const order of event.orders) {
          const userSnapshot = await db.collection('users').doc(order.user_id).get()
          Object.assign(order, { user: userSnapshot.data() })
        }
        this.event = event
      },
      validateForm () {
        console.log(this.radio01)
        console.log(this.text01)
      },
    },
  }
</script>
