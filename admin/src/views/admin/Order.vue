<template>
  <v-container
    id="regular-tables"
    fluid
    tag="section"
  >
    <base-material-card
      inline
      icon="mdi-truck"
      class="px-5 py-3"
    >
      <div
        v-if="events.length === 0"
        class="display-2 my-6 mx-5"
      >
        注文履歴はありません
      </div>
      <div v-else>
        <v-simple-table>
          <thead>
            <tr>
              <th>ID</th>
              <th>イベント名</th>
              <th>開始日時</th>
              <th>注文期限</th>
              <th>開催場所</th>
              <th>注文個数</th>
              <th>注文金額</th>
              <th>ステータス</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(event,key) in selectedEvents"
              :key="key"
            >
              <td>{{ event.eventId.slice(0, 6) }}</td>
              <td>
                <router-link :to="{ name: 'orderDetail', params: { id: event.eventId } }">
                  {{ event.eventName }}
                </router-link>
              </td>
              <td>{{ millisToDateTimeString(event.eventStartDatetime) }}</td>
              <td>{{ millisToDateTimeString(event.eventDeadlineDatetime) }}</td>
              <td>{{ event.eventAddress }}</td>
              <td>{{ event.orderCount }}</td>
              <td>{{ event.orderTotalPrice }}</td>
              <td>{{ event.eventStatus }}</td>
            </tr>
          </tbody>
        </v-simple-table>
      </div>
    </base-material-card>
  </v-container>
</template>

<script>
  import Vue from 'vue'
  import firebase from 'firebase/app'
  import 'firebase/firestore'
  import 'firebase/auth'
  import { millisToDateTimeString } from '@/methods/date'

  const db = firebase.firestore()
  const partnerId = firebase.auth().currentUser.uid

  export default {
    name: 'Orders',

    data: () => ({
      events: [],
      orders: [],
    }),
    computed: {
      selectedEvents () {
        return Array.from(this.events)
          .sort((a, b) => {
            return a.eventStartDatetime - b.eventStartDatetime
          })
          .filter((event) => {
            //
            return true
          })
      },
    },
    created () {
      this.initEvents()
    },
    methods: {
      millisToDateTimeString,
      initEvents: async function () {
        // 全てのイベントから注文店舗のイベントを取得
        const eventsSnapshot = await db.collectionGroup('events').where('partner_id', '==', partnerId).get()
        // initEvents は created() 内で1度きりしか呼んではいけない
        // forEach 内の async は非同期呼び出しになるので、アップデートがかかる場合は排他制御が必要
        eventsSnapshot.forEach(async (eventSnapshot) => {
          const communityId = eventSnapshot.get('community_id')
          const eventId = eventSnapshot.get('event_id')
          const orders = await db.collection('communities').doc(communityId).collection('events').doc(eventId).collection('orders').where('status', '==', 'ordered').get()
          let orderCount = 0
          let orderTotalPrice = 0
          orders.forEach((order) => {
            order.get('menus').forEach((menu) => {
              orderCount += menu.count
              orderTotalPrice += menu.price * menu.count
            })
          })
          Vue.set(this.events, this.events.length, {
            eventId,
            eventName: eventSnapshot.get('event_name'),
            eventStartDatetime: eventSnapshot.get('event_start_datetime')?.toMillis(),
            eventDeadlineDatetime: eventSnapshot.get('event_deadline_datetime')?.toMillis(),
            eventAddress: eventSnapshot.get('event_address'),
            orderCount,
            orderTotalPrice,
          })
        })
      },
    },
  }
</script>
