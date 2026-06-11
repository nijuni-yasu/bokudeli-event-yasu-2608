<script setup lang="ts">
import type { BokudeliCommunityMember } from '@shokujii/base/stores/community.js'

const props = defineProps<{
  addTargetMember: BokudeliCommunityMember | null
  removeTargetMember: BokudeliCommunityMember | null
  isLoading: boolean
  currentUserId?: string
}>()

const emit = defineEmits<{
  'confirm-add': [member: BokudeliCommunityMember]
  'confirm-remove': [member: BokudeliCommunityMember]
  cancel: []
}>()

const isOpen = computed({
  get: () => props.addTargetMember != null || props.removeTargetMember != null,
  set: (val) => {
    if (!val) {
      emit('cancel')
    }
  },
})

const { t: $t } = useI18n()
</script>

<template>
  <v-dialog v-model="isOpen" persistent :width="$vuetify.display.smAndDown ? 'auto' : 650">
    <v-card v-if="addTargetMember != null" class="px-2 py-4">
      <v-card-title>
        {{ $t('manage.member.add_manager_dialog.title', [addTargetMember.user_name]) }}
      </v-card-title>
      <v-card-text>
        <div v-html="$t('manage.member.add_manager_dialog.description', [addTargetMember.user_name])" />
      </v-card-text>
      <v-card-actions>
        <v-btn type="cancel" :disabled="isLoading" @click="emit('cancel')">
          {{ $t('cancel') }}
        </v-btn>
        <v-btn type="submit" :loading="isLoading" @click="emit('confirm-add', addTargetMember)">
          {{ $t('manage.member.add_manager_dialog.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-card v-if="removeTargetMember != null" class="px-2 py-4">
      <v-card-title>
        {{ $t('manage.member.remove_manager_dialog.title', [removeTargetMember.user_name]) }}
      </v-card-title>
      <v-card-text>
        <div
          v-html="
            $t(
              removeTargetMember.user_id === currentUserId
                ? 'manage.member.remove_manager_dialog.self_description'
                : 'manage.member.remove_manager_dialog.description',
              [removeTargetMember.user_name],
            )
          "
        />
      </v-card-text>
      <v-card-actions>
        <v-btn type="cancel" :disabled="isLoading" @click="emit('cancel')">
          {{ $t('cancel') }}
        </v-btn>
        <v-btn type="submit" :loading="isLoading" @click="emit('confirm-remove', removeTargetMember)">
          {{ $t('manage.member.remove_manager_dialog.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
