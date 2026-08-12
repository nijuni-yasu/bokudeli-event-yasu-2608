<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
// user_on_day 復活時など、スキーマ駆動の支払い選択肢が必要になったら有効化する
// import { EVENT_PAYMENT_VALUES } from '@shokujii/common/schemas/Event.js'
import type { CommunityBillSettingsType } from '@shokujii/common/schemas/Event.js'
import { BokudeliEvent } from '@shokujii/base/stores/event.js'
import { useValidators } from '@shokujii/base/composable/validators'
import {
  mdiAccountCreditCardOutline,
  mdiAccountMultipleOutline,
  mdiCalendarBlankOutline,
  mdiImagePlusOutline,
  mdiWeb,
  mdiReceiptTextOutline,
  mdiEmailOutline,
  mdiTextBoxEditOutline,
} from '@mdi/js'
import Editor from '@tinymce/tinymce-vue'
import ImageInput from '../ImageInput.vue'
import eventDetailStyle from '@shokujii/base/utils/eventDetailStyle'
import { useCommunityStore } from '@shokujii/base/stores/community'
import { useEventStore } from '@shokujii/base/stores/event.js'
import { trimHashTag } from '@shokujii/base/utils/hashTag'
import { convertStoragePathToURL } from '@shokujii/base/utils/storage.js'
import { getCommunityAlbumItemStoragePath } from '@shokujii/common/utils/storagePaths.js'
import ConfirmDialog from '@shokujii/base/components/ConfirmDialog.vue'
import {
  PF_EVENT_PAYMENT_UI_STRATEGY,
  type EventPaymentUiStrategy,
} from '@shokujii/base/composable/eventPaymentUiStrategy.js'

const tinymceApiKey = import.meta.env.VITE_TINYMCE_API_KEY

const props = withDefaults(
  defineProps<{
    readonly?: boolean
    subdomainTags?: string[]
    /** user アプリのイベント編集では true。partner など別オリジンでは false */
    showAlbumPreview?: boolean
    /** アルバム管理画面の URL（showAlbumPreview 時は親が router utils 等で組み立てて渡す） */
    albumManageUrl?: string
    /**
     * 新規作成中（まだ Firestore にイベントが保存されていない）かどうか。
     * true の場合は useEventStore を呼ばず、保存済みドキュメントを前提とした処理（カバー画像 URL 参照や本文画像アップロード）を無効化する。
     */
    isNew?: boolean
    /** 支払い方式 UI（enterprise / PF）。呼び出し側から注入 */
    paymentUiStrategy?: EventPaymentUiStrategy
  }>(),
  {
    readonly: false,
    showAlbumPreview: true,
    isNew: false,
    paymentUiStrategy: () => PF_EVENT_PAYMENT_UI_STRATEGY,
  },
)

const { t: $t } = useI18n()

/** おごり金額（UI）の最小値・単位（円） */
const OFF_AMOUNT_MIN = 100
const OFF_AMOUNT_STEP = 100

const event = defineModel<BokudeliEvent>({ required: true })
const coverImage = defineModel<File | null>('coverImage', { required: true })
const communityStore = useCommunityStore(event.value.community_account)
const paymentUiStrategy = computed(() => props.paymentUiStrategy)
// 新規作成中はまだイベントドキュメントが Firestore に存在しないため、
// useEventStore を呼ぶとコレクショングループ検索でリトライ警告が連発してしまう。保存済みのときだけストアを参照する。
const eventStore = props.isNew ? null : useEventStore(event.value)

const checkBillInfo = () => {
  if (event.value.event_payment === 'community_bill') {
    if (event.value.community_bill_settings == null) {
      event.value.community_bill_settings = { type: 'free' }
    }
    if (
      (event.value.bill_fullname == null || event.value.bill_fullname === '') &&
      communityStore.community?.community_bill_fullname
    ) {
      event.value.bill_fullname = communityStore.community.community_bill_fullname
    }
    if (
      (event.value.bill_email == null || event.value.bill_email === '') &&
      communityStore.community?.community_bill_email
    ) {
      event.value.bill_email = communityStore.community.community_bill_email
    }
  } else if (event.value.event_payment === 'user_advance') {
    event.value.bill_fullname = ''
    event.value.bill_email = ''
    event.value.community_bill_settings = undefined
  }
}

