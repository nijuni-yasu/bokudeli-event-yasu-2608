<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { type BokudeliPartnerShop } from '@shokujii/base/stores/partner.js'
import { BokudeliEventMenu } from '@shokujii/base/stores/event.js'
import { priceString } from '@shokujii/base/schemes/converter'
import { mdiStorefrontOutline, mdiGestureTap } from '@mdi/js'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import EventMenuImage from '@shokujii/base/components/EventMenuImage.vue'

const { t } = useI18n()

const props = defineProps<{
  shop: BokudeliPartnerShop | null
  menus: BokudeliEventMenu[]
  event: BokudeliEvent
  loading: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:selectedMenuIds': [selectedMenuIds: string[]]
}>()

// メニューの選択状態をトグル
const toggleMenuSelection = (menuId: string) => {
  // 編集が無効化されている場合は何もしない
  if (props.disabled) return

  // 現在の選択状態を反転させた新しい選択IDリストを作成
  const currentMenu = props.menus.find((m) => m.menu_id === menuId)
  if (!currentMenu) return

  // 最後の1つを非選択にしようとした場合は何もしない
  if (currentMenu.is_selected && selectedCount.value === 1) {
    return
  }

  // 現在選択されているメニューIDのリスト
  const selectedIds = props.menus.filter((m) => m.is_selected).map((m) => m.menu_id)

  // 選択状態を反転
  const newSelectedMenuIds = currentMenu.is_selected
    ? selectedIds.filter((id) => id !== menuId) // 非選択に: 削除
    : [...selectedIds, menuId] // 選択に: 追加

  emit('update:selectedMenuIds', newSelectedMenuIds)
}

// メニューが選択されているかチェック
const isMenuSelected = (menuId: string): boolean => {
  return props.menus.find((m) => m.menu_id === menuId)?.is_selected ?? false
}

// 最後の1つの選択メニューかどうかを判定
const isLastSelected = (menuId: string): boolean => {
  return selectedCount.value === 1 && isMenuSelected(menuId)
}

// 選択済みカウント
const selectedCount = computed(() => {
  return props.menus.filter((menu) => menu.is_selected).length
})
</script>

<template>
  <section>
    <v-row v-if="!props.loading" class="justify-center">
      <v-col cols="12" sm="12" md="10">
        <v-card flat class="pa-3 mt-2">
          <v-form class="multi-col-validation">
            <v-card-title class="text-h3">
              <v-icon size="50" class="text--primary me-3" :icon="mdiStorefrontOutline" />
              {{ event.shop_name }}
            </v-card-title>
            <v-card-text class="text-left text-h5 my-3">
              {{ shop?.shop_description }}
            </v-card-text>

            <!-- 選択カウント表示 -->
            <v-alert v-if="props.menus.length" :icon="mdiGestureTap" variant="tonal" color="primary" class="mx-2 my-6">
              <div class="d-flex flex-wrap align-center gap-2">
                <span class="text-body-1 font-weight-bold">{{ t('event_menu.select_menu_instruction') }}</span>
                <v-chip color="primary" variant="elevated" size="small">
                  {{ t('event_menu.selected_count', { count: selectedCount, total: props.menus.length }) }}
                </v-chip>
              </div>
            </v-alert>
            <v-card-subtitle v-else class="text-center text-h4 my-15 py-15">
              {{ t('event_menu.no_menus_found') }}
            </v-card-subtitle>

            <v-row>
              <v-col v-for="(item, i) of props.menus" :key="`menu_${i}`" md="4" sm="4" cols="12">
                <v-card
                  class="mb-3 mx-0 menu-card"
                  :class="{
                    'menu-selected': isMenuSelected(item.menu_id),
                    'menu-unselected': !isMenuSelected(item.menu_id),
                    'menu-clickable': !props.disabled && !isLastSelected(item.menu_id),
                    'menu-disabled': props.disabled || isLastSelected(item.menu_id),
                  }"
                  @click="toggleMenuSelection(item.menu_id)"
                >
                  <EventMenuImage :event="event" :menu="item" cover :aspect-ratio="1" />

                  <!-- 選択状態インジケーター -->
                  <v-chip
                    :color="isMenuSelected(item.menu_id) ? 'primary' : 'grey'"
                    variant="elevated"
                    class="selection-indicator"
                    size="default"
                  >
                    {{ isMenuSelected(item.menu_id) ? t('event_menu.orderable') : t('event_menu.not_orderable') }}
                  </v-chip>

                  <!-- title -->
                  <v-card-title class="justify-center pb-3 text-wrap">
                    {{ item.menu_name }}
                  </v-card-title>
                  <v-card-text class="text-left text-subtitle-2 pb-8">
                    {{ item.menu_description }}
                  </v-card-text>
                  <v-card-text class="text-right text-h5 pb-5"> ¥ {{ priceString(item.menu_price) }} </v-card-text>
                </v-card>
              </v-col>
            </v-row>
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
<style lang="scss" scoped>
.menu-card {
  position: relative;
  text-align: center;
  transition: all 0.3s ease;
}

.menu-clickable {
  cursor: pointer;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 8px 16px rgba(var(--v-shadow-key-umbra), 0.2);
  }
}

.menu-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.menu-selected {
  border: 4px solid rgb(var(--v-theme-primary));
  background-color: rgb(var(--v-theme-grey-50));
  opacity: 0.9;
}

.menu-unselected {
  border: 2px solid rgb(var(--v-theme-grey-400));
  background-color: rgb(var(--v-theme-grey-100));
  opacity: 0.6;
}

.selection-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
}
</style>
