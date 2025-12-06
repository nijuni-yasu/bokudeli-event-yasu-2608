<script setup lang="ts">
import { type PropType } from 'vue'
import { type BokudeliPartnerMenu } from '@shokujii/base/stores/partner.js'
import { convertToDate } from '@shokujii/base/utils/datetime'

defineProps({
  menu: {
    type: Object as PropType<BokudeliPartnerMenu>,
    required: true,
  },
})
</script>

<template>
  <v-card class="card">
    <v-img :src="menu.menu_image_url ?? undefined" cover aspect-ratio="1" />

    <v-card-title class="text-h5 py-3 text-wrap">
      {{ menu.menu_name }}
    </v-card-title>
    <v-card-text class="py-2">
      {{ menu.menu_description }}
    </v-card-text>
    <v-card-text v-if="menu.menu_date_start != null && menu.menu_date_end != null" class="py-2">
      <span class="limited">{{
        $t('menu_card.limited_edition', [convertToDate(menu.menu_date_start), convertToDate(menu.menu_date_end)])
      }}</span>
    </v-card-text>
    <v-card-text v-if="menu.is_sold_out" class="py-2">
      <span class="sold-out">{{ $t('menu_card.sold_out') }}</span>
    </v-card-text>
    <div class="spacer" />
    <v-card-text class="d-flex">
      <v-spacer />
      <span class="text-h4">{{ $n(menu.menu_price, 'currency') }}</span>
    </v-card-text>
    <slot></slot>
  </v-card>
</template>

<style scoped lang="scss">
.card {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  > * {
    flex-grow: 0;
  }
  .spacer {
    flex-grow: 1;
  }
}
.limited {
  color: red;
}
.sold-out {
  color: red;
}
</style>
