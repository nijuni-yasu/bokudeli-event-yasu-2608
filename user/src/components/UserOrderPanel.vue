<script setup lang="ts">
// import { reactive, onMounted } from 'vue';
// import StoredUser from '@/schemes/storedUser'
// import { useStoreStoredUser } from '@/stores/storedUser'
// import { db } from '@/firebase'
// import {
//   Timestamp,
//   collectionGroup,
//   deleteDoc,
//   getDocs,
//   orderBy,
//   query,
//   setDoc,
//   where,
// } from 'firebase/firestore'

// import { loadEventMembers } from '@/composable/loadEventMembers'
// import { getCommunityPath, getEventPath } from '@/router/utils'
// import { dateString, priceString, convertDocumentDataToEvent } from '@/schemes/converter'
// import BokudeliEvent from '@/schemes/bokudeliEvent'
// import BokudeliCommunity from '@/schemes/bokudeliCommunity'
// import OrderItem from '@/schemes/orderItem'
// import OrderMenu from '@/schemes/orderMenu'

// const { storedUser } = storeToRefs(useStoreStoredUser())
// const userId = computed(() => storedUser.value?.userId ?? '')
// console.log(userId.value)

// type Order = {
//   order: OrderItem
//   community: BokudeliCommunity
//   event: BokudeliEvent
// }

// const state = reactive({
//   // orderList: [] as Order[],
//   isLoading: true,
//   // orderItems: [] as Order[],
//   orders: [],
// })

// const orders = ref([]);

// const loadOrderList = async () => {
//   // オーダー情報の取得
//   const inOrderQuery = query(
//     collectionGroup(db, 'orders'),
//     where('user_id', '==', userId.value),
//     where('status', '==', 'ordered'),
//     orderBy('updated_at', 'desc')
//   )

//   const orderSnapshot = await getDocs(inOrderQuery)
//   const orderItems = orderSnapshot.docs.map((doc) => {
//     return doc.data() as OrderItem
//   })
//   console.log(orderSnapshot)
//   console.log(orderItems)
//   state.orderItems = orderItems


  // // イベント情報を引きオーダー情報とくっつける
  // const convertedList = await Promise.all(
  //   orderItems.map(async (item) => {
  //     const eventQuery = query(
  //       collectionGroup(db, 'events'),
  //       where('community_account', '==', item.community_account),
  //       where('event_id', '==', item.event_id)
  //     )
  //     const eventSnapshot = await getDocs(eventQuery)
  //     if (eventSnapshot.docs.length === 0) {
  //       console.error('イベントが見つかりませんでした', { item })
  //       return []
  //     }
  //     const event = convertDocumentDataToEvent(eventSnapshot.docs[0].data())

  //     const subtotals = {} as { [key: string]: number }
  //     item.menus.forEach((menu) => {
  //       subtotals[menu.menu_id] = menu.price * menu.count
  //     })
  //     const total = Object.values(subtotals).reduce((total, current) => total + current)
  //     return [{ order: item, event, subtotals, total }]
  //   })
  // )

//   return orderItems
// }
// onMounted(async () => {
//   state.orders = await loadOrderList()
//   console.log(state.orders)
//   state.isLoading = false
// })

</script>

<template>
  <v-row class="user-bio-panel">
    <!-- user profile -->
    <v-col cols="12">
      <v-card class="pt-5">
        <v-row>
          <v-col cols="12">
            <v-table class="ma-5">
              <thead>
                <tr>
                  <th class="text-center" style="padding: 2px">コミュニティ</th>
                  <th class="text-center" style="padding: 2px">イベント</th>
                  <th class="text-center" style="padding: 2px">日時</th>
                  <th class="text-center" style="padding: 2px">注文</th>
                  <th class="text-center" style="padding: 2px">価格</th>
                  <th class="text-center" style="padding: 2px"> </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 10px">SHIBUYA QWS</td>
                  <td style="padding: 10px">We are QWS！現役生と卒業生が交わる同窓交流会「We are QWSが一同に会するとどんな化学反応が生まれるのか？」</td>
                  <td style="padding: 10px">2023-9-4 17:00</td>
                  <td style="padding: 10px">照り焼き丼</td>
                  <td style="padding: 10px">¥1,200</td>
                </tr>
                <tr>
                  <td style="padding: 10px">DMM.makeAKIBA</td>
                  <td style="padding: 10px">つながる交流会</td>
                  <td style="padding: 10px">2023-8-30 13:00</td>
                  <td style="padding: 10px">照り焼き丼</td>
                  <td style="padding: 10px">¥1,200</td>
                </tr>
                <tr>
                  <td style="padding: 10px">SHIBUYA QWS</td>
                  <td style="padding: 10px">We are QWS！現役生と卒業生が交わる同窓交流会「We are QWSが一同に会するとどんな化学反応が生まれるのか？」</td>
                  <td style="padding: 10px">2023-9-4 17:00</td>
                  <td style="padding: 10px">照り焼き丼</td>
                  <td style="padding: 10px">¥1,200</td>
                </tr>
                <tr>
                  <td style="padding: 10px">DMM.makeAKIBA</td>
                  <td style="padding: 10px">つながる交流会</td>
                  <td style="padding: 10px">2023-8-30 13:00</td>
                  <td style="padding: 10px">照り焼き丼</td>
                  <td style="padding: 10px">¥1,200</td>
                </tr>
              </tbody>
            </v-table>
          </v-col>
        </v-row>
      </v-card>
      <v-card-title class="my-5" style="font-size:14px; white-space:pre-line;">
        キャンセルされる場合は運営までお問い合わせください。<br>
        注文締切後のキャンセルはできませんのでご了承ください。<br>
        連絡先：support@nijuni.jp
      </v-card-title>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
