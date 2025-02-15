<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import BokudeliEvent, { eventPaymentItems } from '@/schemes/bokudeliEvent'
import { useValidators } from '@/composable/validators'
import { mdiListBoxOutline, mdiLightbulbOnOutline, mdiAccountCreditCardOutline } from '@mdi/js'
import Editor from '@tinymce/tinymce-vue'
import ImageInput from '../ImageInput.vue'
import eventDetailStyle from '@/utils/eventDetailStyle'

const tinymceApiKey = import.meta.env.VITE_TINYMCE_API_KEY

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

const { requiredValidator, positiveIntegerValidator } = useValidators()
const maxPeopleValidator = (v: number) => {
  if (v < event.value.event_num_members) {
    return $t('event_detail.error_max_people', [event.value.event_num_members])
  }
  return true
}

if (event.value.event_max_people == 0) {
  event.value.event_max_people = 25
}

const tinymceInit = {
  language: 'ja',
  plugins: 'table lists link autolink',
  menubar: 'edit insert format',
  menu: {
    edit: { title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall | searchreplace' },
    insert: { title: 'Insert', items: 'image link inserttable hr' },
    format: {
      title: 'Format',
      items: 'bold italic underline strikethrough styles forecolor  | language | removeformat',
    },
  },
  removed_menuitems: 'codeformat fontfamily styles',
  toolbar: 'undo redo heading bold italic underline strikethrough forecolor | bullist numlist | table link',
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

    <!-- Activity -->
    <v-card-title class="pt-10 px-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiLightbulbOnOutline" />
      {{ $t('event_detail.activity') }}
    </v-card-title>
    <v-card-text>
      <v-switch v-model="event.is_public" hide-details class="mt-0" :readonly="props.readonly">
        <template v-slot:label>
          <span v-if="event.is_public">{{ $t('event_detail.public') }}</span>
          <span v-else>{{ $t('event_detail.private') }}</span>
        </template>
      </v-switch>
      <div class="mt-2 text-subtitle-2">
        <span v-if="event.is_public">{{ $t('event_detail.public_desc') }}</span>
        <span v-else>{{ $t('event_detail.private_desc') }}</span>
      </div>
    </v-card-text>
    <v-card-title class="pt-10 px-5">
      <v-icon size="50" class="text--primary me-3" :icon="mdiAccountCreditCardOutline" />
      {{ $t('event_detail.payment') }}
    </v-card-title>
    <v-card-text>
      <v-col cols="12" sm="12" md="6">
        <v-select
          v-model="event.event_payment"
          variant="solo-filled"
          readonly
          :items="eventPaymentItems"
          hide-details
          class="mt-0"
          :rules="[requiredValidator]"
        >
          <template #label> {{ $t('event_detail.payment') }} </template>
        </v-select>
      </v-col>
      <div class="mt-2 text-subtitle-2">
        <span v-html="$t('event_detail.payment_hint')" />
      </div>
    </v-card-text>
    <slot />
  </v-card>
</template>
