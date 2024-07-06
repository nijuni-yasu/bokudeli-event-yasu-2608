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

    <!-- title -->
    <v-card-title class="my-1">
      {{ menu.name }}
    </v-card-title>
    <v-card-text class="my-1 py-0">
      {{ menu.description }}
    </v-card-text>
    <div class="spacer" />
    <v-card-text class="d-flex">
      <span v-if="menu.isSoldout" class="sold-out">売り切れ</span>
      <v-spacer />
      <span class="text-h6">{{ $n(menu.price, 'currency') }}</span>
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