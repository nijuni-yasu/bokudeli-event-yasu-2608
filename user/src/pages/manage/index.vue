<script setup lang="ts">
import ManageTopCard from '@/componentsLocal/ManageTopCard.vue'
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
import price01 from '@/assets/images/manage_top/manage_price_icon_01.png'
import price02 from '@/assets/images/manage_top/manage_price_icon_02.png'
import support01 from '@/assets/images/manage_top/manage_support_icon_01.png'
import support02 from '@/assets/images/manage_top/manage_support_icon_02.png'
import support03 from '@/assets/images/manage_top/manage_support_icon_03.png'

const { t } = useI18n()

const howtos = [
  {
    stepNumber: '①',
    title: t('manage.top.howto.step1.title'),
    description: t('manage.top.howto.step1.description'),
    buttonText: t('manage.top.howto.step1.button'),
    buttonLink: '/manage/newcommunity',
    imageSrc: howto01
  },
  {
    stepNumber: '②',
    title: t('manage.top.howto.step2.title'),
    description: t('manage.top.howto.step2.description'),
    buttonText: t('manage.top.howto.step2.button'),
    buttonLink: '/manage/event',
    imageSrc: howto02
  },
  {
    stepNumber: '③',
    title: t('manage.top.howto.step3.title'),
    description: t('manage.top.howto.step3.description'),
    buttonText: t('manage.top.howto.step3.button'),
    imageSrc: howto03
  },
  {
    stepNumber: '④',
    title: t('manage.top.howto.step4.title'),
    description: t('manage.top.howto.step4.description'),
    buttonText: t('manage.top.howto.step4.button'),
    imageSrc: howto04
  },
  {
    stepNumber: '⑤',
    title: t('manage.top.howto.step5.title'),
    description: t('manage.top.howto.step5.description'),
    buttonText: t('manage.top.howto.step5.button'),
    buttonHref: 'https://bit.ly/40UmEzA',
    imageSrc: howto05
  },
  {
    stepNumber: '⑥',
    title: t('manage.top.howto.step6.title'),
    description: t('manage.top.howto.step6.description'),
    buttonText: t('manage.top.howto.step6.button'),
    imageSrc: howto06
  },
  {
    stepNumber: '⑦',
    title: t('manage.top.howto.step7.title'),
    description: t('manage.top.howto.step7.description'),
    buttonText: t('manage.top.howto.step7.button'),
    imageSrc: howto07
  },
  {
    stepNumber: '⑧',
    title: t('manage.top.howto.step8.title'),
    description: t('manage.top.howto.step8.description'),
    buttonText: t('manage.top.howto.step8.button'),
    buttonHref: 'https://docs.google.com/presentation/d/1rCoJlhzoPE9pOAYHYGxWimAOc1hVi0slJMp_-HhjqbE/edit?slide=id.g2b9c62499c1_0_33#slide=id.g2b9c62499c1_0_33',
    imageSrc: howto08
  }
]

const functions = [
  {
    stepNumber: '①',
    title: t('manage.top.functions.step1.title'),
    description: t('manage.top.functions.step1.description'),
    buttonText: t('manage.top.functions.step1.button'),
    imageSrc: func01
  },
  {
    stepNumber: '②',
    title: t('manage.top.functions.step2.title'),
    description: t('manage.top.functions.step2.description'),
    buttonText: t('manage.top.functions.step2.button'),
    imageSrc: func02
  },
  {
    stepNumber: '③',
    title: t('manage.top.functions.step3.title'),
    description: t('manage.top.functions.step3.description'),
    buttonText: t('manage.top.functions.step3.button'),
    imageSrc: func03
  },
  {
    stepNumber: '④',
    title: t('manage.top.functions.step4.title'),
    description: t('manage.top.functions.step4.description'),
    buttonText: t('manage.top.functions.step4.button'),
    imageSrc: func04
  },
  {
    stepNumber: '⑤',
    title: t('manage.top.functions.step5.title'),
    description: t('manage.top.functions.step5.description'),
    buttonText: t('manage.top.functions.step5.button'),
    imageSrc: func05
  },
  {
    stepNumber: '⑥',
    title: t('manage.top.functions.step6.title'),
    description: t('manage.top.functions.step6.description'),
    buttonText: t('manage.top.functions.step6.button'),
    buttonHref: 'https://note.com/shokujii/n/n0c961c680fd3',
    imageSrc: func06
  },
  {
    stepNumber: '⑦',
    title: t('manage.top.functions.step7.title'),
    description: t('manage.top.functions.step7.description'),
    buttonText: t('manage.top.functions.step7.button'),
    buttonHref: 'https://bit.ly/433wAbb',
    imageSrc: func07
  },
  {
    stepNumber: '⑧',
    title: t('manage.top.functions.step8.title'),
    description: t('manage.top.functions.step8.description'),
    buttonText: t('manage.top.functions.step8.button'),
    buttonHref: 'https://docs.google.com/presentation/d/1i57dsnNhCi1G97RwSpJZQc1r7Gs7HilxMyQ9aWfxRqw/edit#slide=id.g2e7a4494cae_0_0',
    imageSrc: func08
  },

]

