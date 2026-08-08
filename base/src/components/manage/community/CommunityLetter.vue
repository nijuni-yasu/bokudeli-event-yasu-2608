<script setup lang="ts">
import { mdiPlus } from '@mdi/js'
import { useCreateAppLetterListStore, useCreateAppLetterStore } from '@shokujii/base/composable/useAppLetterStore.js'
import EventList from '@shokujii/base/components/EventList.vue'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import LetterTable from '@shokujii/base/components/LetterTable.vue'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import LetterEdit from '@shokujii/base/components/LetterEdit.vue'
import { BokudeliLetter } from '@shokujii/base/stores/letter.js'
import { getManageEventPath, getManageCommunitySettingsPath, getUserPath } from '@/router/utils'
import { useNotification } from '@shokujii/base/composable/notification.js'
import { useAppCommunityStore } from '@shokujii/base/composable/useAppCommunityStore.js'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'

const notification = useNotification()
const { t: $t } = useI18n()

const route = useRoute()
const router = useRouter()

const communityAccount = route.params.communityAccount as string
const letterId = route.query.letterId as string | undefined

const communityStore = useAppCommunityStore(communityAccount)
const community = computed(() => communityStore.community)

const createLetterListStore = useCreateAppLetterListStore()
const createLetterStore = useCreateAppLetterStore()
const letterListStore = createLetterListStore(communityAccount)
const letters = computed(() => letterListStore.letterStores?.flatMap((ls) => ls.letter ?? []) ?? [])

const getLetter = async (letterId: string): Promise<BokudeliLetter> => {
  if (letterId === '') {
    return letterListStore.newLetter('community')
  } else {
    const letterStore = createLetterStore(communityAccount, letterId)
    return new Promise((resolve) => {
      watch(
        () => letterStore.letter,
        (letter) => {
          if (letter != null) {
            resolve(letter)
          }
        },
        { immediate: true },
      )
    })
  }
}
const selectedLetter = ref<BokudeliLetter | null>(letterId == null ? null : await getLetter(letterId))
watch(
  () => route.query.letterId,
  async (newLetterId) => {
    if (newLetterId == null) {
      selectedLetter.value = null
    } else {
      selectedLetter.value = await getLetter(newLetterId as string)
    }
  },
)
watch(
  () => route.query.copy,
  (copy) => {
    if (copy === undefined) {
      selectedLetter.value = null
    }
  },
)
const dialogType = ref(-1)
const letterTypeSelectDialog = computed({
  get: () => dialogType.value >= 0,
  set: (value) => {
    dialogType.value = value ? 0 : -1
  },
})
const onDialogClick1 = (value: 'event' | 'community') => {
  switch (value) {
    case 'event':
      dialogType.value = 1
      break
    case 'community':
      dialogType.value = -1
      router.push({ query: { letterId: '' } })
      break
  }
}
const onDialogClick2 = (event: BokudeliEvent) => {
  dialogType.value = -1
  router.push({ path: getManageEventPath(event.event_id) + '/letter', query: { letterId: '' } })
}
const onEditClick = (letter: BokudeliLetter) => {
  router.push({ query: { letterId: letter.letter_id } })
}
const onDeleteClick = async (letter: BokudeliLetter) => {
  await letterListStore.deleteLetter(letter.letter_id!)
  notification.show($t('manage.letter.notification.deleted'), 'success')
}
const onCopyClick = async (letter: BokudeliLetter) => {
  const letterStore = createLetterStore(communityAccount, letter.id)
  selectedLetter.value = await letterStore.copyLetter()
  router.push({ query: { copy: null } })
}
const onUserClick = (userId: string) => {
  router.push(getUserPath(userId))
}
const onUpdated = () => {
  selectedLetter.value = null
  router.push({ query: {} })
}
const isOpenConfirmDialog = ref(false)
const handleNewLetterClick = () => {
  if (community.value?.community_email == null || community.value.community_email === '') {
    isOpenConfirmDialog.value = true
    return
  }
  dialogType.value = 0
}
const goToCommunitySettings = () => {
  router.push(getManageCommunitySettingsPath(communityAccount))
}
</script>

