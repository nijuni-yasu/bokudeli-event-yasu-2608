<script setup lang="ts">
import { type PartnerMenu } from '@/schemes/partnerMenu'
import { useEventStore, type EventStore } from '@/stores/event'
import { useStoreStoredUser } from '@/stores/storedUser'

import LoginDialog from '@/components/LoginDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { priceString } from '@/schemes/converter'
import { mdiCart } from '@mdi/js'

const router = useRouter()

const props = defineProps<{
  modelValue: boolean
  menu: PartnerMenu
  eventId: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const eventStore = useEventStore(props.eventId) as EventStore

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const countOptions = Array.from({ length: 5 }, (_, i) => i + 1)
const selectedCount = ref(1)

// FIXME: 注記が入力されていた場合、表示させる必要がある
const orderNote = ref('')

const isAddingOrder = ref(false)

const closeDialog = (isAddCart: boolean) => {
  // TODO 自分で閉じたり、ページ遷移するのではなく、親が処理を選べるようにする
  isAddingOrder.value = false
  selectedCount.value = 1
  orderNote.value = ''
  if (isAddCart) {
    router.push('/cart')
  }
  isOpen.value = false
}

const userStore = useStoreStoredUser()

const addCart = async () => {
  if (userStore.storedUser == null) {
    openConfirmDialog()
    return
  }
  if (userStore.storedUser == null || eventStore.event == null) {
    console.warn('userStore.storedUser or eventStore.event is null')
    return
  }
  const menu_id = props.menu.id
  if (menu_id == null) {
    console.warn('menu_id is null')
    return
  }

  isAddingOrder.value = true
  try {
    const orderItem = {
      community_id: eventStore.event.community_id,
      event_id: eventStore.event.event_id,
      menus: [
        {
          menu_id,
          partner_id: props.menu.partnerId,
          name: props.menu.name,
          price: props.menu.price,
          imageUrl: props.menu.imageUrl,
          count: selectedCount.value || 0,
          note: orderNote.value,
        },
      ],
    }
    await eventStore.addOrder(orderItem)
    closeDialog(true)
  } catch (e) {
    console.error(e)
  } finally {
    isAddingOrder.value = false
  }
}

const isOpenLoginDialog = ref(false)
const isOpenConfirmDialog = ref(false)

const openConfirmDialog = () => {
  isOpenConfirmDialog.value = true
}

const openLoginDialog = () => {
  isOpenLoginDialog.value = true
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="550px" @click:outside="closeDialog(false)">
    <v-card class="pa-sm-10 px-5 py-1 text-center">
      <v-img :src="menu.imageUrl ?? undefined" class="ma-5" aspect-ratio="1" cover></v-img>
      <v-card-title class="text-left text-h5 py-2 pre-line">
        {{ menu.name }}
      </v-card-title>
      <v-card-text class="text-left py-2">
        {{ menu.description }}
      </v-card-text>
      <v-card-text class="text-right pb-5">
        <span style="font-size: 18px; color: #3a3541de">¥ </span>
        <span style="font-size: 30px; color: #3a3541de">{{ priceString(menu.price) }}</span>
      </v-card-text>
      <v-row class="mx-3 mb-2">
        <v-select v-model="selectedCount" :items="countOptions" dense outlined filled label="個数"></v-select>
      </v-row>
      <!--
      <v-row class="mx-3 my-2">
        <v-textarea v-model="orderNote" outlined dense rows="1" label="注記を追加"></v-textarea>
      </v-row>
      -->
      <v-row class="justify-center mx-1 my-2">
        <v-btn
          class="justify-center mx-1 align-self-center"
          rounded="pill"
          color="primary"
          :prepend-icon="mdiCart"
          :loading="isAddingOrder"
          @click="addCart()"
        >
          カートに追加
        </v-btn>
        <v-btn
          class="justify-center mx-1 my-2 align-self-center"
          rounded="pill"
          size="small"
          variant="outlined"
          color="secondary"
          @click="closeDialog(false)"
        >
          閉じる
        </v-btn>
      </v-row>
    </v-card>
    <login-dialog v-model="isOpenLoginDialog" />
    <confirm-dialog v-model="isOpenConfirmDialog" :is-confirm="true" :ok-click="openLoginDialog">
      ログインしてください
    </confirm-dialog>
  </v-dialog>
</template>

<style lang="scss" scoped></style>
