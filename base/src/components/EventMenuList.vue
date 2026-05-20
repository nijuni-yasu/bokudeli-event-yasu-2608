<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { priceString } from '@shokujii/base/schemes/converter'
import { useEventStore, type BokudeliEventMenu } from '@shokujii/base/stores/event.js'
import { mdiFoodForkDrink } from '@mdi/js'
import EventMenuImage from '@shokujii/base/components/EventMenuImage.vue'

/** 横長レイアウトを適用するメニュー数の上限（この数以下は横長、超えるとグリッド） */
const HORIZONTAL_LAYOUT_MAX_COUNT = 2

const props = defineProps<{
  eventId: string
  disabled: boolean
}>()

const emit = defineEmits<{
  selectMenu: [menu: BokudeliEventMenu]
}>()

const display = useDisplay()
const { t: $t } = useI18n()
const eventStore = useEventStore(props.eventId)

// is_selected が true のメニューのみを表示
const filteredMenus = computed(() => {
  return eventStore.menus?.filter((menu) => menu.is_selected === true)
})

/** 横長レイアウトを使う条件: 2件以下 かつ PC・タブレット（スマホ xs のみグリッド） */
const useHorizontalLayout = computed(() => {
  if (filteredMenus.value === undefined || filteredMenus.value.length === 0) return false
  return filteredMenus.value.length <= HORIZONTAL_LAYOUT_MAX_COUNT && !display.xs.value
})
</script>
<template>
  <section>
    <v-row v-if="filteredMenus !== undefined && eventStore.event != null" class="align-stretch">
      <!-- 横長レイアウト: 2件以下 かつ PC・タブレットのみ -->
      <template v-if="useHorizontalLayout">
        <v-col v-for="menu of filteredMenus" :key="menu.menu_id" cols="12" class="pa-3">
          <v-card class="d-flex flex-column menu-card-horizontal">
            <v-row no-gutters class="flex-grow-1">
              <v-col cols="4" class="d-flex flex-shrink-0 align-stretch">
                <div class="menu-image-wrapper menu-image-wrapper-horizontal">
                  <EventMenuImage :event="eventStore.event" :menu="menu" :alt="menu.menu_name" cover />
                </div>
              </v-col>
              <v-col cols="8" class="pa-4 pa-md-5 d-flex flex-column menu-content-col">
                <v-card-title class="justify-start text-h5 font-weight-bold text-wrap pa-0 mb-3 flex-shrink-0">
                  {{ menu.menu_name }}
                </v-card-title>
                <v-card-text class="text-left text-subtitle-2 px-0 py-0 mb-3 description-text-single flex-shrink-0">
                  {{ menu.menu_description }}
                </v-card-text>
                <div class="menu-spacer" />
                <div class="d-flex align-center justify-space-between flex-wrap gap-2 flex-shrink-0">
                  <v-card-text class="text-left pa-0">
                    <span class="yen-text">¥ </span>
                    <span class="price-text">{{ priceString(menu.menu_price) }}</span>
                  </v-card-text>
                  <v-btn
                    class="menu-button menu-button-single"
                    :class="{ 'disable-menu-button': disabled }"
                    color="primary"
                    rounded="pill"
                    elevation="5"
                    :prepend-icon="mdiFoodForkDrink"
                    @click="emit('selectMenu', menu)"
                  >
                    {{ $t('event_details.menu_join_button') }}
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </template>

      <!-- グリッドレイアウト: 4件以上 または スマホ（3件以下でも） -->
      <template v-else>
        <v-col v-for="menu of filteredMenus" :key="menu.menu_id" md="4" sm="6" cols="12" class="pa-3">
          <v-card height="100%" color="text-center" class="d-flex flex-column">
            <v-row no-gutters class="flex-grow-1">
              <v-col cols="6" sm="12" class="d-flex flex-shrink-0">
                <div class="menu-image-wrapper">
                  <EventMenuImage
                    :event="eventStore.event"
                    :menu="menu"
                    :alt="menu.menu_name"
                    :aspect-ratio="1"
                    cover
                  />
                </div>
              </v-col>

              <v-col cols="6" sm="12" class="pa-2 d-flex flex-column menu-content-col">
                <v-card-title class="justify-start text-h6 font-weight-bold text-wrap pa-1 flex-shrink-0">
                  {{ menu.menu_name }}
                </v-card-title>
                <v-card-text class="text-left text-subtitle-2 px-1 py-0 description-text flex-shrink-0">
                  {{ menu.menu_description }}
                </v-card-text>
                <div class="menu-spacer" />
                <div class="flex-shrink-0">
                  <v-card-text class="text-right pa-0 ma-3">
                    <span class="yen-text">¥ </span>
                    <span class="price-text">{{ priceString(menu.menu_price) }}</span>
                  </v-card-text>
                  <v-row class="pb-1 px-2">
                    <v-col cols="12">
                      <v-btn
                        class="menu-button"
                        block
                        :class="{ 'disable-menu-button': disabled }"
                        color="primary"
                        rounded="pill"
                        elevation="5"
                        :prepend-icon="mdiFoodForkDrink"
                        @click="emit('selectMenu', menu)"
                      >
                        {{ $t('event_details.menu_join_button') }}
                      </v-btn>
                    </v-col>
                  </v-row>
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </template>

      <!-- no result found -->
      <v-col v-show="filteredMenus.length === 0" cols="12" class="text-center">
        <h4 class="mt-4">{{ $t('event_details.menu_empty') }}</h4>
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
/* 説明文: 2行で切り捨て（横長・グリッド共通） */
.description-text,
.description-text-single {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  /* autoprefixer: ignore next - line-clamp に必須 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  max-height: 2.8em;
}

/* 画像ラッパー共通 */
.menu-image-wrapper {
  overflow: hidden;
  flex-shrink: 0;
  width: 100%;
}

/* グリッドレイアウト: 画像を正方形で揃える */
.menu-image-wrapper:not(.menu-image-wrapper-horizontal) {
  aspect-ratio: 1;
}

/* 横長レイアウト: カードの高さを統一するための最小高さ */
.menu-card-horizontal {
  min-height: 200px;
}

/* 横長レイアウト: 画像をコンテンツ高さに合わせて表示（縦長可、下の余白をなくす） */
.menu-image-wrapper-horizontal {
  align-self: stretch;
  height: 100%;
  min-height: 0;
  display: flex;

  /* v-img が親の高さを埋めるようにする（aspect-ratio 未指定時は画像の元の比率で高さが決まるため） */
  :deep(.v-img) {
    height: 100%;
    flex: 1;
  }
}

/* flex の高さ計算のため min-height をリセット、テキスト切り捨てのため min-width をリセット */
.menu-content-col {
  min-height: 0;
  min-width: 0;
}

/* 横長・グリッド共通: 価格・ボタンを下揃えするためのスペーサー */
.menu-spacer {
  flex-grow: 1;
  min-height: 0;
}

.price-text {
  font-size: 22px;
  color: #3a3541de;
}
.yen-text {
  font-size: 16px;
  color: #3a3541de;
}

@media (max-width: 600px) {
  .menu-button {
    font-size: 13px !important;
    height: 30px !important;
  }
  .menu-button-single {
    font-size: 15px !important;
    height: 44px !important;
    padding-inline: 24px !important;
  }
  /* スマホ: 説明文を非表示 */
  .description-text,
  .description-text-single {
    display: none !important;
  }
}

@media (min-width: 601px) {
  .menu-button {
    font-size: 14px !important;
    height: 32px !important;
  }
  .menu-button-single {
    font-size: 16px !important;
    height: 48px !important;
    padding-inline: 28px !important;
  }
}
</style>
