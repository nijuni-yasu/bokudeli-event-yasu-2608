<script setup lang="ts">
import type BokudeliEvent from '@/schemes/bokudeliEvent'
import { type Shop } from '@/schemes/shop'
import { Timestamp } from 'firebase/firestore'
import { mdiChevronLeft, mdiStorefrontOutline, mdiChevronRight, mdiHelpCircleOutline } from '@mdi/js'
import { convertTruncateText, postalcodeString } from '@/schemes/converter'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const props = defineProps<{
  shops: Shop[]
  modelValue: BokudeliEvent
  loading: boolean
  isUpdatedStartTime: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: BokudeliEvent): void
  (e: 'submit'): void
  (e: 'back'): void
  (e: 'next'): void
}>()

const event = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const displayShops = computed(() => {
  return props.shops.map((shop) => {
    const addInformation = { week: 'ここ', time: 'どうする？' }
    return { ...shop, ...addInformation }
  })
})

  // 注文締め切り日時を計算し更新
  const updateDeadlineDatetime = (shop: Shop) => {
  const startDateTime = event.value.event_start_datetime?.toDate()
  if (startDateTime == null) {
    throw new Error('startDateTime is null')
  }
  startDateTime.setDate(startDateTime.getDate() - shop.shop_deadline_datetime.days_before)
  // UTC なので必ず Date Object にしてから使う
  const deadLineTime = new Date(shop.shop_deadline_datetime.time)
  startDateTime.setHours(deadLineTime.getHours())
  startDateTime.setMinutes(deadLineTime.getMinutes())
  event.value.event_deadline_datetime = Timestamp.fromDate(startDateTime)
}

const submit = (shop: Shop) => {
  if (shop.shop_id == null) {
    console.error('shop_id is null')
    return
  }
  event.value.shop_id = shop.shop_id
  event.value.partner_id = shop.partner_id
  event.value.shop_name = shop.shop_name

  updateDeadlineDatetime(shop)
  emit('submit')
}

const back = () => {
  emit('back')
}
const next = () => {
  if (props.isUpdatedStartTime) {
    const selectedShop = props.shops.filter((shop) => shop.shop_id === event.value.shop_id).shift()
    if (!selectedShop) {
      throw new Error('selectedShop is null')
    }
    updateDeadlineDatetime(selectedShop)
  }
  emit('next')
}
const isOpenMinOrdersDialog = ref(false)
const isOpenDeadlineDialog = ref(false)

</script>

<template>
  <section>
    <v-row v-if="props.loading === false" class="justify-center">
      <v-col cols="12" sm="12" md="9">
        <v-card flat class="pa-3 mt-2">
          <v-form class="multi-col-validation">
            <v-card-title class="pa-3 text-h5 text-wrap">
              <v-icon size="50" class="text--primary me-3" :icon="mdiStorefrontOutline" />
              <span>{{ postalcodeString(event.event_postalcode) }}</span>
              <span>{{ $t('event_shop.event_postalcode_desc') }}</span>
            </v-card-title>
            <v-row>
              <v-col v-for="(item, i) of displayShops" :key="`shop_${i}`" md="4" sm="4" cols="12">
                <v-card
                  :class="{ 'select-border': item.partner_id == props.modelValue.partner_id }"
                  class="mb-3 mx-0  d-flex flex-column"
                  color="text-center cursor-pointer"
                  height="400px"
                >
                  <v-img :src="item.shop_image_url ?? undefined" cover aspect-ratio="1.91" />

                  <!-- title -->
                  <v-card-title class="justify-center pb-3">
                    {{ item.shop_name }}
                  </v-card-title>
                  <v-card-text class="text-left pb-3 text-subtitle-2">
                    {{ convertTruncateText(item.shop_description, 40) }}
                  </v-card-text>
                  <v-card-text class="text-left text-subtitle-2 pb-1">
                    【{{ $t('order_deadline') }}】 {{ $t('days_before', item.shop_deadline_datetime.days_before) }}
                    {{ $d(item.shop_deadline_datetime.time, 'time') }}
                    <v-btn
                      color="primary"
                      class="ma-0"
                      :icon="mdiHelpCircleOutline"
                      size="small"
                      density="compact"
                      variant="text"
                      @click="isOpenDeadlineDialog=true"
                    />
                  </v-card-text>
                  <v-card-text class="text-left text-subtitle-2 pb-1">
                    【{{ $t('shop_range_min_orders') }}】{{ item.min_orders_on_spot }} {{ $t('shop_range_min_orders_unit') }}
                    <v-btn
                      color="primary"
                      class="ma-0"
                      :icon="mdiHelpCircleOutline"
                      size="small"
                      density="compact"
                      variant="text"
                      @click="isOpenMinOrdersDialog=true"
                    />
                  </v-card-text>
                  <!-- <v-card-text class="text-left pb-3"> 曜日：{{ item.week }} </v-card-text>
                  <v-card-text class="text-left pb-3"> 時間：{{ item.time }} </v-card-text> -->                  
                  <v-spacer/>
                  <div class="text-center">
                    <v-btn
                      v-if="item.shop_id == props.modelValue.shop_id"
                      color="red"
                      class="ma-3"
                      size="large"
                      elevation="5"
                      :disabled="event.event_status.value !== 'in_draft'"
                      @click="submit(item)"
                    >
                    {{ $t('event_shop.button_selected') }}
                    </v-btn>
                    <v-btn
                      v-else
                      color="primary"
                      class="ma-3"
                      :append-icon="mdiChevronRight"
                      :disabled="event.event_status.value !== 'in_draft'"
                      @click="submit(item)"
                    >
                      {{ $t('event_shop.button_check_menu') }}
                    </v-btn>
                  </div>
                </v-card>
              </v-col>

              <!-- no result found -->
              <v-col v-show="!props.shops.length" cols="12" class="text-center">
                <h4 class="mt-4">お店が見つかりませんでした</h4>
              </v-col>
            </v-row>
            <v-card-text class="text-center mt-10">
              <v-btn color="primary" class="me-3 mt-3" size="large" :prepend-icon="mdiChevronLeft" @click="back"
                >前へ</v-btn
              >
              <v-btn
                v-if="props.modelValue.shop_id"
                color="primary"
                class="me-3 mt-3"
                size="large"
                :append-icon="mdiChevronRight"
                @click="next"
                >次へ</v-btn
              >
            </v-card-text>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-else class="justify-center">
      <v-col cols="10" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>
    <confirm-dialog v-model="isOpenDeadlineDialog" :is-confirm="false">
      <div v-html="$t('hint_dialog.deadline')"></div>
    </confirm-dialog>
    <confirm-dialog v-model="isOpenMinOrdersDialog" :is-confirm="false">
      {{ $t('hint_dialog.min_orders') }}
    </confirm-dialog>
  </section>
</template>
<style lang="scss" scoped>
.select-border {
  border: 5px solid #ff4c51;
}
</style>
