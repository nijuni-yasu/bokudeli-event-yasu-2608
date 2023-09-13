<script setup lang="ts">
import Shop from '@/schemes/shop'

const props = defineProps<{
  shops: Shop[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', value: Shop): void
}>()

const displayShops = computed(() => {
  return props.shops.map((shop) => {
    const addInformation = { week: 'ここ', time: 'どうする？' }
    return { ...shop, ...addInformation }
  })
})

const submit = (shop: Shop) => {
  emit('submit', shop)
}
</script>

<template>
  <section>
    <v-row v-if="props.loading === false" class="justify-center">
      <v-col cols="10">
        <v-card flat class="pa-3 mt-2">
          <v-form class="multi-col-validation">
            <v-card-title class="pa-5">
              <v-icon size="50" class="text--primary me-3" icon="mdi-store" />
              <span>お店</span>
            </v-card-title>

            <!-- Activity -->
            <v-row>
              <v-col v-for="item in displayShops" :key="item.shop_id" md="4" sm="4" cols="12">
                <v-card class="mb-3 mx-0" color="text-center cursor-pointer">
                  <v-img :src="item.shop_image_url" cover aspect-ratio="1.91" />

                  <!-- title -->
                  <v-card-title class="justify-center pb-3 pre-line">
                    {{ item.shop_name }}
                  </v-card-title>
                  <v-card-text class="text-left pb-3">
                    {{ item.shop_description }}
                  </v-card-text>
                  <!-- <v-card-text class="text-left pb-3"> 曜日：{{ item.week }} </v-card-text>
                  <v-card-text class="text-left pb-3"> 時間：{{ item.time }} </v-card-text> -->
                  <v-btn color="primary" class="ma-5" @click="submit(item)"> このお店にする </v-btn>
                </v-card>
              </v-col>

              <!-- no result found -->
              <v-col v-show="!props.shops.length" cols="12" class="text-center">
                <h4 class="mt-4">お店が見つかりませんでした</h4>
              </v-col>
            </v-row>
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
<style lang="scss" scoped></style>
