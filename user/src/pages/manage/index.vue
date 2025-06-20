<script setup lang="ts">
import ManageTopCard from '@/componentsLocal/ManageTopCard.vue'
import about from '@/assets/images/manage_top/about_shokujii.png'
import howto01 from '@/assets/images/manage_top/manage_howto_icon_01.png'
import howto02 from '@/assets/images/manage_top/manage_howto_icon_02.png'
import howto03 from '@/assets/images/manage_top/manage_howto_icon_03.png'
import howto04 from '@/assets/images/manage_top/manage_howto_icon_04.png'
import howto05 from '@/assets/images/manage_top/manage_howto_icon_05.png'
import howto06 from '@/assets/images/manage_top/manage_howto_icon_06.png'
import howto07 from '@/assets/images/manage_top/manage_howto_icon_07.png'
import howto08 from '@/assets/images/manage_top/manage_howto_icon_08.png'
import func01 from '@/assets/images/manage_top/manage_func_icon_01.png'
import func02 from '@/assets/images/manage_top/manage_func_icon_02.png'
import func03 from '@/assets/images/manage_top/manage_func_icon_03.png'
import func04 from '@/assets/images/manage_top/manage_func_icon_04.png'
import func05 from '@/assets/images/manage_top/manage_func_icon_05.png'
import func06 from '@/assets/images/manage_top/manage_func_icon_06.png'
import func07 from '@/assets/images/manage_top/manage_func_icon_07.png'
import func08 from '@/assets/images/manage_top/manage_func_icon_08.png'
import func09 from '@/assets/images/manage_top/manage_func_icon_09.png'
import price01 from '@/assets/images/manage_top/manage_price_icon_01.png'
import price02 from '@/assets/images/manage_top/manage_price_icon_02.png'
import support01 from '@/assets/images/manage_top/manage_support_icon_01.png'
import support02 from '@/assets/images/manage_top/manage_support_icon_02.png'
import support03 from '@/assets/images/manage_top/manage_support_icon_03.png'


const howtos = [
  {
    stepNumber: '①',
    title: 'コミュニティを作成',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: 'コミュニティを作成',
    buttonLink: '/manage/newcommunity',
    imageSrc: howto01
  },
  {
    stepNumber: '②',
    title: 'イベントを下書き作成',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: 'イベントを作成',
    buttonLink: '/manage/event',
    imageSrc: howto02
  },
  {
    stepNumber: '③',
    title: 'お店に予約申請',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: howto03
  },
  {
    stepNumber: '④',
    title: 'まずは主催者が注文！',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: howto04
  },
  {
    stepNumber: '⑤',
    title: 'SNSやメールで告知',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: howto05
  },
  {
    stepNumber: '⑥',
    title: '注文期限で自動発注',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: howto06
  },
  {
    stepNumber: '⑦',
    title: 'お店からデリバリー',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: howto07
  },
  {
    stepNumber: '⑧',
    title: 'いただきます！',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: howto08
  }
]

const functions = [
  {
    stepNumber: '①',
    title: '参加者 事前決済',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: func01
  },
  {
    stepNumber: '②',
    title: '主催者 請求書払い',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: func02
  },
  {
    stepNumber: '③',
    title: '公開設定/URL限定公開',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: func03
  },
  {
    stepNumber: '④',
    title: '管理者追加/削除',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: func04
  },
  {
    stepNumber: '⑤',
    title: 'SNS投稿機能',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: func05
  },
  {
    stepNumber: '⑥',
    title: 'レター機能(メール配信)',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: func06
  },
  {
    stepNumber: '⑦',
    title: 'チラシ生成機能',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: func07
  },
  {
    stepNumber: '⑧',
    title: 'Slack連携',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: func08
  },
  {
    stepNumber: '⑨',
    title: 'and so on...',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    imageSrc: func09
  }

]

const prices = [
  {
    stepNumber: '①',
    title: '主催者利用料 無料',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: price01
  },
  {
    stepNumber: '②',
    title: '配送料 無料',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: price02
  },
  {
    stepNumber: '③',
    title: '請求書払い手数料',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: func02
  },
]

const supports = [
  {
    stepNumber: '①',
    title: 'チャットでサポート',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: support01
  },
  {
    stepNumber: '②',
    title: 'オンラインMTG',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: support02
  },
  {
    stepNumber: '③',
    title: '緊急連絡先',
    description: '説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文・説明文',
    buttonText: '詳細を見る',
    buttonHref: 'https://bit.ly/3S3L8Sv',
    imageSrc: support03
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
              <v-card-text>
                <span class="text-h2 font-weight-bold">【shokujiiって？】</span>
              </v-card-text>
              <v-card-text>
                <span class="text-h5">
                  食事でつながる「shokujii」は「イベント集客ツール」に「フードオーダーシステム」を組み合わせたWEBサービスです。<br>
                  イベント主催者は、注文するお店を選ぶだけで、簡単にイベントのコンテンツを作ることができます。<br>
                  さらにイベント参加者は、食べたいメニューを選んで事前決済するだけでそのコミュニティの輪に加わることができます。<br>
                  食のもとに人が集い、人のもとにさらに人が集う。食を通じた出会いの場を作ります。<br>
                  <a href="https://about.shokujii.jp/" target="_blank">https://about.shokujii.jp/</a>
                </span>
                <div class="text-center d-flex justify-center pa-1">
                  <v-img width="600px" height="300px" :src="about"/>
                </div>
              </v-card-text>
            </v-col>
          </v-row>
        </v-container>
        <v-container class="my-15">
          <v-row class="text-center">
            <v-col cols="12">
              <v-card-text>
                <span class="text-h2 font-weight-bold">【イベント開催の流れ】</span>
              </v-card-text>
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
              :image-src="step.imageSrc"
              :button-text="step?.buttonText"
              :button-link="step?.buttonLink"
              :button-href="step?.buttonHref"
            />
          </v-row>
        </v-container>
        <v-container class="my-15">
          <v-row class="text-center">
            <v-col cols="12">
              <v-card-text>
                <span class="text-h2 font-weight-bold">【機能一覧】</span>
              </v-card-text>
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
              :image-src="step.imageSrc"
              :button-text="step?.buttonText"
              :button-href="step?.buttonHref"
            />
          </v-row>
        </v-container>
        <v-container class="my-15">
          <v-row class="text-center">
            <v-col cols="12">
              <v-card-text>
                <span class="text-h2 font-weight-bold">【利用料金】</span>
              </v-card-text>
              <v-card-text>
                <span class="text-h5">
                 基本無料でご利用いただけます。
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
              :image-src="step.imageSrc"
              :button-text="step?.buttonText"
              :button-href="step?.buttonHref"
            />
          </v-row>
        </v-container>
        <v-container class="my-15">
          <v-row class="text-center">
            <v-col cols="12">
              <v-card-text>
                <span class="text-h2 font-weight-bold">【サポート】</span>
              </v-card-text>
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
              :image-src="step.imageSrc"
              :button-text="step?.buttonText"
              :button-href="step?.buttonHref"
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
