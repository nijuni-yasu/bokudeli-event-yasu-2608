<script setup lang="ts">
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import EventDiscountChip from '@shokujii/base/components/EventDiscountChip.vue'
import EventStatusChip from '@shokujii/base/components/EventStatusChip.vue'
import type { EventStore } from '@shokujii/base/stores/event.js'
import { getEventBillInvoicePath, getEventPath } from '@/router/utils'
import { calculateEventBillInvoiceTotal } from '@shokujii/common/utils/invoice.js'
import { convertToDate } from '@shokujii/common/utils/datetime.js'
import { useCreateAppCommunityEventListStore } from '@shokujii/base/composable/useAppEventListStore.js'

const props = defineProps<{
  communityAccount: string
}>()

const createEventListStore = useCreateAppCommunityEventListStore()
const eventListStore = createEventListStore(props.communityAccount, 10)

/** 主催者請求書払いのイベントのみ（ステータスは問わない） */
const eventStores = computed<EventStore[] | undefined>(() =>
  eventListStore.eventStores?.flatMap((es) => {
    if (es.event?.event_payment !== 'community_bill') {
      return []
    }
    return es
  }),
)

const getPdf = (eventId: string) => {
  window.open(getEventBillInvoicePath(eventId), '_blank')
}

/** 請求合計の数値。開催日時未設定時は 0 */
const getInvoiceTotalYen = (es: EventStore): number => {
  const ev = es.event!
  if (ev.event_start_datetime == null) {
    return 0
  }
  return calculateEventBillInvoiceTotal(es.orders ?? [], ev.event_start_datetime, ev.community_bill_settings)
}

const formatInvoiceTotal = (es: EventStore): string => {
  const ev = es.event!
  if (ev.event_start_datetime == null) {
    return 'ー'
  }
  return getInvoiceTotalYen(es).toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })
}
</script>
<template>
  <v-container class="manage-container">
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
        <v-card v-if="(eventStores?.length ?? 0) > 0" class="pa-10">
          <v-row>
            <v-col md="12" sm="12" cols="12">
              <v-table>
                <thead>
                  <tr>
                    <th class="text-left">{{ $t('manage.invoice.date') }}</th>
                    <th class="text-left">{{ $t('manage.invoice.event_name') }}</th>
                    <th class="text-left">{{ $t('manage.invoice.status') }}</th>
                    <th class="text-left">{{ $t('manage.invoice.oge_amount') }}</th>
                    <th class="text-left">{{ $t('manage.invoice.price') }}</th>
                    <th class="text-left">{{ $t('manage.invoice.download') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="es of eventStores" :key="es.event!.event_id">
                    <tr v-if="es.event != null">
                      <td>
                        {{
                          es.event.event_start_datetime != null ? convertToDate(es.event.event_start_datetime) : 'ー'
                        }}
                      </td>
                      <td>
                        <router-link :to="getEventPath(es.event.community_account, es.event.event_id)">
                          {{ es.event.event_name }}
                        </router-link>
                      </td>
                      <td>
                        <EventStatusChip :status="es.event.calculatedEventStatus" size="x-small" />
                      </td>
                      <td>
                        <EventDiscountChip
                          v-if="es.event.community_bill_settings != null"
                          :settings="es.event.community_bill_settings"
                          size="x-small"
                        />
                        <template v-else>ー</template>
                      </td>
                      <td>
                        <template v-if="es.event.calculatedEventStatus === 'finished'">
                          {{ formatInvoiceTotal(es) }}
                        </template>
                        <template v-else>ー</template>
                      </td>
                      <td>
                        <template
                          v-if="
                            es.event.calculatedEventStatus === 'finished' &&
                            es.event.event_start_datetime != null &&
                            getInvoiceTotalYen(es) > 0
                          "
                        >
                          <v-btn variant="text" size="small" density="compact" @click="getPdf(es.event.event_id)">
                            {{ $t('manage.invoice.download_invoice') }}
                          </v-btn>
                        </template>
                        <template v-else>ー</template>
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
    <v-row v-show="eventStores == null || (eventStores?.length ?? 0) !== 0">
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
  font-size: 22px;
  font-weight: 700;
  text-align: left;
}
.description {
  font-size: 14px;
  font-weight: 400;
  line-height: 30px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}
</style>
