<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { type BokudeliEventMenu } from '@shokujii/base/stores/event.js'
import { useEventStore, type EventStore } from '@shokujii/base/stores/event'
import { useStoreStoredUser } from '@shokujii/base/stores/storedUser'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { priceString } from '@shokujii/base/schemes/converter'
import { mdiCart } from '@mdi/js'
import { getLogin } from '@/router/utils'

const router = useRouter()
const route = useRoute()

const props = defineProps<{
  modelValue: boolean
  menu: BokudeliEventMenu
  eventId: string
}>()

const eventStore = useEventStore(props.eventId) as EventStore

const isOpen = defineModel<boolean>()

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

const login = () => {
  router.push({
    path: getLogin(),
    query: {
      redirect: route.path,
    },
  })
}

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
          partner_id: eventStore.event.partner_id,
          name: props.menu.menu_name,
          price: props.menu.menu_price,
          imageUrl: props.menu.menu_image_url ?? '',
          count: selectedCount.value,
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

const isOpenConfirmDialog = ref(false)

const openConfirmDialog = () => {
  isOpenConfirmDialog.value = true
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="500px" @click:outside="closeDialog(false)">
    <v-card class="pa-sm-10 pa-5">
      <v-img :src="menu.menu_image_url ?? undefined" class="ma-3"></v-img>
      <v-card-title class="text-left text-h4 py-1 text-wrap">
        {{ menu.menu_name }}
      </v-card-title>
      <v-card-text class="text-left py-2">
        {{ menu.menu_description }}
      </v-card-text>
      <v-card-text class="text-right pb-8">
        <span class="text-h5">¥ </span>
        <span class="text-h4">{{ priceString(menu.menu_price) }}</span>
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
          {{ $t('cart_dialog.add') }}
        </v-btn>
        <v-btn
          class="justify-center mx-1 my-2 align-self-center"
          rounded="pill"
          size="small"
          variant="outlined"
          color="secondary"
          @click="closeDialog(false)"
        >
          {{ $t('cart_dialog.close') }}
        </v-btn>
      </v-row>
    </v-card>
    <confirm-dialog v-model="isOpenConfirmDialog" :is-confirm="false" @click="login">
      ログインしてください
    </confirm-dialog>
  </v-dialog>
</template>

<style lang="scss" scoped></style>
