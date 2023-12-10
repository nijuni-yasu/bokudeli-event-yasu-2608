<script setup lang="ts">
import PartnerMenu from '@/schemes/partnerMenu'

const props = defineProps<{
  menus: PartnerMenu[]
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
</script>

<template>
  <section>
    <v-row v-if="!props.loading" class="justify-center">
      <v-col cols="10">
        <v-card flat class="pa-3 mt-2">
          <v-form class="multi-col-validation">
            <v-card-title class="pa-5">
              <v-icon size="50" class="text--primary me-3" icon="mdi-food-fork-drink" />
              <span>メニュー</span>
            </v-card-title>

            <!-- Activity -->
            <v-row>
              <v-col v-for="item in props.menus" :key="item.id" md="4" sm="4" cols="12">
                <v-card class="mb-3 mx-0" color="text-center cursor-pointer">
                  <v-img :src="item.imageUrl" cover aspect-ratio="1" />

                  <!-- title -->
                  <v-card-title class="justify-center pb-3 pre-line">
                    {{ item.name }}
                  </v-card-title>
                  <v-card-text class="text-left pb-8">
                    {{ item.description }}
                  </v-card-text>
                  <v-card-text class="text-right text-h6 pb-2"> ¥ {{ item.price }} </v-card-text>
                </v-card>
              </v-col>

              <!-- no result found -->
              <v-col v-show="!props.menus.length" cols="12" class="text-center">
                <h4 class="mt-4">メニューが見つかりませんでした</h4>
              </v-col>
            </v-row>

            <v-card-text class="text-center mt-10">
              <v-btn color="primary" class="me-3 mt-3" size="large" variant="outlined" prepend-icon="mdi-chevron-left" @click="back">前へ</v-btn>
              <v-btn color="primary" class="me-3 mt-3" size="large" append-icon="mdi-chevron-right" @click="submit">次へ</v-btn>
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
