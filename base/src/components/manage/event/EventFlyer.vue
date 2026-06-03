<script setup lang="ts">
import { useEventStore, type EventStore } from '@shokujii/base/stores/event.js'
// import EventCard from '@shokujii/base/components/EventCard.vue'
import { getEventPath, getFlyerPath } from '@/router/utils'
// import { mdiPencil, mdiDelete, mdiCarWindshield } from '@mdi/js'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { getFlyerPdf } from '@shokujii/base/utils/flyer.js'
import VueQrious from 'vue-qrious'

defineProps<{
  flyerLogoUrl: string
}>()

const route = useRoute()
const notification = useNotification()
const { t: $t } = useI18n()

const eventId = route.params.eventId as string
const eventStore = useEventStore(eventId) as EventStore

const flyerSizes = [
  {
    label: 'A4サイズをダウンロード',
    size: 'A4',
  },
  {
    label: 'A5サイズをダウンロード',
    size: 'A5',
  },
]
// HTMLのタグを削除する関数
const stripHtmlTags = (html: string) => {
  // <a>タグのリンクテキストを抽出し、リンクを削除
  let textOnly = html.replace(/<a [^>]*>(.*?)<\/a>/gi, '$1')

  // 残りのHTMLタグを削除
  textOnly = textOnly.replace(/<[^>]+>/g, '')

  // 不要な空白を削除
  textOnly = textOnly.replace(/\s+/g, ' ')

  // 前後の空白を削除
  return textOnly.trim()
}
const eventCoverUrl = computed(() => eventStore.coverImageUrl)
const eventDesc = computed(() => {
  const desc = eventStore.event?.event_desc
  return desc ? stripHtmlTags(desc) : ''
})
const homeUrl = window.location.origin
const eventPath = computed(() => {
  if (!eventStore.event) return ''
  return `${homeUrl}${getEventPath(eventStore.event.community_account, eventId)}`
})

const downloadFlyer = async (size: string) => {
  try {
    const w = window.open(getFlyerPath(), '_blank')
    if (w == null) {
      notification.show($t('manage.flyer.download_error'), 'error')
      return
    }
    const pdf = await getFlyerPdf(eventId, size)
    w.location.href = window.URL.createObjectURL(pdf)
  } catch (error) {
    console.error('Error downloading flyer:', error)
    notification.show($t('manage.flyer.download_error'), 'error')
  }
}
</script>

<template>
  <v-container class="manage-container">
    <v-row class="justify-center">
      <v-col cols="12">
        <div class="text-center text-h5 mt-4">{{ $t('manage.flyer.title') }}</div>
        <div v-html="$t('manage.flyer.description')" class="text-center text-h5 mt-2 mb-8" />
        <v-row class="mt-4" justify="center" no-gutters>
          <v-col cols="12" class="d-flex flex-wrap justify-center ga-3">
            <v-btn
              v-for="size in flyerSizes"
              :key="size.label"
              @click="downloadFlyer(size.size)"
              size="large"
              elevation="6"
            >
              {{ size.label }}
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <!-- チラシのプレビュー -->
    <v-row class="justify-center mt-6">
      <v-col cols="auto">
        <v-card class="flyer-preview pa-4" style="width: 700px; margin: 0 auto">
          <!-- 1列目: イベントカバー画像 -->
          <div class="event-cover mb-4">
            <v-img :src="eventCoverUrl" :width="649.48" :height="340.48" cover class="rounded mx-auto" />
          </div>
          <!-- 2列目: QRコードと説明 -->
          <v-row no-gutters class="mt-2" align="end">
            <v-col class="qr-code-container">
              <div class="qr-code">
                <vue-qrious :value="eventPath" :size="132" />
              </div>
            </v-col>
            <!-- 右側: 説明文とロゴ -->
            <v-col class="description-container">
              <div class="event-description mb-2">
                <div class="description-content" v-html="eventDesc"></div>
              </div>
              <div class="shop-logo">
                <v-img :src="flyerLogoUrl" height="45.73" contain />
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.flyer-preview {
  background-color: white;
  border: 1px solid #e0e0e0;
  min-width: 700px;
  max-width: 700px;
}
.event-description {
  padding: 8px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  height: 75.8px;
  width: 504.65px;
}
/* HTMLコンテンツのスタイリング */
:deep(.description-content) {
  font-family: '_fb_, auto';
  font-size: 12px;
  color: rgb(0, 0, 0);
  line-height: 1.3; /* 倍率指定*/
  letter-spacing: 0em;
  text-transform: none;
  list-style-type: none;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4; /* 4行に制限 */
  line-clamp: 4;
}

:deep(.description-content p) {
  margin: 0;
  padding: 0;
  margin-bottom: 0.3em; /* 段落間の間隔 */
}
:deep(.description-content span) {
  font-weight: 400;
  font-style: normal;
  color: rgb(0, 0, 0);
  font-kerning: none;
  text-decoration: none;
}

:deep(.description-content br) {
  display: block;
  content: '';
  margin-bottom: 0.2em; /* 改行の間隔 */
}

:deep(.description-content strong) {
  color: #1976d2;
}

.qr-code-container {
  width: 134.53px;
  flex: 0 0 auto;
  margin-right: 8px;
  margin-left: 8px;
}

.qr-code {
  width: 131.53px;
  height: 131.53px;
  overflow: hidden;
}

.description-container {
  width: 504.65px;
  flex: 0 0 auto;
}

.shop-logo {
  height: 44.73px;
  width: 504.65px;
}

@media print {
  .flyer-preview {
    border: none;
  }
}
/* ボタンのスタイル */
.v-btn {
  white-space: nowrap;
  min-width: auto !important;
}
</style>
