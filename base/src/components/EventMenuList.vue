<script setup lang="ts">
import { priceString } from '@/schemes/converter'
import { type PartnerMenu } from '@/schemes/partnerMenu'
import { mdiFoodForkDrink } from '@mdi/js'

defineProps<{
  menus: PartnerMenu[] | null
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'selectMenu', menu: PartnerMenu): void
}>()
</script>
<template>
  <section>
    <v-row v-if="menus !== null">
      <v-col v-for="(menu, i) of menus" :key="`menu_${i}`" md="4" sm="6" cols="12" class="pa-3">
        <v-card class="mb-1" color="text-center">
          <v-row no-gutters>
            <v-col cols="6" sm="12" class="d-flex">
              <v-img :src="menu.imageUrl ?? undefined" aspect-ratio="1" cover />
            </v-col>

            <v-col cols="6" sm="12" class="pa-2 d-flex flex-column">
              <v-card-title class="justify-start text-wrap px-1 py-0 pa-sm-1">
                {{ menu.name }}
              </v-card-title>
              <v-card-text class="text-left text-subtitle-2 text-wrap text-sm-no-wrap px-1 py-0 pa-sm-1">
                {{ menu.description }}
              </v-card-text>
              <v-spacer />
              <v-card-text class="text-right px-1 pt-2 pb-0 pa-sm-1">
                <span style="font-size: 14px; color: #3a3541de">¥ </span>
                <span style="font-size: 20px; color: #3a3541de">{{ priceString(menu.price) }}</span>
              </v-card-text>
              <v-btn
                class="menu-button"
                :class="{ 'disable-menu-button': disabled || menu.isSoldout === true }"
                color="primary"
                rounded="pill"
                elevation="5"
                :prepend-icon="mdiFoodForkDrink"
                @click="emit('selectMenu', menu)"
              >
                {{ menu.isSoldout === true ? '売り切れ' : '注文して参加する' }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- no result found -->
      <v-col v-show="menus !== null && menus.length === 0" cols="12" class="text-center">
        <h4 class="mt-4">メニューがありません</h4>
      </v-col>
    </v-row>
    <v-row v-else class="justify-center">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>
  </section>
</template>
<style lang="scss" scoped>
.disable-menu-button {
  opacity: 0.6;
}

@media (max-width: 600px) {
  .menu-button {
    font-size: 13px !important;
    height: 30px !important;
    margin: 10px 10px 5px 10px !important;
  }
  .text-sm-no-wrap {
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
}

@media (min-width: 601px) {
  .menu-button {
    font-size: 14px !important;
    height: 32px !important;
    margin: 10px 20px 5px 20px !important;
  }
}
</style>
