<script setup lang="ts">
import logo from "@/assets/images/shokujii/shokujii_logo_wide.png";

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
              <h1 class="my-3 text-h3 font-weight-bold">アカウント登録完了</h1>
            </v-row>
            <v-row justify="center">
              <p>
                shokujiiのアカウントの登録が完了しました 🎉<br/>
                SNSアカウント連携して、プロフィールを登録しましょう。
              </p>
            </v-row>
          </v-container>

          <v-btn class="mb-4" size="large" color="grey-900" block>
            X と連携してプロフィール登録
          </v-btn>
          <v-btn class="mb-4" size="large" color="grey-900" block>
            Facebookと連携してプロフィール登録
          </v-btn>
          <v-btn class="mb-4" size="large" color="grey-900" block to="/u/profile">
            自分でプロフィールを登録する
          </v-btn>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="scss">

</style>