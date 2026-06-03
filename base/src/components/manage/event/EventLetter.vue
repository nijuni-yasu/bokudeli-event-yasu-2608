<script setup lang="ts">
import { mdiPlus } from '@mdi/js'
import IncrementalLoader from '@shokujii/base/components/IncrementalLoader.vue'
import LetterTable from '@shokujii/base/components/LetterTable.vue'
import { type BokudeliEvent } from '@shokujii/base/stores/event.js'
import LetterEdit from '@shokujii/base/components/LetterEdit.vue'
import { useEventStore } from '@shokujii/base/stores/event.js'
import { useLetterListStore } from '@shokujii/base/stores/letterList.js'
import { useLetterStore, type BokudeliLetter } from '@shokujii/base/stores/letter.js'
import { getManageCommunityPath, getManageCommunitySettingsPath, getUserPath } from '@/router/utils'
import { useNotification } from '@shokujii/base/composable/notification.js'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import { useCommunityStore } from '@shokujii/base/stores/community.js'

const notification = useNotification()
const { t: $t } = useI18n()

const route = useRoute()
const router = useRouter()

const eventId = route.params.eventId as string
const letterId = route.query.letterId as string | undefined

const eventStore = useEventStore(eventId)
const event: BokudeliEvent = await new Promise((resolve) => {
  watch(
    () => eventStore.event,
    (event) => {
      if (event != null) {
        resolve(event)
      }
    },
    { immediate: true },
  )
})

const communityStore = useCommunityStore(event.community_account)
const community = computed(() => communityStore.community)

const letterListStore = useLetterListStore(event.community_account)
const letters = computed(
  () =>
    letterListStore.letterStores?.flatMap((ls) =>
      ls.letter == null || ls.letter.letter_type == 'community' || ls.letter.event_id !== eventId ? [] : ls.letter,
    ) ?? [],
)

const getLetter = async (letterId: string): Promise<BokudeliLetter> => {
  if (letterId === '') {
    return letterListStore.newLetter('event_participant', event.event_id)
  }
  const letterStore = useLetterStore(event.community_account, letterId)
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
const onEditClick = (letter: BokudeliLetter) => {
  router.push({ query: { letterId: letter.letter_id } })
}
const onDeleteClick = async (letter: BokudeliLetter) => {
  await letterListStore.deleteLetter(letter.letter_id!)
  notification.show($t('manage.letter.notification.deleted'), 'success')
}
const onCopyClick = async (letter: BokudeliLetter) => {
  const letterStore = useLetterStore(event.community_account, letter.id)
  selectedLetter.value = await letterStore.copyLetter()
  router.push({ query: { copy: null } })
}
const onUserClick = (userId: string) => {
  router.push(getUserPath(userId))
}
const onUpdated = (letter: BokudeliLetter) => {
  selectedLetter.value = null
  if (letter.letter_type === 'community') {
    router.push(getManageCommunityPath(event.community_account) + '/letter')
  } else {
    router.push({ query: {} })
  }
}
const isOpenConfirmDialog = ref(false)

const handleNewLetterClick = () => {
  if (community.value?.community_email == null || community.value.community_email === '') {
    isOpenConfirmDialog.value = true
    return
  }
  router.push({ query: { letterId: '' } })
}
const goToCommunitySettings = () => {
  router.push(getManageCommunitySettingsPath(event.community_account))
}
</script>

<template>
  <v-container v-if="selectedLetter == null" class="manage-container">
    <v-row class="justify-center">
      <v-col md="12" sm="12" cols="12">
        <v-btn variant="outlined" :prepend-icon="mdiPlus" @click="handleNewLetterClick">
          {{ $t('manage.new_letter') }}
        </v-btn>
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
  <confirm-dialog v-model="isOpenConfirmDialog" :ok-text="'OK'" max-width="700px" :ok-click="goToCommunitySettings">
    <v-card-text class="text-center py-10 text-h4">
      {{ $t('manage.letter.email_not_set.title') }}
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2.4rem">
      <div v-html="$t('manage.letter.email_not_set.description')" />
    </v-card-text>
  </confirm-dialog>
</template>