const getOffAmount = () => {
  const settings = event.value.community_bill_settings
  if (settings != null && settings.type === 'discount') return settings.off_amount
  return undefined
}

const discountType = computed<CommunityBillSettingsType['type']>({
  get: () => event.value.community_bill_settings?.type ?? 'free',
  set: (newType: CommunityBillSettingsType['type']) => {
    switch (newType) {
      case 'free':
        event.value.community_bill_settings = { type: 'free' }
        break
      case 'discount':
        event.value.community_bill_settings = {
          type: 'discount',
          off_amount: getOffAmount() ?? OFF_AMOUNT_MIN * 3,
        }
        break
    }
  },
})

const offAmount = computed({
  get: () => getOffAmount(),
  set: (v: number | undefined) => {
    const settings = event.value.community_bill_settings
    if (settings != null && settings.type === 'discount') {
      settings.off_amount = v ?? 0
    }
  },
})

const offAmountValidator = (v: number | string | undefined) => {
  if (v == null || v === '') return $t('discount_settings.off_amount_required')
  const num = Number(v)
  if (!Number.isInteger(num) || num <= 0) return $t('discount_settings.off_amount_positive_integer')
  if (num % OFF_AMOUNT_STEP !== 0) return $t('discount_settings.off_amount_step_100')
  return true
}

watch(
  () => event.value.event_payment,
  () => {
    if (paymentUiStrategy.value.isEnterpriseMode) {
      if (paymentUiStrategy.value.forbiddenPayments.includes(event.value.event_payment)) {
        event.value.event_payment = paymentUiStrategy.value.defaultPaymentWhenDraft ?? 'enterprise_subsidy'
      }
      if (event.value.event_payment !== 'community_bill') {
        event.value.community_bill_settings = undefined
      }
      return
    }
    checkBillInfo()
  },
  { immediate: true },
)

watch(
  () => paymentUiStrategy.value.isEnterpriseMode,
  (isEnterprise) => {
    if (!isEnterprise || props.readonly || event.value.event_status.value !== 'in_draft') {
      return
    }
    if (paymentUiStrategy.value.forbiddenPayments.includes(event.value.event_payment)) {
      event.value.event_payment = paymentUiStrategy.value.defaultPaymentWhenDraft ?? 'enterprise_subsidy'
      event.value.community_bill_settings = undefined
    }
  },
  { immediate: true },
)

// user_on_day は当面 UI から外すが復活の可能性はゼロではないため、除外込みの選択肢配列を残す（現状未使用のためコメントアウト）
// const eventPaymentSelectableItems = EVENT_PAYMENT_VALUES.flatMap((type) => {
//   if (type === 'user_on_day') {
//     return []
//   }
//   return { title: $t(`payment.${type}`), value: type }
// })

const textFieldVariant = computed(() => {
  return event.value.event_status.value === 'in_draft' ? 'outlined' : 'solo-filled'
})

const { requiredValidator, positiveIntegerValidator, requiredHtmlValidator, emailValidator } = useValidators()

const maxPeopleValidator = (v: number) => {
  if (v < event.value.members.length) {
    return $t('event_detail.error_max_people', [event.value.members.length])
  }
  return true
}

if (event.value.event_max_people == 0) {
  event.value.event_max_people = 25
}

// コミュニティのハッシュタグを設定。空の場合はコミュニティのハッシュタグを設定
if (
  (event.value.event_sns_hash_tag == null || event.value.event_sns_hash_tag === '') &&
  communityStore.community?.community_sns_hash_tag != null
) {
  event.value.event_sns_hash_tag = communityStore.community.community_sns_hash_tag
}
// ハッシュタグの値を監視してトリムする
const event_sns_hash_tag = computed({
  get: () => event.value.event_sns_hash_tag,
  set: (value) => {
    event.value.event_sns_hash_tag = trimHashTag(value)
  },
})

const albumModalOpen = ref(false)

const albumPreviewSlots = computed(() => {
  const cid = communityStore.community?.community_id
  const items = communityStore.albumItems
  if (cid == null || items === null) {
    return Array.from({ length: 4 }, () => ({ url: null as string | null }))
  }
  return Array.from({ length: 4 }, (_, i) => {
    const item = items[i]
    if (item == null) {
      return { url: null as string | null }
    }
    return {
      url: convertStoragePathToURL(getCommunityAlbumItemStoragePath(cid, item.id)),
    }
  })
})

