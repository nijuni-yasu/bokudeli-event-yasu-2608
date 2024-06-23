<script setup lang="ts">
import type BokudeliEvent from '@/schemes/bokudeliEvent'
import { type Shop } from '@/schemes/shop'
import { Timestamp } from 'firebase/firestore'

const props = defineProps<{
  shops: Shop[]
  modelValue: BokudeliEvent
  loading: boolean
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

const submit = (shop: Shop) => {
  event.value.shop_id = shop.shop_id
  event.value.partner_id = shop.partner_id
  event.value.shop_name = shop.shop_name

  // 注文締め切り日時を計算
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

  emit('submit')
}

const back = () => {
  emit('back')
}
const next = () => {
  emit('next')
}
</script>

<template>
  <section>
    <v-row v-if="props.loading === false" class="justify-center">
      <v-col cols="12" sm="12" md="9">
        <v-card flat class="pa-3 mt-2">
          <v-form class="multi-col-validation">
            <v-card-title class="pa-5">
              <v-icon size="50" class="text--primary me-3" icon="mdi-store" />
              <span>お店</span>
            </v-card-title>

            <!-- Activity -->
            <v-row>
              <v-col v-for="item in displayShops" :key="item.shop_id" md="4" sm="4" cols="12">
                <v-card
                  :class="{ 'select-border': item.partner_id == props.modelValue.partner_id }"
                  class="mb-3 mx-0"
                  color="text-center cursor-pointer"
                >
                  <v-img :src="item.shop_image_url" cover aspect-ratio="1.91" />

                  <!-- title -->
                  <v-card-title class="justify-center pb-3 pre-line">
                    {{ item.shop_name }}
                  </v-card-title>
                  <v-card-text class="text-left pb-3">
                    {{ item.shop_description }}
                  </v-card-text>
                  <v-card-text class="text-right">
                    {{ $t('order_deadline') }}： {{ $t('days_before', item.shop_deadline_datetime.days_before) }}
                    {{ $d(item.shop_deadline_datetime.time, 'time') }}
                  </v-card-text>
                  <!-- <v-card-text class="text-left pb-3"> 曜日：{{ item.week }} </v-card-text>
                  <v-card-text class="text-left pb-3"> 時間：{{ item.time }} </v-card-text> -->
                  <v-btn
                    v-if="item.shop_id == props.modelValue.shop_id"
                    color="red"
                    class="ma-5"
                    size="large"
                    :disabled="event.event_status.value !== 'in_draft'"
                    @click="submit(item)"
                  >
                    選択中
                  </v-btn>
                  <v-btn
                    v-else
                    color="primary"
                    class="ma-5"
                    size="large"
                    append-icon="mdi-chevron-right"
                    :disabled="event.event_status.value !== 'in_draft'"
                    @click="submit(item)"
                  >
                    このお店にする
                  </v-btn>
                </v-card>
              </v-col>

              <!-- no result found -->
              <v-col v-show="!props.shops.length" cols="12" class="text-center">
                <h4 class="mt-4">お店が見つかりませんでした</h4>
              </v-col>
            </v-row>
            <v-card-text class="text-center mt-10">
              <v-btn color="primary" class="me-3 mt-3" size="large" prepend-icon="mdi-chevron-left" @click="back"
                >前へ</v-btn
              >
              <v-btn
                v-if="props.modelValue.shop_id"
                color="primary"
                class="me-3 mt-3"
                size="large"
                append-icon="mdi-chevron-right"
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
  </section>
</template>
<style lang="scss" scoped>
.select-border {
  border: 5px solid #ff4c51;
}
</style>
