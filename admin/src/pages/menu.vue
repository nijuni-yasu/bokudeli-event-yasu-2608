<script setup lang="ts">
import { getAuth } from 'firebase/auth'
import { useI18n } from 'vue-i18n'
import { usePartnerStore, BokudeliPartnerMenu } from '@shokujii/base/stores/partner.js'
import MenuEditCard from '@/components/MenuEditCard.vue'
import MenuCard from '@shokujii/base/components/MenuCard.vue'
import { mdiPlus, mdiClose } from '@mdi/js'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { VueDraggableNext as draggable } from 'vue-draggable-next'

const notification = useNotification()

const { t: $t } = useI18n()

const partnerId = getAuth().currentUser?.uid ?? ''
const partnerStore = usePartnerStore(partnerId)

const menus = await new Promise<Ref<BokudeliPartnerMenu[]>>((resolve) => {
  watch(
    () => partnerStore.menus,
    () => {
      if (partnerStore.menus != null) {
        resolve(computed<BokudeliPartnerMenu[]>(() => partnerStore.menus ?? []))
        stop()
      }
    },
    { immediate: true },
  )
})

// 並び替え用のローカル状態
const sortedMenus = ref<BokudeliPartnerMenu[]>([])
const originalMenuIds = ref<string[]>([])

// メニューが読み込まれたら、ローカル状態を初期化
watch(
  () => menus.value,
  (newMenus) => {
    if (newMenus != null) {
      // メニューが追加・削除された場合、または初回読み込み時は並び順をリセット
      const currentMenuIds = sortedMenus.value.map((m) => m.id)
      const newMenuIds = newMenus.map((m) => m.id)
      const menusChanged =
        currentMenuIds.length !== newMenuIds.length || currentMenuIds.some((id, index) => id !== newMenuIds[index])

      if (menusChanged || sortedMenus.value.length === 0) {
        sortedMenus.value = [...newMenus]
        originalMenuIds.value = newMenus.map((m) => m.id)
      }
    } else {
      sortedMenus.value = []
      originalMenuIds.value = []
    }
  },
  { immediate: true },
)

const targetMenu: Ref<BokudeliPartnerMenu | null> = ref(null)

const dialog = computed({
  get: () => targetMenu.value != null,
  set: (value) => {
    if (!value) {
      targetMenu.value = null
    }
  },
})

const openDialog = (menu: BokudeliPartnerMenu) => {
  targetMenu.value = Object.assign(Object.create(Object.getPrototypeOf(menu)), menu)
}
const saveMenu = async (menu: BokudeliPartnerMenu, file?: File) => {
  try {
    // 新規作成の場合、menu_sort_number を設定
    if (menu.id == null || menus.value.find((m) => m.id === menu.id) == null) {
      // 既存のメニュー数をカウントして最後の値にする
      const menuCount = menus.value?.length ?? 0
      menu.menu_sort_number = menuCount
    }
    // 編集保存の場合、menu_sort_number は既に targetMenu に設定されているので変更しない

    await partnerStore.updateMenu(menu, file)
    notification.show($t('menu.saved'), 'success')
  } catch (e) {
    console.error(e)
    notification.show($t('menu.save_error'), 'error')
  }
}
const onDelete = (menu: BokudeliPartnerMenu) => {
  if (menu.id == null) {
    console.error('menu.id is null')
    notification.show($t('menu.delete_error'), 'error')
    return
  }
  const result = window.confirm($t('menu.delete_confirm'))
  if (result) {
    try {
      partnerStore.deleteMenu(menu.id)
      notification.show($t('menu.deleted'), 'success')
    } catch (e) {
      console.error(e)
      notification.show($t('menu.delete_error'), 'error')
    }
  }
}

const example = new BokudeliPartnerMenu(partnerId, null, {
  menu_image_url: 'deli_example.png',
  menu_name: $t('menu.example.name'),
  menu_description: $t('menu.example.description'),
  menu_price: 800,
  menu_sort_number: 0,
})

// 並び順保存処理（ドラッグ終了時に自動呼び出し）
const saveSortOrder = async () => {
  try {
    const menuIds = sortedMenus.value.map((m) => m.id)
    // 並び順が実際に変更されたかチェック
    const hasChanged =
      menuIds.length === originalMenuIds.value.length &&
      menuIds.some((id, index) => id !== originalMenuIds.value[index])

    if (hasChanged) {
      await partnerStore.updateMenuSortOrder(menuIds)
      originalMenuIds.value = [...menuIds]
      notification.show($t('menu.sort_order_saved'), 'success')
    }
  } catch (e) {
    console.error(e)
    notification.show($t('menu.sort_order_save_error'), 'error')
  }
}
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="12" sm="12" md="12" class="px-0">
      <div class="ma-4 d-flex justify-start align-center gap-2">
        <v-btn
          color="primary"
          size="x-large"
          :prepend-icon="mdiPlus"
          @click="openDialog(new BokudeliPartnerMenu(partnerId, null, {}))"
        >
          {{ $t('menu.add') }}
        </v-btn>
      </div>
      <draggable v-model="sortedMenus" class="d-flex flex-wrap" @end="saveSortOrder">
        <div v-for="menu in sortedMenus" :key="menu.id" class="menu-item-wrapper">
          <MenuCard class="menu-card clickable draggable-item" :menu="menu" @click="openDialog(menu)">
            <v-btn
              :icon="mdiClose"
              class="close-button"
              size="x-small"
              color="#FFFFFF88"
              @click.stop="onDelete(menu)"
            />
          </MenuCard>
        </div>
      </draggable>
      <v-row>
        <v-col v-if="menus.length === 0" cols="12" sm="6" md="4" lg="3">
          <MenuCard class="menu-card" :menu="example" />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
  <v-dialog v-if="targetMenu != null" v-model="dialog" max-width="600px">
    <MenuEditCard
      v-model="targetMenu"
      @save="
        (menu, imageFile) => {
          ;(saveMenu(menu, imageFile), (dialog = false))
        }
      "
      @cancel="dialog = false"
    >
      <template #title> {{ targetMenu.id == null ? $t('menu.add') : $t('menu.edit') }} </template>
    </MenuEditCard>
  </v-dialog>
</template>

<style scoped lang="scss">
.menu-card {
  height: 100%;
  width: 100%;
  min-height: 300px;
  margin: 16px;

  .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    color: black;
  }
}

.clickable {
  cursor: pointer;
}

.draggable-item {
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.menu-item-wrapper {
  position: relative;
  height: 100%;
  flex: 0 0 calc(100% - 16px);
  margin: 8px;

  @media (min-width: 600px) {
    flex: 0 0 calc(50% - 16px);
  }

  @media (min-width: 960px) {
    flex: 0 0 calc(33.333% - 16px);
  }

  @media (min-width: 1264px) {
    flex: 0 0 calc(25% - 16px);
  }
}
</style>
