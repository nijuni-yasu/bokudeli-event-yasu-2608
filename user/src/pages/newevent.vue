<script setup lang="ts">

import { getCommunityCreatePath } from '@/router/utils'
const router = useRouter()

</script>

<template>
  <v-row justify="center">
    <v-col cols="12" sm="12" md="6">
      <v-card class="text-center ma-md-10 pa-md-10">
        <v-card-title class="text-h5 my-3 font-weight-bold">
          イベント作成
        </v-card-title>
        <v-card-text class="my-3">
          イベントを作成するコミュニティを選択してください。<br>
          またはコミュニティを新規作成することもできます。
        </v-card-text>

        <v-divider class="my-2" />

        <v-row class="ma-2">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/bokudeli-event-dev.appspot.com/o/communities%2FIwZWeVICJf3OcwwoH7b8%2F%E3%81%BB%E3%82%99%E3%81%8F%E3%83%86%E3%82%99%E3%83%AA_logo_icon.png?alt=media&token=1737bb76-c8b9-4ae3-a7c8-49e4ee9dcace"
            style="border-radius: 5px 5px 5px 5px"
            width="50"
            height="50"
            aspect-ratio="1"
            cover
            class="ma-2"
          />
          <div class="ma-3 text-h6 text-left align-self-center">
            コミュニティ名
          </div>
        </v-row>
        <v-divider class="my-2" />
        <v-row class="ma-2">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/bokudeli-event-dev.appspot.com/o/communities%2Fd4TT2QD4b35SWnb58yWO%2Fcommunity%2F240120_shokujii_%E5%AE%89%E5%B7%9D-1711595223981.png?alt=media&token=28226e7c-e030-4f61-b2df-ef636fab7afc"
            style="border-radius: 5px 5px 5px 5px"
            width="50"
            height="50"
            aspect-ratio="1"
            cover
            class="ma-2"
          />
          <div class="ma-2 text-h6 text-left align-self-center">
            コミュニティ名
          </div>
        <v-divider class="my-2" />
        </v-row>
        <v-row class="ma-2">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/bokudeli-event-test.appspot.com/o/communities%2FInEfJQCGTykSSxkfOPeM%2Fevents%2FbL0Z7Aa7cyFok1ndmuHp%2FDSC07526-1709961161000.JPG?alt=media&token=914b2f1f-1699-4401-984b-3fd8ffbb0776"
            style="border-radius: 5px 5px 5px 5px"
            width="50"
            height="50"
            aspect-ratio="1"
            cover
            class="ma-2"
          />
          <div class="ma-2 text-h6 text-left align-self-center">
            コミュニティ名
          </div>
        </v-row>
        <v-divider class="my-2" />              
        <v-row class="ma-2 text-center justify-center">
          <v-btn
            class="ma-3 text-h6 text-center justify-center"
            variant="text"
            color="primary"
            prepend-icon="mdi-plus"
            @click="router.push(getCommunityCreatePath())"
          >
            コミュニティを新規作成する
          </v-btn>
        </v-row>
      </v-card>
    </v-col>
  </v-row>
</template>
<style lang="scss" scoped></style>
