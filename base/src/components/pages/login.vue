<script setup lang="ts">
import logo from '@/assets/images/shokujii/shokujii_logo_wide.png'
</script>

<template>
  <div class="d-flex flex-column align-center justify-center">
    <v-sheet class="rounded-lg w-33 py-14 px-12">
      <div class="text-center mb-10">
        <img :src="logo" alt="shokuji logo" />
        <h2 class="my-3 text-h3 font-weight-bold">shokujiへようこそ</h2>
        <p class="">以下からログインまたは新規登録してください。</p>
      </div>

      <v-form>
        <div class="field-container mb-4">
          <label class="field-label" style="font-size: 12px; font-weight: bold;">メールアドレス</label>
          <v-text-field placeholder="example@example.com"/>
        </div>

        <v-btn block size="large" color="grey-900" class="mb-10">
          メールアドレスで続ける
        </v-btn>
        <v-btn block size="large" color="grey-900" class="mb-4">
          Xでログイン
        </v-btn>
        <v-btn block size="large" color="grey-900" class="mb-4">
          Facebookでログイン
        </v-btn>
        <v-btn block size="large" color="grey-900">
          Googleでログイン
        </v-btn>
      </v-form>
    </v-sheet>
  </div>
</template>

<style scoped lang="scss">


</style>