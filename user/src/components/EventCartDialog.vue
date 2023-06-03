<script setup lang="ts">
import OrderItem from '@/schemes/OrderItem'
import OrderMenu from '@/schemes/orderMenu'
import PartnerMenu from '@/schemes/partnerMenu'
import { useStoreStoredUser } from '@/stores/storedUser'
import { DocumentData, QueryDocumentSnapshot, Timestamp, addDoc, collection, getDocs, setDoc } from 'firebase/firestore'

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
const closeDialog = () => {
  isOpen.value = false
}

const userStore = useStoreStoredUser()

const addOrder = async () => {
  if (!userStore.storedUser) {
    return
  }

  const orderDb = collection(props.eventSnapshot.ref, 'orders')
  const orderSnapshot = await getDocs(orderDb)

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
      status: 'in_cart',
      menus: [
        {
          menu_id: menu.id,
          partner_id: menu.partnerId,
          name: menu.name,
          price: menu.price,
          imageUrl: menu.imageUrl,
          count: 1,
        },
      ],
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    } as OrderItem
    const addedDoc = await addDoc(orderDb, orderItem)

    // 自動採番されたOrderIDを取得して項目として追加追加
    await setDoc(addedDoc, { orderid: addedDoc.id }, { merge: true })
  } else {
    // 上書き処理
    const userOrder = userOrders.shift()
    if (!userOrder) {
      console.error('userOrder is undefined')
      return
    }

    const currentOrder = userOrder.data() as OrderItem
    const currentMenus = currentOrder.menus as OrderMenu[]

    // 上書き対象のメニューを探して一度取り除く
    const updateMenu = currentMenus
      .filter((menu) => {
        return menu.menu_id === props.menu.id
      })
      .shift()

    if (updateMenu) {
      // すでに注文していた場合はカウントのみ更新して追加
      updateMenu.count += 1
      currentMenus.push(updateMenu)
    } else {
      const menu = props.menu
      currentMenus.push({
        menu_id: menu.id,
        partner_id: menu.partnerId,
        name: menu.name,
        price: menu.price,
        imageUrl: menu.imageUrl,
        count: 1,
      })
    }
    await setDoc(userOrder.ref, { menus: currentMenus, updated_at: Timestamp.now() }, { merge: true })
  }
}

const addCart = async () => {
  await addOrder()
  closeDialog()
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="550px" @click:outside="closeDialog()">
    <v-card class="pa-sm-10 px-5 py-1 text-center">
      <v-img class="mx-5" :src="menu.imageUrl" aspect-ratio="1"></v-img>
      <v-card-title class="text-left text-h4 pb-3">
        {{ menu.name }}
      </v-card-title>
      <v-card-text class="text-left pb-2">
        {{ menu.description }}
      </v-card-text>
      <v-card-text class="text-right text-h4 pb-5"> ¥ {{ menu.price }} </v-card-text>
      <v-row class="mx-3 mb-2">
        <v-select :items="countOptions" dense outlined filled label="個数"></v-select>
      </v-row>
      <v-row class="mx-3 my-2">
        <v-textarea outlined dense rows="1" label="注記を追加"></v-textarea>
      </v-row>
      <v-row class="mx-3 my-2">
        <v-col class="justify-center pa-0">
          <v-btn width="100%" height="57" rounded outlined color="primary" @click="addCart()"> カートに追加する </v-btn>
        </v-col>
      </v-row>
      <v-row class="mx-3 mt-2">
        <v-col class="justify-center pa-0">
          <v-btn width="100%" height="57" rounded outlined color="secondary" @click="closeDialog()">閉じる</v-btn>
        </v-col>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped></style>
