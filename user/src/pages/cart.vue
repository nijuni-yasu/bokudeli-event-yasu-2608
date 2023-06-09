<script setup lang="ts">
import { db } from '@/firebase'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import { dateString, convertDocumentDataToEvent } from '@/schemes/converter'
import OrderItem from '@/schemes/orderItem'
import { useStoreStoredUser } from '@/stores/storedUser'
import { collectionGroup, getDocs, orderBy, query, where } from 'firebase/firestore'

const { storedUser } = storeToRefs(useStoreStoredUser())
const userId = computed(() => storedUser.value?.userId ?? '')

type Cart = {
  orders: OrderItem
  event: BokudeliEvent
}

const state = reactive({
  cartList: [] as Cart[],
  isLoading: true,
})

onMounted(async () => {
  // カート情報の取得
  const inCartQuery = query(
    collectionGroup(db, 'orders'),
    where('user_id', '==', userId.value),
    where('status', '==', 'in_cart'),
    orderBy('updated_at', 'desc')
  )

  const cartSnapshot = await getDocs(inCartQuery)
  const orderItems = cartSnapshot.docs.map((doc) => {
    return doc.data() as OrderItem
  })

  // イベント情報を引きオーダー情報とくっつける
  const convertedList = await Promise.all(
    orderItems.map(async (item) => {
      const eventQuery = query(
        collectionGroup(db, 'events'),
        where('community_account', '==', item.community_account),
        where('event_id', '==', item.event_id)
      )
      const eventSnapshot = await getDocs(eventQuery)
      if (eventSnapshot.docs.length === 0) {
        console.error('イベントが見つかりませんでした', { item })
        return []
      }
      const event = convertDocumentDataToEvent(eventSnapshot.docs[0].data())
      return [{ orders: item, event }]
    })
  )

  state.cartList = convertedList.flat()
  state.isLoading = false
})
</script>

<template>
  <div>
    <v-row v-if="!state.isLoading" justify="center">
      <v-col v-for="cart in state.cartList" :key="cart.event.eventId" cols="12" md="8" sm="8">
        <v-card class="pa-10 ma-10">
          <v-row>
            <v-col class="d-flex align-center">
              <v-img class="ma-10" cover aspect-ratio="1.91" :src="cart.event.eventCoverUrl" />
            </v-col>
          </v-row>
          <v-card-text class="text-left pb-8 text-h6"> 【主催者】{{ cart.event.communityName }}</v-card-text>
          <v-card-text class="text-left pb-8 text-h6"> 【イベント】{{ cart.event.eventName }} </v-card-text>
          <v-card-text class="text-left pb-8 text-h6"> 【開催場所】{{ cart.event.eventAddress }} </v-card-text>
          <v-card-text class="text-left pb-8 text-h6">
            【開催日時】{{ dateString(cart.event.eventStartDatetime) }}
          </v-card-text>
          <v-card-text class="text-left pb-8 text-h6">
            【注文期限】{{ dateString(cart.event.eventDeadline) }}
          </v-card-text>
          <v-card-text class="text-left pb-8 text-h6"> 【お店】{{ cart.event.shopName }} </v-card-text>

          <v-row class="text-center align-center">
            <v-col cols="12">
              <v-table>
                <thead>
                  <tr>
                    <th class="text-center" width="100"></th>
                    <th class="text-center">メニュー</th>
                    <th class="text-center">価格</th>
                    <th class="text-center">個数</th>
                    <th class="text-center">小計(税込)</th>
                    <th class="text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <v-img
                        class="ma-1"
                        height="100"
                        width="100"
                        cover
                        aspect-ratio="1"
                        src="https://firebasestorage.googleapis.com/v0/b/bokudeli-event-dev.appspot.com/o/Et3UOow7B6gGgxPJ10GL9nEX2AZ2%2Fmenus%2Fmenu_1684056619251.jpeg?alt=media&token=0bc76a09-3cad-440d-881d-68b54a62c19b"
                      />
                    </td>
                    <td>カツ丼</td>
                    <td>¥1,500</td>
                    <td>2</td>
                    <td>¥3,000</td>
                    <td>削除</td>
                  </tr>
                  <tr>
                    <td>
                      <v-img
                        class="ma-1"
                        height="100"
                        width="100"
                        cover
                        aspect-ratio="1"
                        src="https://firebasestorage.googleapis.com/v0/b/bokudeli-event-dev.appspot.com/o/Et3UOow7B6gGgxPJ10GL9nEX2AZ2%2Fmenus%2Fmenu_1684056619251.jpeg?alt=media&token=0bc76a09-3cad-440d-881d-68b54a62c19b"
                      />
                    </td>
                    <td>天丼</td>
                    <td>¥1,000</td>
                    <td>1</td>
                    <td>¥1,000</td>
                    <td>削除</td>
                  </tr>
                  <tr>
                    <td>
                      <v-img
                        class="ma-1"
                        height="100"
                        width="100"
                        cover
                        aspect-ratio="1"
                        src="https://firebasestorage.googleapis.com/v0/b/bokudeli-event-dev.appspot.com/o/Et3UOow7B6gGgxPJ10GL9nEX2AZ2%2Fmenus%2Fmenu_1684056619251.jpeg?alt=media&token=0bc76a09-3cad-440d-881d-68b54a62c19b"
                      />
                    </td>
                    <td>釜飯丼</td>
                    <td>¥1,000</td>
                    <td>1</td>
                    <td>¥1,000</td>
                    <td>削除</td>
                  </tr>
                </tbody>
              </v-table>
            </v-col>
          </v-row>
          <v-card-text class="text-right">
            <span class="text-right ma-2 text-h5">合計(税込)</span>
            <span class="text-right ma-2 text-h4"> ¥5,000</span>
          </v-card-text>
          <v-row class="justify-center">
            <v-col class="text-center">
              <v-btn class="ma-10 text-h5" color="grey-900" size="x-large" rounded width="500"> 注文を確定する </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-else justify="center">
      <v-col cols="auto">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>
  </div>
</template>
<style lang="scss" scoped></style>
