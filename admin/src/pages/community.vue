<script setup lang="ts">
import { getAuth } from 'firebase/auth'
import { usePartnerStore } from '@/stores/partner'
import { useCommunityStore, useCommunitiesStore, type CommunityStore, type CommunitiesStore } from '@/stores/community'
import { Shop } from '@/schemes/shop'
import CommunityEdit from '@/components/CommunityEdit.vue'
import type BokudeliCommunity from '@/schemes/bokudeliCommunity'
import { mdiPlus } from '@mdi/js'
import { getShopPath } from '@/navigation/utils'
import type { Notification } from '@/types'

const notification = inject('notification') as Notification

const router = useRouter()
const { t: $t } = useI18n()

const partnerId = getAuth().currentUser?.uid ?? ''
const partnerStore = usePartnerStore(partnerId)
const isLoading = ref(false)

const shop = await new Promise<Shop | null>((resolve) => {
  watch(
    () => partnerStore.shops,
    (shops) => {
      if (shops != null) {
        if (shops.length === 0) {
          resolve(null)
        } else {
          resolve(shops[0])
        }
        stop()
      }
    },
    { immediate: true },
  )
})

if (shop == null) {
  window.alert($t('alert.make_shop'))
  router.push(getShopPath())
  throw new Error()
}

const communityAccount = ref<string>(
  shop.community_account ??
    getAuth()
      .currentUser?.email?.replace(/(shokujii\+)|(bokudeli\+)|(@.+)/g, '')
      ?.toLowerCase()
      ?.replace(/[^a-z0-9_]/g, '') ??
    '',
)

const communitiesStore = useCommunitiesStore() as CommunitiesStore
const communityExists = ref<boolean>((await communitiesStore.getCommunityData(communityAccount.value)) != null)
const getCommunity = async () =>
  await new Promise<BokudeliCommunity>((resolve) => {
    if (!communityExists.value) {
      communitiesStore.communityDraft.community_account = communityAccount.value
      communitiesStore.communityDraft.community_name = shop.shop_name
      communitiesStore.communityDraft.community_desc = shop.shop_description
      communitiesStore.communityDraft.community_sns_facebook = shop.shop_url_facebook
      communitiesStore.communityDraft.community_sns_twitter = shop.shop_url_twitter
      communitiesStore.communityDraft.community_sns_instagram = shop.shop_url_instagram
      communitiesStore.communityDraft.community_sns_officialsite = shop.shop_url
      communitiesStore.communityDraft.community_postalcode = shop.shop_postcode
      communitiesStore.communityDraft.community_address = shop.shop_address
      communitiesStore.communityDraft.community_phone = shop.shop_phone
      communitiesStore.communityDraft.community_email = ''
      communitiesStore.communityDraft.is_approved = true
      resolve(communitiesStore.communityDraft)
    } else {
      watch(
        () => (useCommunityStore(communityAccount.value) as CommunityStore).community,
        (value) => {
          if (value != null) {
            Object.assign(communitiesStore.communityDraft, toRaw(value))
            resolve(communitiesStore.communityDraft)
            stop()
          }
        },
        { immediate: true },
      )
    }
  })
const community = ref(await getCommunity())
watch(
  () => shop.community_account,
  async (value) => {
    if (value == null) {
      communityAccount.value = ''
      communityExists.value = false
    } else {
      communityAccount.value = value
      communityExists.value = (await communitiesStore.getCommunityData(value)) != null
    }
    community.value = await getCommunity()
  },
)

watch(
  () => community.value?.community_sns_twitter,
  (url) => {
    if (url?.startsWith('https://x.com/') ?? false) {
      community.value.community_sns_twitter = url.replace('https://x.com/', '')
    }
  },
  { immediate: true },
)

watch(
  () => community.value?.community_sns_facebook,
  (url) => {
    if (url?.startsWith('https://www.facebook.com/') ?? false) {
      community.value.community_sns_facebook = url.replace('https://www.facebook.com/', '')
    }
  },
  { immediate: true },
)

watch(
  () => community.value?.community_sns_instagram,
  (url) => {
    if (url?.startsWith('https://www.instagram.com/') ?? false) {
      community.value.community_sns_instagram = url.replace('https://www.instagram.com/', '')
    }
  },
  { immediate: true },
)