const prices = [
  {
    stepNumber: '①',
    title: t('manage.top.prices.step1.title'),
    description: t('manage.top.prices.step1.description'),
    buttonText: t('manage.top.prices.step1.button'),
    imageSrc: price01
  },
  {
    stepNumber: '②',
    title: t('manage.top.prices.step2.title'),
    description: t('manage.top.prices.step2.description'),
    buttonText: t('manage.top.prices.step2.button'),
    imageSrc: price02
  },
  {
    stepNumber: '③',
    title: t('manage.top.prices.step3.title'),
    description: t('manage.top.prices.step3.description'),
    imageSrc: func02
  },
]

const supports = [
  {
    stepNumber: '①',
    title: t('manage.top.supports.step1.title'),
    description: t('manage.top.supports.step1.description'),
    buttonText: t('manage.top.supports.step1.button'),
    imageSrc: support01
  },
  {
    stepNumber: '②',
    title: t('manage.top.supports.step2.title'),
    description: t('manage.top.supports.step2.description'),
    buttonText: t('manage.top.supports.step2.button'),
    buttonHref: 'https://app.spirinc.com/t/V4L1T-BBygLMPlpaQZLVl/as/JBl3hjWrljOL70sPAeQCp/confirm',
    imageSrc: support02
  },
  {
    stepNumber: '③',
    title: t('manage.top.supports.step3.title'),
    description: t('manage.top.supports.step3.description'),
    buttonText: t('manage.top.supports.step3.button'),
    buttonHref: 'tel:05017215838',
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
                <span class="text-h2 font-weight-bold">{{ $t('manage.top.about_title') }}</span>
              </v-card-text>
              <v-card-text>
                <span class="text-h5">
                  <div v-html="$t('manage.top.about_description')"/>
                  <v-btn class="ma-5" color="primary" variant="outlined" href="https://about.shokujii.jp" target="_blank">
                    {{ $t('manage.top.about_button_01') }}
                  </v-btn>
                  <v-btn class="ma-5" color="primary" variant="outlined" href="https://corporate-lp.shokujii.jp/" target="_blank">
                    {{ $t('manage.top.about_button_02') }}
                  </v-btn>
                </span>
              </v-card-text>
            </v-col>
          </v-row>
        </v-container>
        <v-container class="my-15">
          <v-row class="text-center">
            <v-col cols="12">
              <v-card-text>
                <span class="text-h2 font-weight-bold">{{ $t('manage.top.flow_title') }}</span>
              </v-card-text>
              <v-card-text>
                <span class="text-h5">
                  {{ $t('manage.top.flow_description') }}
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
              :min-height="370"
            />
          </v-row>
        </v-container>
        <v-container class="my-15">
          <v-row class="text-center">
            <v-col cols="12">
              <v-card-text>
                <span class="text-h2 font-weight-bold">{{ $t('manage.top.function_title') }}</span>
              </v-card-text>
              <v-card-text>
                <span class="text-h5">
                  {{ $t('manage.top.function_description') }}
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
              :min-height="350"
            />
          </v-row>
        </v-container>
        <v-container class="my-15">
          <v-row class="text-center">
            <v-col cols="12">
              <v-card-text>
                <span class="text-h2 font-weight-bold">{{ $t('manage.top.price_title') }}</span>
              </v-card-text>
              <v-card-text>
                <span class="text-h5">
                  {{ $t('manage.top.price_description') }}
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
              :min-height="350"
            />
          </v-row>
        </v-container>
        <v-container class="my-15">
          <v-row class="text-center">
            <v-col cols="12">
              <v-card-text>
                <span class="text-h2 font-weight-bold">{{ $t('manage.top.support_title') }}</span>
              </v-card-text>
              <v-card-text>
                <span class="text-h5">
                  {{ $t('manage.top.support_description') }}
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
              :min-height="390"
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
