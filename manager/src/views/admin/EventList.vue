<template>
  <v-container
    id="regular-tables"
    fluid
    tag="section"
  >
    <base-material-card
      inline
      icon="mdi-calendar"
      title="イベント一覧"
      class="px-5 py-3"
    >
      <v-simple-table
        class="body-1"
      >
        <thead>
          <tr>
            <th class="primary--text px-1">
              #
            </th>
            <th class="primary--text px-1 table1">
              コミュニティ名
            </th>
            <th class="primary--text px-1 table1">
              イベント名
            </th>
            <th class="primary--text px-1 table1">
              店舗名
            </th>
            <th class="primary--text px-1 table1">
              開催場所
            </th>
            <th class="primary--text px-1">
              開催日時
            </th>
            <th class="primary--text px-1">
              注文締切
            </th>
            <th class="primary--text px-1">
              定員
            </th>
            <th class="primary--text px-1">
              支払い
            </th>
            <th class="primary--text px-1 table2">
              公開/限定公開
            </th>
            <th class="primary--text px-1">
              会社名<br>
              担当者名
            </th>
            <th class="primary--text px-1">
              電話番号(会社)<br>
              電話番号(個人)<br>
              email
            </th>
            <th class="primary--text px-1 table1">
              配送メモ
            </th>
            <th class="primary--text px-1 table2">
              ステータス
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(event,key) in selectedEvents"
            :key="key"
          >
            <td class="px-1">{{ key + 1 }}</td>
            <td class="px-1 table1">{{ event.community_name }}</td>
            <td class="px-1 table1">
              <a
                :href="event.url"
                target="_blank"
              >
                {{ event.event_name }}
              </a>
            </td>
            <td class="px-1 table1">{{ event.shop_name }}</td>
            <td class="px-1 table1">
              {{ event.event_postalcode }}<br>
              {{ event.event_address }}
            </td>
            <td class="px-1">
              {{ millisToDateTimeString(event.event_start_datetime) }}<br>
              ~{{ millisToDateTimeString(event.event_end_datetime) }}
            </td>
            <td class="px-1">{{ millisToDateTimeString(event.event_deadline_datetime) }}</td>
            <td class="px-1">{{ event.event_max_people }}</td>
            <td class="px-1">{{ event.event_payment }}</td>
            <td class="px-1 table2">{{ $t((event.is_public) ? '一般公開' : '限定公開') }}</td>
            <td class="px-1">
                {{ event.organizer_company }}<br>
                {{ event.organizer_fullname }}
            </td>
            <td class="px-1">
                [会社]{{ event.organizer_phone_company }}<br>
                [個人]{{ event.organizer_phone_personal }}<br>
                [Email]{{ event.organizer_email }}
            </td>
            <td class="px-1 table1">{{ event.organizer_memo }}</td>
            <td class="px-1 table2">{{ $t((event.event_status) ? `event_status/${event.event_status.value}` : '') }}</td>
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
  import { millisToDateTimeString, millisToTimeString } from '@/methods/date'
  import { Event } from '@/models/Event'

  const db = firebase.firestore()

  export default {
    name: 'Analytics',

    data: () => ({
      events: [],
    }),
    computed: {
      selectedEvents () {
        return Array.from(this.events)
          .sort((a, b) => {
            return b.event_start_datetime - a.event_start_datetime
          })
      },
    },
    created () {
      this.initEvents()
    },
    methods: {
      millisToDateTimeString,
      initEvents: async function () {
        const self = this
        // 全てのイベントから注文店舗のイベントを取得
        const eventsSnapshot = await db.collectionGroup('events').get()
        // initEvents は created() 内で1度きりしか呼んではいけない
        // forEach 内の async は非同期呼び出しになるので、アップデートがかかる場合は排他制御が必要
        eventsSnapshot.forEach(async (eventSnapshot) => {
          const event = new Event(eventSnapshot)
          self.events.push(event)
        })
      },
    },

  }
</script>
<style lang="scss">
.table1{
  width:150px;
}
.table2{
  width:75px;
}
</style>