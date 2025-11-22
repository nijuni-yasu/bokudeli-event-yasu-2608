<script setup lang="ts">
import { computed, watch } from 'vue'
import { emailValidator } from '@core/utils/validators'
import { useI18n } from 'vue-i18n'
import { EVENT_PAYMENT_VALUES } from '@shokujii/common/schemas/Event.js'
import { BokudeliEvent } from '@shokujii/base/stores/event.js'
import { useValidators } from '@shokujii/base/composable/validators'
import { mdiListBoxOutline, mdiLightbulbOnOutline, mdiAccountCreditCardOutline } from '@mdi/js'
import Editor from '@tinymce/tinymce-vue'
import ImageInput from '../ImageInput.vue'
import eventDetailStyle from '@shokujii/base/utils/eventDetailStyle'
import { useCommunityStore } from '@shokujii/base/stores/community'
import type { CommunityStore } from '@shokujii/base/stores/community'
import { trimHashTag } from '@shokujii/base/utils/hashTag'
import { uploadEventImage } from '@shokujii/base/composable/uploadImage'

const tinymceApiKey = import.meta.env.VITE_TINYMCE_API_KEY
const maxImageSize = 600

const props = withDefaults(
  defineProps<{
    readonly?: boolean
    subdomainTags?: string[]
  }>(),
  {
    readonly: false,
  },
)

const { t: $t } = useI18n()

const event = defineModel<BokudeliEvent>({ required: true })
const coverImage = defineModel<File | null>('coverImage', { required: true })
const communityStore = useCommunityStore(event.value.community_account) as CommunityStore

const checkBillInfo = () => {
  if (event.value.event_payment === 'community_bill') {
    // 値がない場合のみ、コミュニティの請求情報を設定
    if (!event.value.bill_fullname && communityStore.community?.community_bill_fullname) {
      event.value.bill_fullname = communityStore.community.community_bill_fullname
    }
    if (!event.value.bill_email && communityStore.community?.community_bill_email) {
      event.value.bill_email = communityStore.community.community_bill_email
    }
  }
  if (event.value.event_payment === 'user_advance') {
    event.value.bill_fullname = ''
    event.value.bill_email = ''
  }
}

watch(
  () => event.value.event_payment,
  () => {
    checkBillInfo()
  },
  { immediate: true },
)

const eventPaymentSelectableItems = EVENT_PAYMENT_VALUES.flatMap((type) => {
  if (type === 'user_on_day') {
    return []
  }
  return { title: $t(`payment.${type}`), value: type }
})

const textFieldVariant = computed(() => {
  return event.value.event_status.value === 'in_draft' ? 'outlined' : 'solo-filled'
})

const { requiredValidator, positiveIntegerValidator } = useValidators()
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

const resizeImage = (blob: Blob, filename: string, maxSize: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      let { width, height } = img

      if (Math.max(width, height) > maxSize) {
        if (width > maxSize) {
          height *= maxSize / width
          width = maxSize
        } else {
          width *= maxSize / height
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], filename))
        } else {
          reject(new Error('リサイズに失敗しました'))
        }
      })
    }

    reader.readAsDataURL(blob)
  })
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

// MEMO: 以下で定義されている
// https://github.com/tinymce/tinymce/blob/56bc9917426d58e526bda4e9c991f6b5bc82443f/modules/tinymce/src/core/main/ts/file/Uploader.ts#L33
type ProgressFn = (percent: number) => void

const bodyImageUploadHandler = async (blobInfo: BlobInfo, progress: ProgressFn) => {
  const file = await resizeImage(blobInfo.blob(), blobInfo.filename(), maxImageSize)
  // MEMO: コミュニティID、イベントIDがすでに保存されているのを前提とした実装
  const url = await uploadEventImage(event.value.community_id, event.value.event_id, file)
  return url
}