const newCommunityDialog = ref(!communityExists.value)
const createConfirmDialog = ref(false)
const coverImageFile = ref<File | null>(null)
const iconImageFile = ref<File | null>(null)
const validateNewAccount = async (value: string) => {
  const community = await communitiesStore.getCommunityData(value)
  return community == null
}

const submit = async () => {
  isLoading.value = true
  try {
    if (communityExists.value) {
      const communityStore = useCommunityStore(communityAccount.value) as CommunityStore
      await communityStore.updateComunity(community.value)
      if (coverImageFile.value != null) {
        await communityStore.updateCoverImage(coverImageFile.value)
      }
      if (iconImageFile.value != null) {
        await communityStore.updateIconImage(iconImageFile.value)
      }
      Object.assign(notification, { message: $t('community.saved'), color: 'success' })
    } else {
      const community = await communitiesStore.createNewCommunityFromDraft()
      const communityStore = useCommunityStore(community.community_account) as CommunityStore
      if (coverImageFile.value != null) {
        await communityStore.updateCoverImage(coverImageFile.value)
      }
      if (iconImageFile.value != null) {
        await communityStore.updateIconImage(iconImageFile.value)
      }
      shop.community_account = community.community_account
      await partnerStore.updateShop(shop)
      Object.assign(notification, { message: $t('community.added'), color: 'success' })
      communitiesStore.$reset()
    }
  } catch (err) {
    console.error(err)
    Object.assign(notification, { message: $t('community.error'), color: 'error' })
  } finally {
    isLoading.value = false
  }
}

onUnmounted(() => {
  if (communityExists.value) {
    const communityStore = useCommunityStore(communityAccount.value) as CommunityStore
    communityStore.$reset()
  } else {
    communitiesStore.$reset()
  }
})
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="12" sm="12" md="9" class="px-0">
      <CommunityEdit
        v-model="community"
        v-model:coverImageFile="coverImageFile"
        v-model:iconImageFile="iconImageFile"
        :validateNewAccount="communityExists ? undefined : validateNewAccount"
      >
        <template #default="{ isValid }">
          <v-card-text v-if="communityExists" class="text-center mt-10">
            <v-btn
              :disabled="!isValid"
              :loading="isLoading"
              color="primary"
              class="me-3 mt-3"
              size="large"
              @click="submit"
            >
              {{ $t('community.submit') }}
            </v-btn>
          </v-card-text>

          <v-card-text v-else class="text-center mx-0 px-0">
            <v-btn
              :disabled="!isValid"
              :loading="isLoading"
              color="grey-900"
              class="mt-3"
              size="x-large"
              :prepend-icon="mdiPlus"
              @click="createConfirmDialog = true"
            >
              {{ $t('community.create') }}
            </v-btn>
          </v-card-text>
        </template>
      </CommunityEdit>
    </v-col>
  </v-row>
  <v-dialog v-model="newCommunityDialog" :persistent="true" max-width="800px">
    <v-card>
      <v-card-text class="text-center mt-6 text-h6">{{ $t('community.new_community_dialog.title1') }}</v-card-text>
      <v-card-text class="text-subtitle">
        <div style="padding: inherit" v-html="$t('community.new_community_dialog.message1')" />
      </v-card-text>
      <v-card-text class="text-center mt-6 text-h6">{{ $t('community.new_community_dialog.title2') }}</v-card-text>
      <v-card-text class="text-subtitle" style="line-height: 1.8rem">
        <div style="padding: inherit" v-html="$t('community.new_community_dialog.message2')" />
      </v-card-text>
      <template #actions>
        <v-spacer></v-spacer>
        <v-btn @click="newCommunityDialog = false">{{ $t('ok') }}</v-btn>
      </template>
    </v-card>
  </v-dialog>
  <v-dialog v-model="createConfirmDialog" max-width="800px">
    <v-card :title="$t('community.create_confirm_dialog.title')">
      <template #text>
        <div style="padding: inherit" v-html="$t('community.create_confirm_dialog.message')" />
      </template>

      <template #actions>
        <v-spacer></v-spacer>
        <v-btn @click="createConfirmDialog = false">{{ $t('cancel') }}</v-btn>
        <v-btn @click="submit(), (createConfirmDialog = false)">{{ $t('submit') }}</v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>
