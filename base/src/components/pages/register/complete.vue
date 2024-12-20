<script setup lang="ts">
import logo from "@/assets/images/shokujii/shokujii_logo_wide.png";

const route = useRoute()

const titleLabel = ref('')
const descriptionLabel = ref('')
const selfButtonLabel = ref('')
const profileLink = ref('')

const isNew = computed(() => {
  const value = route.query.new
  return value === '1' ? 1 : 0
})

if (isNew.value === 1) {
  titleLabel.value = 'アカウント登録完了'
  descriptionLabel.value = 'shokujiiのアカウントの登録が完了しました 🎉\nSNSアカウント連携して、プロフィールを登録しましょう。'
  selfButtonLabel.value = '自分でプロフィールを登録する'
  profileLink.value = '/u/profile?isNew=1'
} else {
  titleLabel.value = 'プロフィール登録'
  descriptionLabel.value = 'プロフィールが登録されていません。\nSNSアカウントと連携して、プロフィール登録を完了させよう👍'
  selfButtonLabel.value = '自分でプロフィールを入力する'
  profileLink.value = '/u/profile?isNew=0'
}

// TODO: X連携

// TODO: Facebook連携
</script>

<template>
  <v-container>
    <v-row justify="center" class="mt-16">
      <v-col md="5">
        <v-sheet class="rounded-lg py-14 px-12">
          <v-container>
            <v-row justify="center" >
              <v-img max-height="150" max-width="300" :src="logo"></v-img>
            </v-row>
            <v-row justify="center">
              <h1 class="my-3 text-h3 font-weight-bold">{{ titleLabel }}</h1>
            </v-row>
            <v-row justify="center">
              <p class="pre-line">
                {{ descriptionLabel }}
              </p>
            </v-row>
          </v-container>

          <v-btn class="mb-4" size="large" color="grey-900" block>
            X と連携してプロフィール登録
          </v-btn>
          <v-btn class="mb-4" size="large" color="grey-900" block>
            Facebookと連携してプロフィール登録
          </v-btn>
          <v-btn class="mb-4" size="large" color="grey-900" block :to="profileLink">
            {{ selfButtonLabel }}
          </v-btn>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="scss">

</style>