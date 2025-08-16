<script setup lang="ts">
import { getAuth } from 'firebase/auth'
import { useI18n } from 'vue-i18n'
import { usePartnerStore, BokudeliPartnerMenu } from '@shokujii/base/stores/partner.js'
import MenuEditCard from '@/components/MenuEditCard.vue'
import MenuCard from '@shokujii/base/components/MenuCard.vue'
import { mdiPlus, mdiClose } from '@mdi/js'
import { useNotification } from '@shokujii/base/composable/notification.js'

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
  targetMenu.value = Object.assign({}, toRaw(menu))
}
const saveMenu = async (menu: BokudeliPartnerMenu, file?: File) => {
  try {
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
})
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="12" sm="12" md="12" class="px-0">
      <v-row>
        <v-col v-for="(menu, i) of menus" :key="`item_${i}`" cols="12" sm="6" md="4" lg="3">
          <MenuCard class="menu-card clickable" :menu="menu" @click="openDialog(menu)">
            <v-btn
              :icon="mdiClose"
              class="close-button"
              size="x-small"
              color="#FFFFFF88"
              @click.stop="onDelete(menu)"
            />
          </MenuCard>
        </v-col>
        <v-col v-if="menus.length === 0" cols="12" sm="6" md="4" lg="3">
          <MenuCard class="menu-card" :menu="example" />
        </v-col>
        <v-col cols="12" sm="6" md="4" lg="3">
          <v-card
            class="menu-card clickable d-flex justify-center align-center"
            @click="openDialog(new BokudeliPartnerMenu(partnerId, null, {}))"
          >
            <v-icon size="64" :icon="mdiPlus" />
          </v-card>
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
</style>
