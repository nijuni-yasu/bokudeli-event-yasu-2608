<script setup lang="ts">
import { mdiPlus } from '@mdi/js'
import { useLetterListStore } from '@/stores/letterList'
import EventList from '@/components/EventList.vue'
import IncrementalLoader from '@/components/IncrementalLoader.vue'
import LetterCard from '@/components/LetterCard.vue'
import type BokudeliEvent from '@/schemes/bokudeliEvent'
import LetterEdit from '@/components/LetterEdit.vue'
import type { Letter } from '@/schemes/letter'
import { Timestamp } from 'firebase/firestore'
import { useLetterStore } from '@/stores/letter'
import { getManageEventPath } from '@/router/utils'
import { convertTruncateText } from '@/schemes/converter'

const route = useRoute()
const router = useRouter()

const communityAccount = route.params.communityAccount as string
const letterId = route.query.letterId as string | undefined

const letterListStore = useLetterListStore(communityAccount)
const letters = computed(() => letterListStore.letterStores?.flatMap((ls) => ls.letter ?? []) ?? [])

const getLetter = async (letterId: string) => {
  if (letterId === '') {
    return {
      community_account: communityAccount,
      letter_type: 'community',
      letter_title: '',
      letter_content: '',
      status: 'draft',
      updated_at: Timestamp.now(),
    }
  }
  const letterStore = useLetterStore(communityAccount, letterId)
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
const onEditClick = (letter: Letter) => {
  router.push({ query: { letterId: letter.letter_id } })
}
const onDeleteClick = (letter: Letter) => {
  letterListStore.deleteLetter(letter.letter_id!)
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
const onUpdated = () => {
  selectedLetter.value = null
  router.push({ query: {} })
}
</script>

<template>
  <v-container v-if="selectedLetter == null">
    <v-row class="justify-center">
      <v-col md="12" sm="9" cols="12">
        <v-btn variant="outlined" :prepend-icon="mdiPlus" @click="dialogType = 0">
          {{ $t('manage.new_letter') }}
        </v-btn>
      </v-col>
    </v-row>
    <v-row class="justify-center">
      <v-col cols="12">
        <v-card class="pa-8">
          <v-table>
            <thead>
              <tr>
                <th class="text-left status-cell">{{ $t('letter_table.status') }}</th>
                <th class="text-left">{{ $t('letter_table.content') }}</th>
                <th class="text-left">{{ $t('letter_table.type') }}</th>
                <th class="text-left">{{ $t('letter_table.num_targets') }}</th>
                <th class="text-left">{{ $t('letter_table.scheduled_at') }}</th>
                <th class="text-left"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="letter of letters" :key="letter!.letter_id">
                <tr>
                  <td class="status-cell">
                    <v-chip class="ma-2" color="primary" size="x-small">
                      {{ $t(`letter_status.${letter.status}`) }}
                    </v-chip>
                  </td>
                  <td class="py-5 content-cell">
                    <div class="text-h6 font-weight-bold mb-1">
                      {{ letter.letter_title }}
                    </div>
                    <div class="text-body-2">
                      {{ convertTruncateText(letter.letter_content, 40) }}
                    </div>
                  </td>
                  <td class="text-body-2">
                    {{ $t(`letter_type.${letter.letter_type}`) }}<br>
                    <span v-if="letter.letter_type === 'event_participant' || letter.letter_type === 'event_non_participant'">
                      [イベント名]
                    </span>
                  </td>
                  <td class="text-body-2">
                    10
                  </td>
                  <td class="text-body-2">
                    <td>{{ letter.scheduled_at ? $d(letter.scheduled_at.toDate(), 'datetime') : '-' }}</td>
                  </td>
                  <td>
                    <v-btn class="mt-3" variant="outlined" size="small" @click="onEditClick(letter)" >編集</v-btn><br>
                    <v-btn class="my-2" variant="outlined" size="small" @click="onDeleteClick(letter)" >削除</v-btn><br>
                    <v-btn class="mb-3" variant="outlined" size="small" @click="onCopyClick(letter)" >コピー</v-btn>
                  </td>
                </tr>
              </template>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
    <!-- <v-row>
      <v-col md="9" sm="9" cols="12" v-for="letter of letters" :key="letter!.letter_id">
        <LetterCard
          :letter="letter"
          @edit="onEditClick(letter)"
          @delete="onDeleteClick(letter)"
          @copy="onCopyClick(letter)"
        />
      </v-col>
    </v-row> -->
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
      <v-col md="8" sm="9" cols="12">
        <LetterEdit :letter="selectedLetter" @update:letter="onUpdated" />
      </v-col>
    </v-row>
  </v-container>
  <v-dialog v-model="letterTypeSelectDialog" max-width="600px">
    <v-card class="pa-5">
      <v-card-title>{{ $t('manage.new_letter') }}</v-card-title>
      <v-card-text>
        <v-window v-model="dialogType">
          <v-window-item>
            {{ $t('manage.letter.type_select_dialog.top') }}
            <v-list class="list-with-borders">
              <v-list-item @click="onDialogClick1('event')">
                <v-list-item-title>{{ $t('manage.letter.type_select_dialog.event') }}</v-list-item-title>
                <div>
                  {{ $t('manage.letter.type_select_dialog.event_description') }}
                </div>
              </v-list-item>
              <v-list-item @click="onDialogClick1('community')">
                <v-list-item-title>{{ $t('manage.letter.type_select_dialog.community') }}</v-list-item-title>
                <div>{{ $t('manage.letter.type_select_dialog.community_description') }}</div>
              </v-list-item>
            </v-list>
          </v-window-item>
          <v-window-item>
            {{ $t('manage.letter.event_dialog.top') }}
            <EventList :community-account="communityAccount" @click="onDialogClick2" />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>
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
.status-cell {
  padding: 0px 10px 0px 10px !important;
  width: 50px !important;
}
.content-cell {
  width: 250px !important;
}
</style>
