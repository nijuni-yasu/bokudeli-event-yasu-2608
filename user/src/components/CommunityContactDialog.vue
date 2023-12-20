<script setup lang="ts">

interface Props {
  modelValue: boolean,
  communityName: string | null
}
interface Emit {
  (e: 'update:modelValue', value: boolean): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const closeDialog = () => {
  dialog.value = false
 }

const onFormSubmit = async () => {
  closeDialog()
}

</script>

<template>
  <v-dialog v-model="dialog" :width="$vuetify.display.smAndDown ? 'auto' : 650" persistent>
    <v-card class="pa-sm-9 pa-5 text-center">
      <v-card-title class="text-h5"> 
        <v-icon start>
          mdi-email
        </v-icon>
        お問い合わせ
      </v-card-title>
      <v-card-text>
        送信先：{{ props.communityName }} にメールにてお問い合わせします。
      </v-card-text>

      <v-card-text>
        <v-form class="mt-6" @submit.prevent="onFormSubmit">
          <v-row>
            <v-col cols="12" md="12">
              <v-text-field label="件名" />
            </v-col>
            <v-col cols="12" md="12">
              <VTextarea label="メッセージ" />
            </v-col>
            <!-- 👉 Submit and Cancel -->
            <v-col cols="12" class="d-flex flex-wrap justify-center gap-4">
              <v-btn type="submit" rounded> メッセージ送信 </v-btn>
              <v-btn rounded color="secondary" variant="tonal" @click="closeDialog"> キャンセル </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
