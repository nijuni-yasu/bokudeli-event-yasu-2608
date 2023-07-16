<script setup lang="ts">
import menu01 from '@/assets/images/bokudeli/menu_ex_01.jpg'
import menu02 from '@/assets/images/bokudeli/menu_ex_02.jpg'
import menu03 from '@/assets/images/bokudeli/menu_ex_03.jpg'
import menu04 from '@/assets/images/bokudeli/menu_ex_04.jpg'
import menu05 from '@/assets/images/bokudeli/menu_ex_05.jpg'
import menu06 from '@/assets/images/bokudeli/menu_ex_06.jpg'

const props = defineProps<{
  informationData: any
}>()

const optionsLocal = ref(JSON.parse(JSON.stringify(props.informationData)))

const resetForm = () => {
  optionsLocal.value = JSON.parse(JSON.stringify(props.informationData))
}

const menuContent = [
  {
    menuImage: menu01,
    category: 'sales-automation',
    characterSize: '400',
    menu: 'チキンガレット丼',
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: 'トゥッカーノグリル',
    price: '1000',
  },
  {
    menuImage: menu02,
    category: 'marketing-automation',
    characterSize: '400',
    menu: 'メガ丼',
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: 'トゥッカーノグリル',
    price: '1000',
  },
  {
    menuImage: menu03,
    category: 'api-questions',
    characterSize: '400',
    menu: 'ローストポーク丼',
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: 'トゥッカーノグリル',
    price: '1000',
  },
  {
    menuImage: menu04,
    category: 'email-marketing',
    characterSize: '400',
    menu: '豚バラ丼',
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: 'トゥッカーノグリル',
    price: '1000',
  },
  {
    menuImage: menu05,
    category: 'personalization',
    characterSize: '400',
    menu: '牛ステーキ丼',
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: 'トゥッカーノグリル',
    price: '1000',
  },
  {
    menuImage: menu06,
    category: 'demand-generation',
    characterSize: '400',
    menu: '牛スジ煮込み丼',
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: 'トゥッカーノグリル',
    price: '1000',
  },
  {
    menuImage: menu01,
    category: 'demand-generation',
    characterSize: '400',
    menu: 'チキンガレット丼',
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: 'トゥッカーノグリル',
    price: '1000',
  },
  {
    menuImage: menu01,
    category: 'demand-generation',
    characterSize: '400',
    menu: 'チキンガレット丼',
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: 'トゥッカーノグリル',
    price: '1000',
  },
]
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="10">
      <v-card flat class="pa-3 mt-2">
        <v-form class="multi-col-validation">
          <v-card-title class="mt-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-chart-timeline-variant" />
            <span>メニュー</span>
          </v-card-title>

          <!-- Activity -->
          <v-row>
            <v-col v-for="item in menuContent" :key="item.menu" md="3" sm="3" cols="12">
              <v-card class="mb-3 mx-0" color="text-center cursor-pointer">
                <v-img :src="item.menuImage" cover aspect-ratio="1.91" />

                <!-- title -->
                <v-card-title class="justify-center pb-3">
                  {{ item.menu }}
                </v-card-title>
                <v-card-text class="text-left pb-8">
                  {{ item.desc }}
                </v-card-text>
                <v-card-text class="text-right text-h6 pb-2"> ¥ {{ item.price }} </v-card-text>
              </v-card>
            </v-col>

            <!-- no result found -->
            <v-col v-show="!menuContent.length" cols="12" class="text-center">
              <h4 class="mt-4">Search result not found!!</h4>
            </v-col>
          </v-row>

          <v-card-text>
            <v-btn color="primary" class="me-3 mt-3"> Save changes </v-btn>
            <v-btn outlined class="mt-3" color="secondary" type="reset" @click.prevent="resetForm"> Cancel </v-btn>
          </v-card-text>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>
<style lang="scss" scoped></style>
