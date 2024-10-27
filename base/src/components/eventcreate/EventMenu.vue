<script setup lang="ts">
import { type PartnerMenu } from '@/schemes/partnerMenu'
import { dateString, priceString } from '@/schemes/converter'
import { mdiChevronLeft, mdiFoodForkDrink, mdiChevronRight, mdiStorefrontOutline } from '@mdi/js'
import { parseISO, compareDesc } from 'date-fns'
import type BokudeliEvent from '@/schemes/bokudeliEvent'
import type { Shop } from '@/schemes/shop'

const props = defineProps<{
  menus: PartnerMenu[]
  event: BokudeliEvent
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'back'): void
}>()

const submit = () => {
  emit('submit')
}
const back = () => {
  emit('back')
}
const shop = defineModel<Shop | null>('shop', { required: true })
const shop_description = computed(() => (shop.value !== null ? shop.value.shop_description : ''))

const filteredMenu = computed(() => props.menus.filter((menu) => {
  if (!menu.dateStart || !menu.dateEnd) {
    return true
  } else {
    const eventStartDate = parseISO(dateString(props.event.event_start_datetime?.toDate() ?? null))
    const dateStart = parseISO(menu.dateStart)
    const dateEnd = parseISO(menu.dateEnd)
    return compareDesc(dateStart, eventStartDate) >= 0 && compareDesc(eventStartDate, dateEnd) >= 0
  }
}))
</script>

<template>
  <section>
    <v-row v-if="!props.loading" class="justify-center">
      <v-col cols="12" sm="12" md="9">
        <v-card flat class="pa-3 mt-2">
          <v-form class="multi-col-validation">
            <v-card-text class="text-h3">
              <v-icon size="50" class="text--primary me-3" :icon="mdiStorefrontOutline" />
              {{ event.shop_name }}
            </v-card-text>
            <v-card-text class="mb-5">
              {{ shop_description }}
            </v-card-text>
            <v-row>
              <v-col v-for="(item, i) of filteredMenu" :key="`menu_${i}`" md="4" sm="4" cols="12">
                <v-card class="mb-3 mx-0" color="text-center cursor-pointer">
                  <v-img :src="item.imageUrl ?? undefined" cover aspect-ratio="1" />

                  <!-- title -->
                  <v-card-title class="justify-center pb-3 text-wrap">
                    {{ item.name }}
                  </v-card-title>
                  <v-card-text class="text-left text-subtitle-2 pb-8">
                    {{ item.description }}
                  </v-card-text>
                  <v-card-text class="text-right text-h5 pb-5"> ¥ {{ priceString(item.price) }} </v-card-text>
                </v-card>
              </v-col>

              <!-- no result found -->
              <v-col v-show="!props.menus.length" cols="12" class="text-center">
                <h4 class="mt-4">メニューが見つかりませんでした</h4>
              </v-col>
            </v-row>

            <v-card-text class="text-center mt-10">
              <v-btn color="primary" class="me-3 mt-3" size="large" :prepend-icon="mdiChevronLeft" @click="back"
                >前へ</v-btn
              >
              <v-btn color="primary" class="me-3 mt-3" size="large" :append-icon="mdiChevronRight" @click="submit"
                >次へ</v-btn
              >
            </v-card-text>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-else class="justify-center">
      <v-col cols="10">
        <v-progress-circular indeterminate color="primary" />
      </v-col>
    </v-row>
  </section>
</template>
<style lang="scss" scoped></style>
