<script setup lang="ts">
import { useRouter } from 'vue-router'
import { mdiHome } from '@mdi/js'
import community from '@/assets/images/manage/community_01.png'
import ManageTopCard from '@/componentsLocal/ManageTopCard.vue'

const router = useRouter()
// router.push('/manage/community')

const howtos = [
  {
    stepNumber: '①',
    title: 'コミュニティを作成しよう',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
  {
    stepNumber: '②',
    title: 'イベントを下書き作成',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
  {
    stepNumber: '③',
    title: 'お店に予約申請しよう',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
  {
    stepNumber: '④',
    title: 'まずは主催者が注文！',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
  {
    stepNumber: '⑤',
    title: 'SNSなどで告知開始',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
  {
    stepNumber: '⑥',
    title: 'ユーザーへの一斉配信',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
  {
    stepNumber: '⑦',
    title: '注文期限になると注文確定',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
  {
    stepNumber: '⑧',
    title: 'いただきます&ごちそうさま',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  }
]

const functions = [
  {
    stepNumber: '①',
    title: 'SNS投稿機能',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
  {
    stepNumber: '②',
    title: '公開設定/URL限定公開',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
  {
    stepNumber: '③',
    title: '参加者決済/主催者請求書払い',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
  {
    stepNumber: '④',
    title: 'レター機能(メール配信)',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
  {
    stepNumber: '⑤',
    title: 'チラシ生成機能',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
  {
    stepNumber: '⑥',
    title: 'Slack連携',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
  {
    stepNumber: '⑦',
    title: 'and so on...',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  }

]

const prices = [
  {
    stepNumber: '①',
    title: 'コミュニティ利用',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
  {
    stepNumber: '②',
    title: 'コーポレート利用',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
  {
    stepNumber: '③',
    title: 'エンタープライズ利用',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
]

const supports = [
  {
    stepNumber: '①',
    title: 'SNS投稿機能',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
  {
    stepNumber: '②',
    title: '公開設定/URL限定公開',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
  {
    stepNumber: '③',
    title: '参加者決済/主催者請求書払い',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文'
  },
]
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card class="pa-5">
        <v-container class="my-15">
          <v-row class="text-center">
            <v-col cols="12">
              <v-card-title>
                <span class="text-h2 font-weight-bold">【shokujiiって？】</span>
              </v-card-title>
              <v-card-text>
                <span class="text-h5">
                  イベント開催の流れをご覧ください。イベント開催の流れをご覧ください。
                </span>
                <div class="text-center d-flex justify-center pa-5">
                  <v-img width="600px" height="300px" :src="community"/>
                </div>
              </v-card-text>
            </v-col>
          </v-row>
        </v-container>
        <v-container class="my-15">
          <v-row class="text-center">
            <v-col cols="12">
              <v-card-title>
                <span class="text-h2 font-weight-bold">【イベントのながれ】</span>
              </v-card-title>
              <v-card-text>
                <span class="text-h5">
                  イベント開催の流れをご覧ください。イベント開催の流れをご覧ください。
                </span>
              </v-card-text>
            </v-col>
          </v-row>
          <v-row class="pb-10">
            <ManageTopCard
              v-for="step in howtos"
              :key="step.stepNumber"
              :step-number="step.stepNumber"
              :title="step.title"
              :description="step.description"
              :image-src="community"
            />
          </v-row>
        </v-container>
        <v-container class="my-15">
          <v-row class="text-center">
            <v-col cols="12">
              <v-card-title>
                <span class="text-h2 font-weight-bold">【機能一覧】</span>
              </v-card-title>
              <v-card-text>
                <span class="text-h5">
                  shokujiiでできることをご覧ください。shokujiiでできることをご覧ください。
                </span>
              </v-card-text>
            </v-col>
          </v-row>
          <v-row>
            <ManageTopCard
              v-for="step in functions"
              :key="step.stepNumber"
              :step-number="step.stepNumber"
              :title="step.title"
              :description="step.description"
              :image-src="community"
            />
          </v-row>
        </v-container>
        <v-container class="my-15">
          <v-row class="text-center">
            <v-col cols="12">
              <v-card-title>
                <span class="text-h2 font-weight-bold">【利用料金】</span>
              </v-card-title>
              <v-card-text>
                <span class="text-h5">
                  無料でご利用いただけます。
                </span>
              </v-card-text>
            </v-col>
          </v-row>
          <v-row class="justify-center">
            <ManageTopCard
              v-for="step in prices"
              :key="step.stepNumber"
              :step-number="step.stepNumber"
              :title="step.title"
              :description="step.description"
              :image-src="community"
            />
          </v-row>
        </v-container>
        <v-container class="my-15">
          <v-row class="text-center">
            <v-col cols="12">
              <v-card-title>
                <span class="text-h2 font-weight-bold">【サポート】</span>
              </v-card-title>
              <v-card-text>
                <span class="text-h5">
                  サポートにご連絡ください。
                </span>
              </v-card-text>
            </v-col>
          </v-row>
          <v-row class="justify-center">
            <ManageTopCard
              v-for="step in supports"
              :key="step.stepNumber"
              :step-number="step.stepNumber"
              :title="step.title"
              :description="step.description"
              :image-src="community"
            />
          </v-row>
        </v-container>
      </v-card>
    </v-col>
  </v-row>
</template>

<route lang="yaml">
meta:
  layout: manage
</route>
