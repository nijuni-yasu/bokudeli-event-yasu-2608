<script setup lang="ts">
interface UserData {
  id: number
  username: string
}

interface Props {
  userData: UserData
  isDialogVisible: boolean
}

interface Emit {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', value: UserData): void
  (e: 'update:isDialogVisible', val: boolean): void
}
const props = defineProps<Props>()

const emit = defineEmits<Emit>()

const userData = ref<UserData>(structuredClone(toRaw(props.userData)))

watch(props, () => {
  userData.value = structuredClone(toRaw(props.userData))
})

const onFormSubmit = () => {
  emit('update:modelValue', false)
  emit('submit', userData.value)
}

const onFormReset = () => {
  userData.value = structuredClone(toRaw(props.userData))

  emit('update:isDialogVisible', false)
}

const dialogVisibleUpdate = (val: boolean) => {
  emit('update:isDialogVisible', val)
}
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 650 "
    :model-value="props.isDialogVisible"
    @update:model-value="dialogVisibleUpdate"
  >
    <VCard class="pa-sm-9 pa-5">
      <VCardItem class="text-center">
        <VCardTitle class="text-h5">
          ユーザー情報
        </VCardTitle>
      </VCardItem>

      <VCardText>
        <!-- 👉 Form -->
        <VForm
          class="mt-6"
          @submit.prevent="onFormSubmit"
        >
          <VRow>
            <!-- 👉 Username -->
            <VCol
              cols="12"
              md="12"
            >
              <VTextField
                label="ユーザー名"
              />
            </VCol>
            <VCol
              cols="12"
              md="12"
            >
              <VTextField
                label="Twitter"
              />
            </VCol>
            <VCol
              cols="12"
              md="12"
            >
              <VTextField
                label="Facebook"
              />
            </VCol>
            <VCol
              cols="12"
              md="12"
            >
              <VTextField
                label="Instagram"
              />
            </VCol>
            <VCol
              cols="12"
              md="12"
            >
              <VTextarea
                label="自己紹介文"
              />
            </VCol>
            <!-- 👉 Submit and Cancel -->
            <VCol
              cols="12"
              class="d-flex flex-wrap justify-center gap-4"
            >
              <VBtn type="submit" rounded>
                設定
              </VBtn>
              <VBtn
                rounded
                color="secondary"
                variant="tonal"
                @click="onFormReset"
              >
                キャンセル
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>