<template>
  <v-container v-if="selectedLetter == null" class="manage-container">
    <v-row>
      <v-col md="12" sm="9" cols="12">
        <v-card class="pa-10 mb-10">
          <v-row>
            <v-card-text class="pa-3 title"><div v-html="$t('manage.letter.hint.title')" /></v-card-text>
          </v-row>
          <v-row>
            <v-card-text class="pa-3 description"><div v-html="$t('manage.letter.hint.description')" /></v-card-text>
          </v-row>
          <v-row>
            <v-card-text class="pa-3 description">
              <v-btn color="primary" size="large" :prepend-icon="mdiPlus" @click="handleNewLetterClick">
                {{ $t('manage.new_letter') }}
              </v-btn>
            </v-card-text>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
    <v-row class="justify-center">
      <v-col cols="12">
        <LetterTable
          :letters="letters"
          @edit="onEditClick"
          @delete="onDeleteClick"
          @copy="onCopyClick"
          @user-click="onUserClick"
        />
      </v-col>
    </v-row>
    <v-row v-show="(letters.length ?? 0) > 0" class="justify-center">
      <v-col md="8" sm="9" cols="12" class="text-center">
        <IncrementalLoader
          class="my-5"
          :total-count="letterListStore.totalCount ?? Number.MAX_SAFE_INTEGER"
          :loaded-count="letterListStore.letterStores?.length ?? 0"
          @load="letterListStore.next()"
        />
      </v-col>
    </v-row>
  </v-container>
  <v-container v-else class="manage-container">
    <v-row class="justify-center">
      <v-col md="10" sm="10" cols="12">
        <LetterEdit :letter="selectedLetter" @update:letter="onUpdated" />
      </v-col>
    </v-row>
  </v-container>
  <v-dialog v-model="letterTypeSelectDialog" max-width="600px">
    <v-card class="pa-5">
      <v-card-title class="text-h4 text-center font-weight-bold ma-3">{{ $t('manage.new_letter') }}</v-card-title>
      <v-card-text>
        <v-window v-model="dialogType">
          <v-window-item>
            <div class="ma-3">{{ $t('manage.letter.type_select_dialog.top') }}</div>
            <v-list class="list-with-borders">
              <v-list-item @click="onDialogClick1('event')">
                <v-list-item-title class="text-h5 mt-3">{{
                  $t('manage.letter.type_select_dialog.event')
                }}</v-list-item-title>
                <div>
                  {{ $t('manage.letter.type_select_dialog.event_description') }}
                </div>
              </v-list-item>
              <v-list-item @click="onDialogClick1('community')">
                <v-list-item-title class="text-h5 mt-3">{{
                  $t('manage.letter.type_select_dialog.community')
                }}</v-list-item-title>
                <div>{{ $t('manage.letter.type_select_dialog.community_description') }}</div>
              </v-list-item>
            </v-list>
          </v-window-item>
          <v-window-item>
            <div class="text-center mb-5">{{ $t('manage.letter.event_dialog.top') }}</div>
            <EventList :community-account="communityAccount" @click="onDialogClick2" />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>
  <confirm-dialog v-model="isOpenConfirmDialog" :ok-text="'OK'" max-width="700px" :ok-click="goToCommunitySettings">
    <v-card-text class="text-center py-10 text-h4">
      {{ $t('manage.letter.email_not_set.title') }}
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2.4rem">
      <div v-html="$t('manage.letter.email_not_set.description')" />
    </v-card-text>
  </confirm-dialog>
</template>

<style scoped>
.list-with-borders .v-list-item:not(:last-child) {
  border-bottom: 1px solid #e0e0e0;
}

/* vuetify のコンポーネントに関わる設定なので
   styles/variables/_vutify.css などで全体設定した方が良いかもしれない */
.v-list-item-title {
  font-weight: bold;
  line-height: 2rem;
}
.title {
  font-size: 22px;
  font-weight: 700;
  text-align: left;
}
.description {
  font-size: 14px;
  font-weight: 400;
  line-height: 30px;
  text-align: left;
  text-underline-position: from-font;
  text-decoration-skip-ink: none;
}
</style>
