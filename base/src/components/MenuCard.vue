<script setup lang="ts">
import { PartnerMenu } from '@/schemes/partnerMenu'
import { useI18n } from 'vue-i18n'

defineProps({
  menu: {
    type: Object as PropType<PartnerMenu>,
    required: true,
  },
})
</script>

<template>
  <v-card class="card">
    <v-img :src="menu.imageUrl ?? undefined" cover aspect-ratio="1" />

    <v-card-title class="text-h5 py-3 text-wrap">
      {{ menu.name }}
    </v-card-title>
    <v-card-text class="py-2">
      {{ menu.description }}
    </v-card-text>
    <v-card-text v-if="menu.dateStart && menu.dateEnd" class="py-2">
      <span class="sold-out">【{{ $t('menu_card.limited_edition')}}】{{ menu.dateStart }}〜{{ menu.dateEnd }}</span>
    </v-card-text>
    <v-card-text v-if="menu.isSoldout" class="py-2">
      <span class="sold-out">{{ $t('menu_card.sold_out') }}</span>
    </v-card-text>
    <div class="spacer" />
    <v-card-text class="d-flex">
      <v-spacer />
      <span class="text-h4">{{ $n(menu.price, 'currency') }}</span>
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
.sold-out {
  color: red;
}
</style>