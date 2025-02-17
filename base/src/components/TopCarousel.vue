<script setup lang="ts">
import topLogo from '@/assets/images/shokujii/shokujii_logo_cover.gif'
import { TopCarousel } from '@/schemes/topCarousel'
import { mdiChevronLeft, mdiChevronRight } from '@mdi/js'
import { db } from '../firebase'
import { getDoc, doc } from 'firebase/firestore'

const items = ref<TopCarousel[]>([])
const defaultImage = topLogo

/**
 * URLを新しいタブで開く関数
 * @param url - 開くURL
 */
function onOpenUrl(url: string) {
  window.open(url, '_blank')
}


const fetchTopCarousels = async (): Promise<TopCarousel[]> => {
  const topCarousels: TopCarousel[] = []

  try {
    const topCarouselRef = doc(db, 'assets', 'top_carousel')
    const topCarouselSnap = await getDoc(topCarouselRef)
    if (topCarouselSnap.exists()) {
      // 取得したデータを読み込む
      const data = topCarouselSnap.data()
      console.log(data)

      // 配列データが存在する場合に展開
      if (Array.isArray(data.top_carousels)) {
        data.top_carousels.forEach((carousel: TopCarousel) => {
          topCarousels.push(carousel)
        })
      }
    } else {
      console.log('No such document!')
    }
  } catch (error) {
    console.error('Error fetching top carousels:', error)
  }
  return topCarousels
}

onMounted(async () => {
  items.value = await fetchTopCarousels()
})
</script>

<template>
  <v-card>
    <v-carousel
      cycle
      height="auto"
      hide-delimiter-background
      :show-arrows="true"
    >
      <template v-slot:prev="{ props }">
        <v-btn
          color="#EEEEEE"
          size="large"
          :icon="mdiChevronLeft"
          variant="text"
          @click="props.onClick"
        />
      </template>
      <template v-slot:next="{ props }">
        <v-btn
          color="#EEEEEE"
          size="large"
          :icon="mdiChevronRight"
          variant="text"
          @click="props.onClick"
        />
      </template>
      <v-carousel-item
        cover
        hide-delimiter
        class="clickable-item carousel-item"
        :src="defaultImage"
        @click="onOpenUrl('https://about.shokujii.jp/')"
      />
      <v-carousel-item
        v-for="carousel in items"
        cover
        hide-delimiter
        :class="{ 'clickable-item': carousel.link_url }"
        class="carousel-item"
        :src="carousel.image_url"
        @click="carousel.link_url && onOpenUrl(carousel.link_url)"
      />
    </v-carousel>
  </v-card>
</template>

<style lang="scss" scoped>
.clickable-item {
  cursor: pointer;
}
.carousel-item {
  aspect-ratio: 5 / 1; /* 5:1 の縦横比 */
  width: 100%;
  object-fit: cover;
}
</style>
