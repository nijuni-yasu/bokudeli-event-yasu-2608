<script setup lang="ts">
import OrderItem from '@/schemes/orderItem'
import OrderMenu from '@/schemes/orderMenu'
import PartnerMenu from '@/schemes/partnerMenu'
import { useStoreStoredUser } from '@/stores/storedUser'
import { DocumentData, QueryDocumentSnapshot, Timestamp, addDoc, collection, getDocs, setDoc } from 'firebase/firestore'

import LoginDialog from '@/components/LoginDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { createEmptyEvent } from '@/schemes/bokudeliEvent'

const router = useRouter()

const props = defineProps<{
  modelValue: boolean
  menu: PartnerMenu
  eventSnapshot: QueryDocumentSnapshot<DocumentData>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const countOptions = Array.from({ length: 10 }, (_, i) => i + 1)
const selectedCount = ref(1)

// FIXME: 注記が入力されていた場合、表示させる必要がある
const orderNote = ref('')

const closeDialog = (isAddCart: boolean) => {
  selectedCount.value = 1
  orderNote.value = ''
  if (isAddCart) {
    router.push('/cart')
  }
  isOpen.value = false
}

const userStore = useStoreStoredUser()

const addOrder = async () => {
  if (!userStore.storedUser || !selectedCount.value) {
    return
  }

  const eventData = { ...createEmptyEvent(), ...props.eventSnapshot.data() }
  const communityId = eventData.community_id
  const communityAccount = eventData.community_account
  const event_id = eventData.event_id
  const event_payment = eventData.event_payment
  const orderDb = collection(props.eventSnapshot.ref, 'orders')
  const orderSnapshot = await getDocs(orderDb)

  const orderCount = selectedCount.value || 0

  // 上書きできるオーダーを探す
  const userOrders = orderSnapshot.docs.filter((doc) => {
    const data = doc.data() as OrderItem
    return data.status === 'in_cart' && data.user_id === userStore.storedUser?.userId
  })

  if (userOrders.length === 0) {
    // 追加処理
    const menu = props.menu
    const orderItem = {
      user_id: userStore.storedUser.userId,
      community_id: communityId,
      community_account: communityAccount,
      event_id,
      event_payment,
      status: 'in_cart',
      menus: [
        {
          menu_id: menu.id,
          partner_id: menu.partnerId,
          name: menu.name,
          price: menu.price,
          imageUrl: menu.imageUrl,
          count: orderCount,
          note: orderNote.value,
        },
      ] as OrderMenu[],
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    } as OrderItem
    const addedDoc = await addDoc(orderDb, orderItem)

    // 自動採番されたOrderIDを取得して項目として追加追加
    await setDoc(addedDoc, { order_id: addedDoc.id }, { merge: true })
  } else {
    // 上書き処理
    const userOrder = userOrders.shift()
    if (!userOrder) {
      console.error('userOrder is undefined')
      return
    }

    const currentOrder = userOrder.data() as OrderItem
    const menus = currentOrder.menus as OrderMenu[]

    // 上書き対象のメニューのインデックスを取得
    const updateMenuIndex = menus.findIndex((menu) => {
      return menu.menu_id === props.menu.id
    })

    if (updateMenuIndex >= 0) {
      // すでに注文していた場合はカウントのみ更新して追加
      menus[updateMenuIndex].count += orderCount
      if (orderNote.value) {
        menus[updateMenuIndex].note = orderNote.value
      }
    } else {
      // まだ注文していない場合は追加
      const menu = props.menu
      menus.push({
        menu_id: menu.id,
        partner_id: menu.partnerId,
        name: menu.name,
        price: menu.price,
        imageUrl: menu.imageUrl,
        count: orderCount,
        note: orderNote.value,
      })
    }
    await setDoc(userOrder.ref, { menus, updated_at: Timestamp.now() }, { merge: true })
  }
}

const isOpenAlert = ref(false)
const isOpenLoginDialog = ref(false)
const isOpenConfirmDialog = ref(false)

const openConfirmDialog = () => {
  isOpenConfirmDialog.value = true
}

const openLoginDialog = () => {
  isOpenLoginDialog.value = true
}

const addCart = async () => {
  if (!selectedCount.value) {
    isOpenAlert.value = true
    return
  }
  if (!userStore.storedUser) {
    openConfirmDialog()
  } else {
    await addOrder()
    closeDialog(true)
  }
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="550px" @click:outside="closeDialog(false)">
    <v-card class="pa-sm-10 px-5 py-1 text-center">
      <v-img :src="menu.imageUrl" class="ma-5" aspect-ratio="1" cover></v-img>
      <v-card-title class="text-left text-h4 pb-3 pre-line">
        {{ menu.name }}
      </v-card-title>
      <v-card-text class="text-left pb-2">
        {{ menu.description }}
      </v-card-text>
      <v-card-text class="text-right text-h4 pb-5"> ¥ {{ menu.price }} </v-card-text>
      <v-row class="mx-3 mb-2">
        <v-select v-model="selectedCount" :items="countOptions" dense outlined filled label="個数"></v-select>
      </v-row>
      <v-row class="mx-3 my-2">
        <v-textarea v-model="orderNote" outlined dense rows="1" label="注記を追加"></v-textarea>
      </v-row>
      <v-row class="justify-center mx-1 my-2">
        <v-btn class="justify-center mx-1 align-self-center" rounded size="large" color="primary" @click="addCart()">
          カートに追加する
        </v-btn>
        <v-btn
          class="justify-center mx-1 my-2 align-self-center"
          rounded
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
    <confirm-dialog v-model="isOpenAlert" :is-confirm="false">個数を選んでください</confirm-dialog>
  </v-dialog>
</template>

<style lang="scss" scoped></style>