const openAlbumModal = () => {
  albumModalOpen.value = true
}

const handleAlbumModalOk = () => {
  const url = props.albumManageUrl
  if (url != null && url !== '') {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

// MEMO: 以下で定義されている
// https://github.com/tinymce/tinymce/blob/56bc9917426d58e526bda4e9c991f6b5bc82443f/modules/tinymce/src/core/main/ts/api/file/BlobCache.ts#L29
type BlobInfo = {
  id: () => string
  name: () => string
  filename: () => string
  blob: () => Blob
  base64: () => string
  blobUri: () => string
  uri: () => string | undefined
}

const bodyImageUploadHandler = async (blobInfo: BlobInfo) => {
  try {
    if (eventStore == null) {
      return Promise.reject('イベントIDが設定されていません。イベントを保存してから画像をアップロードしてください。')
    }
    if (!event.value.community_id) {
      const error = new Error('community_id is undefined. Cannot upload image during new event creation.')
      console.error('Image upload failed:', error)
      return Promise.reject('イベントのコミュニティIDが設定されていません。')
    }
    const url = await eventStore.uploadTinymceImage(new File([blobInfo.blob()], blobInfo.filename()))
    return url
  } catch (error) {
    console.error('Image upload failed:', error)
    if (error instanceof Error) {
      return Promise.reject(`画像のアップロードに失敗しました: ${error.message}`)
    }
    return Promise.reject('画像のアップロードに失敗しました。')
  }
}

const tinymceInit = computed(() => ({
  language: 'ja',
  plugins: 'lists link autolink image autoresize paste',
  contextmenu: 'copy cut paste pastetext | link image',
  menubar: false,
  min_height: 400,
  max_height: 800,
  textcolor_map: ['#2E263DB3', '黒', '#FF4C51', '赤'],
  textcolor_cols: 2,
  custom_colors: false,
  color_map_foreground: ['#2E263DB3', '黒', '#FF4C51', '赤'],
  color_default_foreground: '#2E263DB3',
  removed_menuitems: 'codeformat fontfamily styles',
  toolbar: 'undo redo | insertimage image link | heading bold italic underline strikethrough forecolor bullist numlist',
  style_formats: [
    { title: 'Text', format: 'p' },
    { title: 'Headings', format: 'h3' },
    { title: 'Bold', format: 'bold' },
    { title: 'Italic', format: 'italic' },
    { title: 'Underline', format: 'underline' },
    { title: 'Strikethrough', format: 'strikethrough' },
  ],
  link_title: false,
  link_default_target: '_blank',
  link_target_list: false,
  disabled: props.readonly,
  content_style: eventDetailStyle,
  elementpath: false,
  branding: false,
  setup: (editor: any) => {
    editor.ui.registry.addButton('heading', {
      text: '見出し',
      onAction: () => {
        editor.execCommand('FormatBlock', false, 'h3')
      },
    })
    editor.ui.registry.addButton('insertimage', {
      text: '画像',
      onAction: () => {
        editor.execCommand('mceImage')
      },
    })
  },
  images_upload_handler: bodyImageUploadHandler,
  image_description: false,
}))
</script>

<template>
  <v-card flat class="mt-2">
    <v-card-title class="pt-6 pt-md-10 px-2 px-md-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiCalendarBlankOutline" />
      {{ $t('event_detail.event_name') }}
    </v-card-title>

    <v-card-text class="pt-2 pt-md-5">
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="event.event_name"
            outlined
            dense
            :label="$t('event_detail.event_name')"
            :rules="[requiredValidator]"
            :readonly="props.readonly"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-text v-if="props.subdomainTags != null && props.subdomainTags.length !== 0" class="pt-2 pt-md-5">
      <v-row>
        <v-col cols="12">
          <v-text-field outlined dense label="Tags" :readonly="true" :active="true">
            <v-chip-group v-model="event.subdomain_tags" selected-class="text-primary" multiple>
              <v-chip v-for="tag in subdomainTags" :key="tag" :text="$t(`subdomain_tags.${tag}`)" :value="tag" />
            </v-chip-group>
          </v-text-field>
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-title class="pt-6 pt-md-10 px-2 px-md-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiImagePlusOutline" />
      {{ $t('event_detail.event_image') }}
    </v-card-title>

    <v-card-text class="pt-2 pt-md-5">
      <v-row>
        <v-col cols="12">
          <ImageInput
            style="width: 100%; aspect-ratio: 120/63"
            :urls="[eventStore?.coverImageUrl, communityStore.coverImageUrl].filter((u): u is string => u != null)"
            :rules="[requiredValidator]"
            :readonly="props.readonly"
            :cover="true"
            @fileSelected="(f) => (coverImage = f)"
          >
            <template #placeholder>{{ $t('event_detail.event_cover_url') }}</template>
          </ImageInput>
          <div class="mt-2 text-subtitle-2">
            <span>{{ $t('event_detail.event_cover_url_hint') }}</span>
          </div>
          <div class="my-1 text-subtitle-2">
            <div v-html="$t('event_detail.event_cover_template')"></div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-text v-if="props.showAlbumPreview" class="pt-2 pt-md-5">
      <div class="text-subtitle-1 font-weight-medium mb-2">{{ $t('event_detail.album_preview_title') }}</div>
      <div class="album-preview-thumbs">
        <div v-for="(previewSlot, index) in albumPreviewSlots" :key="index" class="album-preview-slot">
          <div
            class="album-preview-tile rounded-lg overflow-hidden cursor-pointer"
            role="button"
            tabindex="0"
            :aria-label="$t('event_detail.album_preview_tile_aria')"
            @click="openAlbumModal"
            @keydown.enter.prevent="openAlbumModal"
            @keydown.space.prevent="openAlbumModal"
          >
            <v-img
              v-if="previewSlot.url != null"
              :src="previewSlot.url"
              class="album-preview-img-fill"
              cover
              :alt="$t('event_detail.album_preview_image_alt', [index + 1])"
            />
            <div v-else class="album-preview-placeholder" />
          </div>
        </div>
      </div>
      <div
        class="mt-2 text-subtitle-2"
        v-html="$t('event_detail.album_preview_hint', { albumUrl: albumManageUrl ?? '' })"
      />
    </v-card-text>

    <v-card-title class="pt-6 pt-md-10 px-2 px-md-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiTextBoxEditOutline" />
      {{ $t('event_detail.event_detail') }}
    </v-card-title>

    <v-card-text class="pt-2 pt-md-5">
      <v-row>
        <v-col cols="12">
          <v-validation :rules="props.readonly ? [] : [requiredHtmlValidator]" :validation-value="event.event_desc">
            <template #default="{ errorMessages }">
              <div class="event-desc-editor" :class="{ 'event-desc-editor--error': errorMessages.value.length !== 0 }">
                <Editor v-model="event.event_desc" :api-key="tinymceApiKey" :init="tinymceInit" />
              </div>
              <div class="mt-2 text-subtitle-2">
                <span>{{ $t('event_detail.event_desc_hint') }}</span>
              </div>
              <div class="mt-1 text-subtitle-2">
                <span>{{ $t('event_detail.event_desc_image_hint') }}</span>
              </div>
              <div v-if="errorMessages.value.length !== 0" class="v-input__details">
                <div class="v-messages" role="alert" aria-live="polite">
                  <div
                    v-for="(errorMessage, i) in errorMessages.value"
                    :key="`event_desc_error_${i}`"
                    class="v-messages__message text-error"
                  >
                    {{ errorMessage }}
                  </div>
                </div>
              </div>
            </template>
          </v-validation>
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-text class="mt-1 mt-md-3">
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="event_sns_hash_tag"
            outlined
            dense
            prefix="#"
            :label="$t('event_detail.event_sns_hash_tag')"
            :hint="$t('event_detail.event_sns_hash_tag_hint')"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-title class="pt-6 pt-md-10 px-2 px-md-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiAccountMultipleOutline" />
      {{ $t('event_detail.event_max_people') }}
    </v-card-title>

    <v-card-text class="mt-1 mt-md-3">
      <v-row>
        <v-col cols="4">
          <v-text-field
            v-model.number="event.event_max_people"
            type="number"
            outlined
            dense
            :label="$t('event_detail.event_max_people')"
            :rules="[requiredValidator, positiveIntegerValidator, maxPeopleValidator]"
            :readonly="props.readonly"
            :hint="$t('event_detail.event_max_people_hint')"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <!-- Activity -->
    <v-card-title class="pt-6 pt-md-10 px-2 px-md-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiWeb" />
      {{ $t('event_detail.activity') }}
    </v-card-title>
    <v-card-text>
      <v-radio-group v-model="event.is_public" hide-details class="ma-1 ma-md-3" :readonly="props.readonly">
        <v-radio :value="true" :label="$t('event_detail.public')" />
        <v-radio :value="false" :label="$t('event_detail.private')" />
      </v-radio-group>
      <div class="mt-2 text-subtitle-2">
        <span v-if="event.is_public"><div v-html="$t('event_detail.public_desc')" /></span>
        <span v-else><div v-html="$t('event_detail.private_desc')" /></span>
      </div>
    </v-card-text>

    <!-- 支払い設定 -->
    <v-card-title class="pt-6 pt-md-10 px-2 px-md-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiAccountCreditCardOutline" />
      {{ $t('event_detail.payment') }}
    </v-card-title>
    <v-card-text>
      <v-radio-group
        v-model="event.event_payment"
        hide-details
        class="ma-1 ma-md-3"
        :readonly="event.event_status.value !== 'in_draft'"
      >
        <template v-if="paymentUiStrategy.isEnterpriseMode">
          <v-card
            variant="outlined"
            :color="event.event_payment === 'enterprise_subsidy' ? 'primary' : undefined"
            class="mb-4 pa-3"
          >
            <v-radio value="enterprise_subsidy">
              <template #label>
                <span class="text-body-1 font-weight-bold">{{ $t('payment.enterprise_subsidy') }}</span>
              </template>
            </v-radio>
            <div class="payment-hint text-body-2 text-medium-emphasis ml-8 mt-2">
              <span v-html="$t('event_detail.payment_hint_enterprise_subsidy')" />
            </div>
          </v-card>
          <v-card
            variant="outlined"
            :color="event.event_payment === 'user_advance' ? 'primary' : undefined"
            class="mb-4 pa-3"
          >
            <v-radio value="user_advance">
              <template #label>
                <span class="text-body-1 font-weight-bold">{{ $t('payment.user_advance') }}</span>
              </template>
            </v-radio>
            <div class="payment-hint text-body-2 text-medium-emphasis ml-8 mt-2">
              <span v-html="$t('event_detail.payment_hint_user_advance')" />
            </div>
          </v-card>
        </template>
        <template v-else>
          <!-- 参加者事前決済 -->
          <v-card
            variant="outlined"
            :color="event.event_payment === 'user_advance' ? 'primary' : undefined"
            class="mb-4 pa-3"
          >
            <v-radio value="user_advance">
              <template #label>
                <span class="text-body-1 font-weight-bold">{{ $t('payment.user_advance') }}</span>
              </template>
            </v-radio>
            <div class="payment-hint text-body-2 text-medium-emphasis ml-8 mt-2">
              <span v-html="$t('event_detail.payment_hint_user_advance')" />
            </div>
          </v-card>

          <!-- 主催者請求書払い -->
          <v-card
            variant="outlined"
            :color="event.event_payment === 'community_bill' ? 'primary' : undefined"
            class="mb-4 pa-3"
          >
            <v-radio value="community_bill">
              <template #label>
                <span class="text-body-1 font-weight-bold">{{ $t('payment.community_bill') }}</span>
              </template>
            </v-radio>

            <div class="mt-1">
              <!-- 割引設定（枠線なし） -->
              <div class="mt-3 mb-4 mx-2">
                <div class="pt-4">
                  <v-radio-group
                    v-model="discountType"
                    hide-details
                    class="ma-2"
                    :readonly="event.event_status.value !== 'in_draft'"
                    :disabled="event.event_payment !== 'community_bill'"
                  >
                    <v-radio value="free" :label="$t('discount_settings.free')" />
                    <div
                      class="text-body-2 ml-8 mb-2"
                      :class="discountType === 'free' ? undefined : 'text-medium-emphasis'"
                    >
                      {{ $t('discount_settings.free_description') }}
                    </div>

                    <v-radio value="discount" :label="$t('discount_settings.discount')" class="mt-4" />
                    <div
                      class="text-body-2 ml-8 mb-2"
                      :class="discountType === 'discount' ? undefined : 'text-medium-emphasis'"
                    >
                      {{ $t('discount_settings.discount_description') }}
                    </div>
                    <v-row class="pt-3 ml-5">
                      <v-col cols="8" sm="6">
                        <v-text-field
                          v-model.number="offAmount"
                          type="number"
                          :step="OFF_AMOUNT_STEP"
                          :variant="textFieldVariant"
                          dense
                          :label="$t('discount_settings.off_amount')"
                          :rules="
                            event.event_payment === 'community_bill' && discountType === 'discount'
                              ? [offAmountValidator]
                              : []
                          "
                          :readonly="event.event_status.value !== 'in_draft'"
                          :disabled="discountType !== 'discount' || event.event_payment !== 'community_bill'"
                          prefix="¥"
                        />
                      </v-col>
                    </v-row>
                  </v-radio-group>
                </div>
              </div>

              <!-- 請求先情報（枠線なし・v-radio-group と同マージンで左揃え） -->
              <div class="ma-4 py-4">
                <div class="d-flex align-center text-body-1 font-weight-bold pb-3">
                  <v-icon size="22" class="text--primary me-1" :icon="mdiEmailOutline" />
                  {{ $t('discount_settings.bill_info_title') }}
                </div>
                <v-row class="px-5">
                  <v-col cols="12">
                    <v-text-field
                      v-model="event.bill_fullname"
                      :variant="textFieldVariant"
                      dense
                      :label="$t('shop_notice.bill_fullname')"
                      :rules="event.event_payment === 'community_bill' ? [requiredValidator] : []"
                      :readonly="event.event_status.value !== 'in_draft'"
                      :disabled="event.event_payment !== 'community_bill'"
                    />
                  </v-col>
                </v-row>
                <v-row class="px-5">
                  <v-col cols="12">
                    <v-text-field
                      v-model="event.bill_email"
                      :variant="textFieldVariant"
                      dense
                      :label="$t('shop_notice.bill_email')"
                      :rules="event.event_payment === 'community_bill' ? [requiredValidator, emailValidator] : []"
                      :readonly="event.event_status.value !== 'in_draft'"
                      :disabled="event.event_payment !== 'community_bill'"
                    />
                  </v-col>
                </v-row>
              </div>
              <div class="px-4 py-2">
                <div class="d-flex align-center text-body-1 font-weight-bold pb-3">
                  <v-icon size="22" class="text--primary me-1" :icon="mdiReceiptTextOutline" />
                  {{ $t('event_detail.payment_hint_community_bill_title') }}
                </div>
                <div class="payment-hint text-body-2">
                  <span v-html="$t('event_detail.payment_hint_community_bill')" />
                </div>
              </div>
            </div>
          </v-card>
        </template>
      </v-radio-group>
    </v-card-text>
    <confirm-dialog
      v-if="props.showAlbumPreview"
      v-model="albumModalOpen"
      :title="$t('event_detail.album_preview_modal_title')"
      is-confirm
      :cancel-text="$t('event_detail.album_preview_modal_close')"
      ok-text="OK"
      :ok-click="handleAlbumModalOk"
    >
      {{ $t('event_detail.album_preview_modal_message') }}
    </confirm-dialog>
    <slot />
  </v-card>
</template>

<style scoped lang="scss">
/* PublicAlbumGallery のサムネ行と同様（グレー未設定スロットの表示安定化） */
.album-preview-thumbs {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 8px;
  width: 100%;
}
.album-preview-slot {
  flex: 0 0 calc((100% - 24px) / 4);
  max-width: calc((100% - 24px) / 4);
  min-width: 0;
  overflow: hidden;
}
/* 高さはタイルの aspect-ratio のみで決める（v-img とプレースホルダーで二重計算しない） */
.album-preview-tile {
  position: relative;
  width: 100%;
  aspect-ratio: 1200 / 630;
}
.album-preview-placeholder {
  position: absolute;
  inset: 0;
  background: rgb(var(--v-theme-grey-200));
}
:deep(.album-preview-img-fill) {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
}
:deep(.album-preview-img-fill .v-img__img) {
  background-color: rgb(var(--v-theme-grey-200));
}
.album-preview-tile:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

/* 支払い設定: 補足文の行間 */
.payment-hint {
  line-height: 1.55;
}

.event-desc-editor--error :deep(.tox-tinymce) {
  border-color: rgb(var(--v-theme-error)) !important;
  border-width: 1px !important;
}
</style>
