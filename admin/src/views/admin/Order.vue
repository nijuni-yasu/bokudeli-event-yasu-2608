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
              <td>{{ event.event_id.slice(0, 6) }}</td>
              <td>
                <router-link :to="{ name: 'orderDetail', params: { id: event.event_id } }">
                  {{ event.event_name }}
                </router-link>
              </td>
              <td>{{ millisToDateTimeString(event.event_start_datetime) }}</td>
              <td>{{ millisToDateTimeString(event.event_deadline_datetime) }}</td>
              <td>{{ event.event_address }}</td>
              <td>{{ event.orders.length }}</td>
              <td>¥{{ event.orders.totalPrice }}</td>
              <td>{{ $t(`event_status/${event.event_status}`) }}</td>
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
  import { Event } from '@/models/Event'
  import { Orders } from '@/models/Orders'

  const db = firebase.firestore()
  const partnerId = firebase.auth().currentUser.uid

  export default {
    data: () => ({
      events: [],
    }),
    computed: {
      selectedEvents () {
        return Array.from(this.events)
          .sort((a, b) => {
            return a.event_start_datetime - b.event_start_datetime
          })
          .filter((event) => {
            return event.status !== 'in_draft'
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
          const event = new Event(eventSnapshot)
          const communityId = eventSnapshot.get('community_id')
          const eventId = eventSnapshot.get('event_id')
          const ordersSnapshot = await db.collection('communities').doc(communityId).collection('events').doc(eventId).collection('orders').where('status', '==', 'ordered').get()
          event.orders = new Orders(ordersSnapshot)
          Vue.set(this.events, this.events.length, event)
        })
      },
    },
  }
</script>
