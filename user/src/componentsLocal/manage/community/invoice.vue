<script setup lang="ts">
import { where, orderBy } from 'firebase/firestore'
import { useEventListStore } from '@/stores/eventList'
import IncrementalLoader from '@/components/IncrementalLoader.vue'
import { mdiFilePdfBox } from '@mdi/js'
import type { EventStore } from '@/stores/event'
import { getEventBillInvoicePath, getEventPath } from '@/router/utils'
import type { OrderItem } from '@/schemes/orderItem'

const route = useRoute()

const communityAccount = route.params.communityAccount as string

const eventListStore = useEventListStore(
  [where('community_account', '==', communityAccount), orderBy('event_start_datetime', 'desc')],
  10,
)
const eventStores = computed<EventStore[] | undefined>(() =>
  eventListStore.eventStores?.flatMap((es) => {
    if (
      es.event?.event_payment !== 'community_bill' ||
      es.event?.event_status.value !== 'finished' ||
      getTotalPrice(es.orders ?? []) === 0
    ) {
      return []
    }
    return es
  }),
)
// 本来 model で定義すべきだが、現状そのような仕組みが用意されていないため、とりあえずここで定義しておく
// また、functions と共通化しておくべきだが、functions は現状 typescript に対応していないので仕方なくこの状態で実装
// TODO model で定義するようにする & functions と共通化する
const getTotalPrice = (orders: OrderItem[]) => {
  let total = 0
  for (const order of orders) {
    if (order.status === 'ordered') {
      total += order.menus.reduce((acc, menu) => acc + menu.price * menu.count, 0)
    }
  }
  // 今の所、請求手数料は含めないが、将来的には
  // 特にこの計算式が functions との不整合になりやすいので注意
  // total = Math.floor(total * 1.1)
  return total
}
const getPdf = (eventId: string) => {
  window.open(getEventBillInvoicePath(eventId), '_blank')
}
</script>
<template>
  <v-container>
    <v-row v-if="eventStores != null">
      <v-col md="12" sm="12" cols="12">
        <v-card class="pa-10 mb-10">
          <v-row>
            <v-card-text class="pa-3 title"><div v-html="$t('manage.invoice.title')" /></v-card-text>
          </v-row>
          <v-row>
            <v-card-text class="pa-3 description"><div v-html="$t('manage.invoice.description')" /></v-card-text>
          </v-row>
        </v-card>
        <v-card class="pa-10">
          <v-row v-if="eventListStore.totalCount === eventListStore.eventStores?.length && eventStores.length === 0">
            <v-col cols="12" class="pa-3 text-left">{{ $t('manage.invoice.no_invoice') }}</v-col>
          </v-row>
          <v-row v-else>
            <v-col md="12" sm="12" cols="12">
              <v-table>
                <thead>
                  <tr>
                    <th class="text-left">{{ $t('manage.invoice.date') }}</th>
                    <th class="text-left">{{ $t('manage.invoice.place') }}</th>
                    <th class="text-left">{{ $t('manage.invoice.event_name') }}</th>
                    <th class="text-left">{{ $t('manage.invoice.price') }}</th>
                    <th class="text-left">{{ $t('manage.invoice.download') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="es of eventStores" :key="es.event!.event_id">
                    <tr v-if="es.event != null && es.orders != null">
                      <td>{{ $d(es.event.event_start_datetime!.toDate(), 'date') }}</td>
                      <td>{{ es.event.event_address }}</td>
                      <td>
                        <router-link :to="getEventPath(es.event.community_account, es.event.event_id)">
                          {{ es.event.event_name }}
                        </router-link>
                      </td>
                      <td>
                        {{ getTotalPrice(es.orders).toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' }) }}
                      </td>
                      <td>
                        <v-btn
                          :icon="mdiFilePdfBox"
                          density="compact"
                          variant="text"
                          @click="getPdf(es.event!.event_id)"
                        />
                      </td>
                    </tr>
                  </template>
                </tbody>
              </v-table>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-show="eventStores == null || (eventStores.length ?? 0 !== 0)">
      <v-col cols="12" class="text-center">
        <IncrementalLoader
          class="my-5"
          :total-count="eventListStore.totalCount ?? Number.MAX_SAFE_INTEGER"
          :loaded-count="eventListStore.eventStores?.length ?? 0"
          @load="eventListStore.next()"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.title {
  font-family: Noto Sans JP;
  font-size: 22px;
  font-weight: 700;
  text-align: left;
}
.description {
  font-family: Noto Sans JP;
  font-size: 14px;
  font-weight: 400;
  line-height: 30px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}
</style>
