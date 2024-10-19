<script setup lang="ts">
import { PartnerMenu } from '@/schemes/partnerMenu'

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

    <v-card-title class="text-h5 my-2 text-wrap">
      {{ menu.name }}
    </v-card-title>
    <v-card-text class="my-1 py-0">
      {{ menu.description }}
    </v-card-text>
    <div class="spacer" />
    <v-card-text v-if="menu.dateStart && menu.dateEnd" class="d-flex">
      <span class="sold-out">期間限定：{{ menu.dateStart }}〜{{ menu.dateEnd }}</span>
    </v-card-text>
    <v-card-text v-if="menu.isSoldout" class="d-flex">
      <span class="sold-out">売り切れ</span>
    </v-card-text>
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