const tinymceInit = {
  language: 'ja',
  plugins: 'lists link autolink image autoresize',
  menubar: false,
  min_height: 400,
  max_height: 800,
  textcolor_map: ['#2E263DB3', '黒', '#FF4C51', '赤'],
  textcolor_cols: 2,
  custom_colors: false,
  color_map_foreground: ['#2E263DB3', '黒', '#FF4C51', '赤'],
  color_default_foreground: '#2E263DB3',
  removed_menuitems: 'codeformat fontfamily styles',
  toolbar: 'undo redo heading bold italic underline strikethrough forecolor | bullist numlist | link image',
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
  },
  images_upload_handler: bodyImageUploadHandler,
  image_description: false,
}
</script>

<template>
  <v-card flat class="mt-2">
    <v-card-title class="pt-10 px-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiListBoxOutline" />
      {{ $t('event_detail.title') }}
    </v-card-title>

    <v-card-text class="pt-5">
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

    <v-card-text v-if="props.subdomainTags != null && props.subdomainTags.length !== 0" class="pt-5">
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

    <v-card-text class="pt-5">
      <v-row>
        <v-col cols="12">
          <ImageInput
            style="width: 100%; aspect-ratio: 120/63"
            :url="event.event_cover_url"
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

    <v-card-text class="pt-5">
      <v-row>
        <v-col cols="12">
          <Editor v-model="event.event_desc" :api-key="tinymceApiKey" :init="tinymceInit" />
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-text class="mt-3">
      <v-row>
        <v-col cols="12">
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
    <v-card-text class="mt-3">
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

    <!-- Activity -->
    <v-card-title class="pt-10 px-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiLightbulbOnOutline" />
      {{ $t('event_detail.activity') }}
    </v-card-title>
    <v-card-text>
      <v-radio-group v-model="event.is_public" hide-details class="ma-3" :readonly="props.readonly">
        <v-radio :value="true" :label="$t('event_detail.public')" />
        <v-radio :value="false" :label="$t('event_detail.private')" />
      </v-radio-group>
      <div class="mt-2 text-subtitle-2">
        <span v-if="event.is_public"><div v-html="$t('event_detail.public_desc')" /></span>
        <span v-else><div v-html="$t('event_detail.private_desc')" /></span>
      </div>
    </v-card-text>

    <!-- 支払い設定 -->
    <v-card-title class="pt-10 px-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiAccountCreditCardOutline" />
      {{ $t('event_detail.payment') }}
    </v-card-title>
    <v-card-text>
      <v-radio-group
        v-model="event.event_payment"
        hide-details
        class="ma-3"
        :readonly="event.event_status.value !== 'in_draft'"
      >
        <v-radio
          v-for="item in eventPaymentSelectableItems"
          :key="item.value"
          :value="item.value"
          :label="item.title"
        />
      </v-radio-group>
      <template v-if="event.event_payment === 'community_bill'">
        <v-row class="justify-center px-3">
          <v-col cols="12">
            <v-text-field
              v-model="event.bill_fullname"
              :variant="textFieldVariant"
              dense
              :label="$t('shop_notice.bill_fullname')"
              :rules="[requiredValidator]"
              :readonly="event.event_status.value !== 'in_draft'"
            />
          </v-col>
        </v-row>
        <v-row class="justify-center px-3">
          <v-col cols="12">
            <v-text-field
              v-model="event.bill_email"
              :variant="textFieldVariant"
              dense
              :label="$t('shop_notice.bill_email')"
              :rules="[requiredValidator, emailValidator]"
              :readonly="event.event_status.value !== 'in_draft'"
            />
          </v-col>
        </v-row>
        <v-card-text class="text-subtitle-2">
          <span v-html="$t('event_detail.payment_hint_community_bill')" />
        </v-card-text>
      </template>
      <template v-if="event.event_payment === 'user_advance'">
        <v-card-text class="text-subtitle-2">
          <span v-html="$t('event_detail.payment_hint_user_advance')" />
        </v-card-text>
      </template>
    </v-card-text>
    <slot />
  </v-card>
</template>
