<script setup lang="ts">
import { useStoreStoredUser } from '@/stores/storedUser'
import {FirestoredUser, type FirestoredUserPersonalInformation} from '@/schemes/storedUser'
import { buildFacebookUrl, buildInstagramUrl, buildTwitterUrl } from '@/utils/buildSnsLinks'
import UserAvatar from '@/components/UserAvatar.vue'
import { mdiTwitter, mdiFacebook, mdiInstagram, mdiCog, mdiWeb } from '@mdi/js'
import { db } from "@/firebase";
import {doc, getDoc, Timestamp, updateDoc} from 'firebase/firestore'
import {generatePassCode} from "@/utils/generatePassCode"
import {httpsCallable} from 'firebase/functions'
import { functions } from '@/firebase'

const route = useRoute()
const router = useRouter()

const notification = inject('notification') as Notification
const { t: $t } = useI18n()

const props = defineProps<{ userData: FirestoredUser; userEmailPending: string | null; isEditable: boolean | undefined }>()

const storedUserStore = useStoreStoredUser()

const isEditable = computed(() => props.isEditable ?? false)

const userName = computed(() => props.userData.user_name ?? 'ゲスト')
const userEmailPending = ref(props.userEmailPending)
const userDescription = computed(() => {
  return (
    props.userData.user_description ||
    (storedUserStore.storedUser?.userId !== props.userData.user_id ? '' : 'ここに自己紹介文が入ります。')
  )
})
const twitterUrl = computed(() =>
  props.userData.user_sns_twitter ? buildTwitterUrl(props.userData.user_sns_twitter) : undefined,
)

const facebookUrl = computed(() =>
  props.userData?.user_sns_facebook ? buildFacebookUrl(props.userData.user_sns_facebook) : undefined,
)

const instagramUrl = computed(() =>
  props.userData?.user_sns_instagram ? buildInstagramUrl(props.userData.user_sns_instagram) : undefined,
)

const websiteUrl = computed(() =>
  props.userData?.user_sns_website ? props.userData.user_sns_website : undefined,
)

const certificationPendingEmail = async () => {
  const personalInformationSnapshot = await getDoc(doc(db, 'users_personal_information', props.userData.user_id as string))
  const personalInformation = personalInformationSnapshot.data() as FirestoredUserPersonalInformation
  const userEmail = personalInformation.user_email_pending

  // パスコード再発行
  const reGeneratePassCode = generatePassCode()
  const createOrUpdateUser = httpsCallable(functions, "create_or_update_user")
  await createOrUpdateUser({ user_email_pending: userEmail, user_pass_code: reGeneratePassCode })

  const sendPassCode = httpsCallable(functions, "send_pass_code")
  await sendPassCode({ user_email: userEmail, user_pass_code: reGeneratePassCode })
  return router.push({
    path: '/pass-code',
    query: {
      email: userEmail,
      redirect: route.path,
    }
  })
}

const cancelPendingEmail = async () => {
  const userRef = doc(db, 'users', props.userData.user_id)
  await updateDoc(userRef, {
    user_pass_code: null,
    verified_at: Timestamp.now(),
  })
  const personalInformationSnapshotRef = doc(db, 'users_personal_information', props.userData?.user_id)
  await updateDoc(personalInformationSnapshotRef, { user_email_pending: null })
  userEmailPending.value = null
  return Object.assign(notification, { message: $t('user.canceled'), color: 'success' })
}

</script>

<template>
  <v-row class="user-bio-panel">
    <!-- user profile -->
    <v-col cols="12">
      <v-card class="pt-8">
        <v-card-title class="d-flex align-center flex-column mb-4">
          <UserAvatar :user="userData" :size="200" />
        </v-card-title>
        <v-card-text>
          <div class="text-h5 text-center">{{ userName }}</div>
        </v-card-text>
        <v-card-text v-if="userEmailPending">
          <div>
            <span v-html="$t('user.pending_email', {pending_email: userEmailPending})"/>
            <br>
            <span style="color: red">{{ $t('user.notice_pending_email') }}</span>
          </div>
          <div class="d-flex flex-row justify-center">
            <v-btn class="ma-2" @click="certificationPendingEmail">{{ $t('user.certification') }}</v-btn>
            <v-btn class="ma-2" @click="cancelPendingEmail">{{ $t('user.cancel') }}</v-btn>
          </div>
        </v-card-text>
        <v-row class="justify-center">
          <v-col cols="auto">
            <a v-if="twitterUrl" :href="twitterUrl" target="_blank">
              <v-btn :icon="mdiTwitter" class="ma-2"></v-btn>
            </a>
            <a v-if="facebookUrl" :href="facebookUrl" target="_blank">
              <v-btn :icon="mdiFacebook" class="ma-2"></v-btn>
            </a>
            <a v-if="instagramUrl" :href="instagramUrl" target="_blank">
              <v-btn :icon="mdiInstagram" class="ma-2"></v-btn>
            </a>
            <a v-if="websiteUrl" :href="websiteUrl" target="_blank">
              <v-btn :icon="mdiWeb" class="ma-2"></v-btn>
            </a>
          </v-col>
        </v-row>
        <v-card-text v-linkify class="text-subtitle-1" style="line-height: 30px; white-space: pre-line">
          {{ userDescription }}
        </v-card-text>
        <v-card-actions v-if="isEditable" class="justify-center">
          <v-btn
            color="primary"
            class="mb-3"
            size="x-large"
            :prepend-icon="mdiCog"
            to="/u/profile"
          >
            設定
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
