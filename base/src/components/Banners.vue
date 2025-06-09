<script setup lang="ts">
import { mdiChevronLeft, mdiChevronRight } from '@mdi/js'
import { FIRESTORE_LOADING } from '@/utils/const'
import { type Banner } from '@/schemas/Banners'

defineProps<{
  banners: typeof FIRESTORE_LOADING | Banner[]
}>()

/**
 * URLを新しいタブで開く関数
 * @param url - 開くURL
 */
function onOpenUrl(url: string | undefined) {
  if (url === undefined) {
    return
  }
  window.open(url, '_blank')
}
</script>

<template>
  <v-card>
    <v-carousel cycle height="auto" hide-delimiter-background :show-arrows="true">
      <template v-slot:prev="{ props }">
        <v-btn color="#EEEEEE" size="large" :icon="mdiChevronLeft" variant="text" @click="props.onClick" />
      </template>
      <template v-slot:next="{ props }">
        <v-btn color="#EEEEEE" size="large" :icon="mdiChevronRight" variant="text" @click="props.onClick" />
      </template>
      <template v-if="banners === FIRESTORE_LOADING">
        <v-carousel-item cover hide-delimiter class="carousel-item">
          <div class="progress-center">
            <v-progress-circular indeterminate color="primary" />
          </div>
        </v-carousel-item>
      </template>
      <template v-else>
        <v-carousel-item
          v-for="banner in banners"
          cover
          hide-delimiter
          :class="{ 'clickable-item': banner.link_url !== undefined }"
          class="carousel-item"
          :src="banner.image_url"
          @click="onOpenUrl(banner.link_url)"
        />
      </template>
    </v-carousel>
  </v-card>
</template>

<style lang="scss" scoped>
.progress-center {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
.clickable-item {
  cursor: pointer;
}
.carousel-item {
  aspect-ratio: 5 / 1; /* 5:1 の縦横比 */
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
