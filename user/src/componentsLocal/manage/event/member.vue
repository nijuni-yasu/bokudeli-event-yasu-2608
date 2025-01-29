<script setup lang="ts">
import UserAvatar from '@/components/UserAvatar.vue'
import EmailDialog from '@/components/EmailDialog.vue'
import { useEventStore, type EventStore } from '@/stores/event'
import { useUserStore, type UserStore } from '@/stores/user'
import { getUserPath } from '@/router/utils'
import { mdiFacebook, mdiEmail } from '@mdi/js'
import XIcon from '@/icons/x'
import instagramIcon from '@/assets/images/sns/sns_instagram.png'
import type { OrderItem } from '@/schemes/orderItem'
import type { EventMember } from '@/schemes/EventMember'
import type { OrderMenu } from '@/schemes/orderMenu'
import { getAuth } from 'firebase/auth'
import { buildFacebookUrl, buildTwitterUrl, buildInstagramUrl } from '@/utils/buildSnsLinks'

const { t: $t, d: $d } = useI18n()
const route = useRoute()
const eventId = route.params.eventId as string

const userStore = useUserStore(getAuth().currentUser!.uid) as UserStore

const eventStore = useEventStore(eventId) as EventStore
const orders = computed<Array<[OrderItem, EventMember]>>(
  () =>
    eventStore.orders?.flatMap((order) => {
      const member = eventStore.members?.find((m) => m.user_id === order.user_id)
      return member != null ? [[order, member]] : []
    }) ?? [],
)
const orderedOrders = computed(() =>
  orders.value
    .filter(([order]) => order.status === 'ordered')
    .sort(([a], [b]) => a.updated_at.toMillis() - b.updated_at.toMillis()),
)
const cartOrders = computed(() =>
  orders.value
    .filter(([order]) => order.status === 'in_cart')
    .sort(([a], [b]) => a.carted_at.toMillis() - b.carted_at.toMillis()),
)
const canceledOrders = computed(() =>
  orders.value
    .filter(([order]) => order.status === 'canceled')
    .sort(([a], [b]) => (a.canceled_at?.toMillis() ?? 0) - (b.canceled_at?.toMillis() ?? 0)),
)
const tables = computed(() => [orderedOrders.value, cartOrders.value, canceledOrders.value])
const getMenuString = (menus: OrderMenu[]) =>
  menus
    .map((menu) => (menu.count > 1 ? $t('manage.member.multi_order', [menu.name, menu.count]) : menu.name))
    .join(', ')

const canSendEmail = computed(() => !isEmpty(userStore.user?.user_email))

const targetMember = ref<EventMember | null>(null)
const isEmailDialogOpen = computed({
  get: () => targetMember.value != null,
  set: (val) => {
    if (!val) {
      targetMember.value = null
    }
  },
})
const clickContact = (member: EventMember) => {
  targetMember.value = member
}
const openNewLink = (url: string) => {
  window.open(url, '_blank')
}
const getDateString = (order: OrderItem) => {
  switch (order.status) {
    case 'ordered':
      return $d(order.updated_at.toDate(), 'datetime')
    case 'in_cart':
      return $d(order.carted_at.toDate(), 'datetime')
    case 'canceled':
      return order.canceled_at == null ? '' : $d(order.canceled_at.toDate(), 'datetime')
  }
}
</script>

<template>
  <v-container>
    <template v-for="orders in tables">
      <v-row v-if="orders.length !== 0" :key="orders[0][0].event_id" class="justify-center">
        <v-col md="10" sm="10" cols="12">
          <v-col cols="12" class="text-h4">
            <v-row> {{ $t(`manage.member.${orders[0][0].status}`) }} </v-row>
          </v-col>
          <v-table>
            <thead>
              <tr>
                <th>#</th>
                <th colspan="2">{{ $t('manage.member.name') }}</th>
                <th colspan="3"></th>
                <th>{{ $t('manage.member.order') }}</th>
                <th>{{ $t(`manage.member.date.${orders[0][0].status}`) }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="([order, member], i) of orders" :key="order.order_id">
                <td>{{ i + 1 }}</td>
                <td class="minimum-cell">
                  <router-link :to="getUserPath(member.user_id)">
                    <UserAvatar :user="member"></UserAvatar>
                  </router-link>
                </td>
                <td>
                  <router-link :to="getUserPath(member.user_id)" style="color: rgba(var(--v-theme-on-surface))">
                    {{ member.user_name }}
                  </router-link>
                </td>
                <td class="minimum-cell">
                  <v-btn
                    v-if="member.user_sns_facebook != null"
                    :icon="mdiFacebook"
                    color="#1877F2"
                    density="compact"
                    variant="text"
                    @click="openNewLink(buildFacebookUrl(member.user_sns_facebook))"
                  />
                </td>
                <td class="minimum-cell">
                  <v-btn
                    v-if="member.user_sns_twitter != null"
                    :icon="XIcon"
                    color="grey-900"
                    density="compact"
                    variant="text"
                    @click="openNewLink(buildTwitterUrl(member.user_sns_twitter))"
                  />
                </td>
                <td class="minimum-cell">
                  <v-btn
                    v-if="member.user_sns_instagram != null"
                    density="compact"
                    variant="text"
                    icon=""
                    @click="openNewLink(buildInstagramUrl(member.user_sns_instagram))"
                  >
                    <img :src="instagramIcon" alt="Instagram" style="height: 24px; border-radius: 20%" />
                  </v-btn>
                </td>
                <td>{{ getMenuString(order.menus) }}</td>
                <td>{{ getDateString(order) }}</td>
                <td>
                  <v-btn
                    v-if="canSendEmail && !isEmpty(member.user_email) && member.user_id !== userStore.user?.user_id"
                    :icon="mdiEmail"
                    variant="text"
                    @click="clickContact(member)"
                  />
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-col>
      </v-row>
    </template>
  </v-container>
  <EmailDialog v-if="targetMember != null" v-model="isEmailDialogOpen" :toUser="targetMember" />
</template>

<style scoped>
.hidden {
  visibility: hidden; /* サイズは保持されるが内容は非表示 */
}

.minimum-cell {
  width: 1px;
  padding: 0 !important;
}
</style>
