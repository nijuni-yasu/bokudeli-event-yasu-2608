<script setup lang="ts">
import { getAuth } from 'firebase/auth'
import { mdiTruckOutline } from '@mdi/js'
import { useEventListStore } from '@/stores/eventList'
import { orderBy, where } from 'firebase/firestore'
import { ordersCount, ordersTotalPrice } from '@/utils/orders'
import IncrementalLoader from '@/components/IncrementalLoader.vue'
import { getOrderDetailPath } from '@/navigation/utils'

const eventListStore = useEventListStore(
  [
    where('partner_id', '==', getAuth().currentUser?.uid),
    where('event_status.value', '!=', 'in_draft'),
    orderBy('event_start_datetime', 'asc'),
  ],
  10,
)

const events = computed(
  () =>
    eventListStore.eventStores?.flatMap((eventStore) =>
      eventStore.event != null ? { event: eventStore.event, orders: eventStore.orders ?? [] } : [],
    ) ?? [],
)
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="12" class="px-0">
      <v-card flat class="mt-2">
        <template v-slot:title>
          <v-icon size="40" class="text--primary me-3" :icon="mdiTruckOutline" />
          <span>{{ $t('orders.title') }}</span>
        </template>
        <template v-slot:text>
          <v-table style="font-size: small">
            <thead>
              <tr>
                <th v-for="s of $tm('orders.table_header')" :key="`header_${s}`">{{ s }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="{ event, orders } of events" :key="event.event_id">
                <tr>
                  <td>
                    <router-link :to="{ path: getOrderDetailPath(event.event_id) }">
                      {{ event.event_name }}
                    </router-link>
                  </td>
                  <td>
                    {{
                      event.event_start_datetime != null
                        ? $d(event.event_start_datetime.toDate(), 'datetime_weekday_short')
                        : ''
                    }}
                  </td>
                  <td>
                    {{
                      event?.event_deadline_datetime != null
                        ? $d(event.event_deadline_datetime.toDate(), 'datetime_weekday_short')
                        : ''
                    }}
                  </td>
                  <td>{{ event.event_address }}</td>
                  <td>{{ event.event_max_people }} 人</td>
                  <td class="text-right">{{ ordersCount(orders) }} 個</td>
                  <td class="text-right">{{ $n(ordersTotalPrice(orders), 'currency') }}</td>
                  <td>
                    {{ $t(`event_status.${event.event_status.value}`) }}
                  </td>
                </tr>
              </template>
              <tr>
                <td colspan="8" class="text-center">
                  <IncrementalLoader
                    :total-count="eventListStore.totalCount ?? 0"
                    :loaded-count="eventListStore.eventStores?.length ?? 0"
                    @load="eventListStore.next()"
                  />
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card>
    </v-col>
  </v-row>
</template>
