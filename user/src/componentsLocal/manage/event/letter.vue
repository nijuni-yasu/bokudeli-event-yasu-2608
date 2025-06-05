<script setup lang="ts">
import { mdiPlus } from '@mdi/js'
import IncrementalLoader from '@/components/IncrementalLoader.vue'
import LetterTable from '@/components/LetterTable.vue'
import type BokudeliEvent from '@/schemes/bokudeliEvent'
import LetterEdit from '@/components/LetterEdit.vue'
import type { Letter } from '@/schemes/letter'
import { useEventStore } from '@/stores/event'
import { useLetterListStore } from '@/stores/letterList'
import { Timestamp } from 'firebase/firestore'
import { useLetterStore } from '@/stores/letter'
import { getManageCommunityPath } from '@/router/utils'
import { useNotification } from '@/composable/notification'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useCommunityStore } from '@/stores/community'

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

const getLetter = async (letterId: string) => {
  if (letterId === '') {
    return {
      community_account: event.community_account,
      event_id: event.event_id,
      letter_type: 'event_participant',
      letter_title: '',
      letter_content: '',
      status: 'draft',
      updated_at: Timestamp.now(),
    }
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
const selectedLetter = ref<Letter | null>(letterId == null ? null : ((await getLetter(letterId)) as Letter))
watch(
  () => route.query.letterId,
  async (newLetterId) => {
    if (newLetterId == null) {
      selectedLetter.value = null
    } else {
      selectedLetter.value = (await getLetter(newLetterId as string)) as Letter
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
const onEditClick = (letter: Letter) => {
  router.push({ query: { letterId: letter.letter_id } })
}
const onDeleteClick = async (letter: Letter) => {
  await letterListStore.deleteLetter(letter.letter_id!)
  notification.show($t('manage.letter.notification.deleted'), 'success')
}
const onCopyClick = async (letter: Letter) => {
  const newLetter: Letter = {
    ...letter,
    updated_at: Timestamp.now(),
    status: 'draft',
  }
  delete newLetter.letter_id
  delete newLetter.scheduled_at
  delete newLetter.sent_at
  selectedLetter.value = newLetter
  router.push({ query: { copy: null } })
}
const onUpdated = (letter: Letter) => {
  selectedLetter.value = null
  if (letter.letter_type === 'community') {
    router.push(getManageCommunityPath(event.community_account) + '/letter')
  } else {
    router.push({ query: {} })
  }
}
const isOpenConfirmDialog = ref(false)

const handleNewLetterClick = () => {
  if (!community.value?.community_email) {
    isOpenConfirmDialog.value = true
    return
  }
  router.push({ query: { letterId: '' } })
}

</script>

<template>
  <v-container v-if="selectedLetter == null">
    <v-row class="justify-center">
      <v-col md="12" sm="9" cols="12">
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
        />
      </v-col>
    </v-row>
    <v-row v-show="letters.length ?? 0 !== 0" class="justify-center">
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
  <v-container v-else>
    <v-row class="justify-center">
      <v-col md="10" sm="10" cols="12">
        <LetterEdit :letter="selectedLetter" @update:letter="onUpdated" />
      </v-col>
    </v-row>
  </v-container>
  <confirm-dialog v-model="isOpenConfirmDialog" :ok-text="'OK'" max-width="700px">
    <v-card-text class="text-center py-10 text-h4">
      {{ $t('manage.letter.email_not_set.title') }}
    </v-card-text>
    <v-card-text class="pb-0" style="line-height: 2.4rem">
      <div v-html="$t('manage.letter.email_not_set.description')" />
    </v-card-text>
  </confirm-dialog>
</template>
