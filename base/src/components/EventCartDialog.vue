<script setup lang="ts">
import { ref } from 'vue'
import { type BokudeliEventMenu } from '@shokujii/base/stores/event.js'
import { useEventStore, type EventStore } from '@shokujii/base/stores/event'
import { priceString } from '@shokujii/base/schemes/converter'
import { mdiCart } from '@mdi/js'
import EventMenuImage from '@shokujii/base/components/EventMenuImage.vue'

const props = defineProps<{
  menu: BokudeliEventMenu
  eventId: string
}>()

const eventStore = useEventStore(props.eventId) as EventStore

const isOpen = defineModel<boolean>()

const emit = defineEmits<{
  added: []
}>()

const countOptions = Array.from({ length: 5 }, (_, i) => i + 1)
const selectedCount = ref(1)

const isAddingOrder = ref(false)

const closeDialog = () => {
  isAddingOrder.value = false
  selectedCount.value = 1
  isOpen.value = false
}

const addCart = async () => {
  if (eventStore.event == null) {
    console.warn('eventStore.event is null')
    return
  }
  const menu_id = props.menu.id
  if (menu_id == null) {
    console.warn('menu_id is null')
    return
  }

  isAddingOrder.value = true
  try {
    await eventStore.addToCart({
      community_id: eventStore.event.community_id,
      event_id: eventStore.event.event_id,
      menus: [
        {
          menu_id,
          count: selectedCount.value,
        },
      ],
    })
    emit('added')
    closeDialog()
  } catch (e) {
    console.error(e)
  } finally {
    isAddingOrder.value = false
  }
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="500px" @click:outside="closeDialog()">
    <v-card class="pa-sm-10 pa-5">
      <EventMenuImage v-if="eventStore.event != null" :event="eventStore.event" :menu="menu" class="ma-3" />
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
          @click="closeDialog()"
        >
          {{ $t('cart_dialog.close') }}
        </v-btn>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped></style>
