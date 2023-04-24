<script setup lang="ts">
import contents from '@/assets/sample_data'

const menuContent = [
  {
    menuImage: new URL('@/assets/images/bokudeli/menu_ex_01.jpg',import.meta.url).href,
    category: 'sales-automation',
    characterSize: '400',
    menu: 'チキンガレット丼',
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: 'トゥッカーノグリル',
    price: '1200',
  },
  {
    menuImage: new URL('@/assets/images/bokudeli/menu_ex_02.jpg',import.meta.url).href,
    category: 'marketing-automation',
    characterSize: '400',
    menu: 'メガ丼',
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: 'トゥッカーノグリル',
    price: '1500',
  },
  {
    menuImage: new URL('@/assets/images/bokudeli/menu_ex_03.jpg',import.meta.url).href,
    category: 'api-questions',
    characterSize: '400',
    menu: 'ローストポーク丼',
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: 'トゥッカーノグリル',
    price: '800',
  },
  {
    menuImage: new URL('@/assets/images/bokudeli/menu_ex_04.jpg',import.meta.url).href,
    category: 'email-marketing',
    characterSize: '400',
    menu: '豚バラ丼',
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: 'トゥッカーノグリル',
    price: '800',
  },
  {
    menuImage: new URL('@/assets/images/bokudeli/menu_ex_05.jpg',import.meta.url).href,
    category: 'personalization',
    characterSize: '400',
    menu: '牛ステーキ丼',
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: 'トゥッカーノグリル',
    price: '1000',
  },
  {
    menuImage: new URL('@/assets/images/bokudeli/menu_ex_06.jpg',import.meta.url).href,
    category: 'demand-generation',
    characterSize: '400',
    menu: '牛スジ煮込み丼',
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: 'トゥッカーノグリル',
    price: '1100',
  },
  {
    menuImage: new URL('@/assets/images/bokudeli/menu_ex_01.jpg',import.meta.url).href,
    category: 'demand-generation',
    characterSize: '400',
    menu: 'チキンガレット丼',
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: 'トゥッカーノグリル',
    price: '1000',
  },
  {
    menuImage: new URL('@/assets/images/bokudeli/menu_ex_01.jpg',import.meta.url).href,
    category: 'demand-generation',
    characterSize: '400',
    menu: 'チキンガレット丼',
    desc: 'Every hero and coward, every creator and destroyer of civilization.',
    shop: 'トゥッカーノグリル',
    price: '1000',
  },
]
const memberList = [
  {
    id: 1,
    avatar: new URL('@/assets/images/avatars/avatar-4.png',import.meta.url).href,
    name: 'Sato hanako',
  },
  {
    id: 2,
    avatar: new URL('@/assets/images/avatars/avatar-8.png',import.meta.url).href,
    name: 'Greezman',
  },
  {
    id: 3,
    avatar: new URL('@/assets/images/avatars/avatar-7.png',import.meta.url).href,
    name: 'Tanaka Ao',
  },
  {
    id: 4,
    avatar: new URL('@/assets/images/avatars/avatar-3.png',import.meta.url).href,
    name: 'Mitoma',
  },
  {
    id: 5,
    avatar: new URL('@/assets/images/avatars/avatar-2.png',import.meta.url).href,
    name: 'Keisuke Honda',
  },
  {
    id: 6,
    avatar: new URL('@/assets/images/avatars/avatar-1.png',import.meta.url).href,
    name: 'Naohero',
  },
  {
    id: 7,
    avatar: new URL('@/assets/images/avatars/avatar-4.png',import.meta.url).href,
    name: 'Moriyasu kantoku',
  },
  {
    id: 8,
    avatar: new URL('@/assets/images/avatars/avatar-8.png',import.meta.url).href,
    name: 'Messi',
  },
  {
    id: 7,
    avatar: new URL('@/assets/images/avatars/avatar-7.png',import.meta.url).href,
    name: 'Christiano Ronald',
  },
  {
    id: 3,
    avatar: new URL('@/assets/images/avatars/avatar-3.png',import.meta.url).href,
    name: 'Zlatan',
  },
]
const eventImage = new URL('@/assets/images/bokudeli/event_ex_01.png',import.meta.url).href
const covidImage = new URL('@/assets/images/bokudeli/covid19.png',import.meta.url).href

</script>

<template>
  <section id="knowledge-base">
    <!-- seach banner  -->
    <v-row
      class="justify-center"
    >
      <v-col
        md="9"
        sm="9"
        cols="12"
      >
        <v-card
          flat
          class="align-center justify-center text-center my-10 pa-10"
        >
          <v-row>
            <v-col>
              <v-img
                class="ma-0"
                :src="eventImage"
              >
              </v-img>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-card-title class="justify-center text-h4 font-weight-semibold pb-10">
                DMM.makeAKIBA 8周年祭り ランチ会👩🏻‍💻
              </v-card-title>
              <v-card-text
                class="text-left pb-5 cursor-pointer text-decoration-none"
                @click="$router.push('/community')"
              >
                <router-link
                  to="/community"
                  class="text--primary cursor-pointer text-decoration-none"
                >
                  <v-row
                    class="ma-1"
                  >
                    <img
                      src="@/assets/images/bokudeli/icon_dmmmakeakiba.png"
                      style="border-radius: 10px"
                      aspect-ratio="1"
                      width="75px"
                    >
                    <div
                      class="ml-2"
                    >
                      <div style="font-size:14px">
                        【主催者】
                      </div>
                      <div style="font-size:24px">
                        DMM.make AKIBA
                      </div>
                    </div>
                  </v-row>
                </router-link>
              </v-card-text>
              <v-card-text class="text-left pb-5">
                【開催場所】東京都千代田区神田練塀町3 富士ソフト秋葉原ビル12F DMM.makeAKIBA
              </v-card-text>
              <v-card-text class="text-left pb-5">
                【注文期限】2022/12/14(水曜日) 23:00
              </v-card-text>
              <v-card-text class="text-left pb-5">
                【開催日時】2022/12/15(木曜日) 13:00
              </v-card-text>
              <v-card-text class="text-left pb-5">
                【お店】トゥッカーノグリル
              </v-card-text>
              <v-card-text class="text-left pb-5">
                【開催内容】<br>
                Look again at that dot. That’s here. That’s home. That’s us. On it everyone you love. Look again at that dot. That’s here. That’s home. That’s us. On it everyone you love. Look again at that dot. That’s here. That’s home. That’s us. On it everyone you love. Look again at that dot. That’s here. That’s home. That’s us. On it everyone you love. Look again at that dot. That’s here. That’s home. That’s us. On it everyone you love. Look again at that dot. That’s here. That’s home. That’s us. On it everyone you love.
              </v-card-text>
              <v-card-text class="text-left pb-5">
                【コロナ感染対策】
                <v-row
                  class="justify-center"
                >
                  <v-col
                    class="d-flex child-flex"
                    cols="12"
                  >
                    <v-img
                      class="ma-5"
                      :src="covidImage"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
              <v-card-text class="text-left pb-5">
                【最大人数】20名
              </v-card-text>
              <v-card-text class="text-left pb-10">
                【参加者】
                <v-row>
                  <v-col
                    v-for="(data,index) in memberList"
                    :key="data.avatar"
                    class="d-flex justify-start px-0 pt-2 pb-0"
                    cols="3"
                  >
                    <!--
                    <router-link
                      :to="{ name: 'apps-user-view',params: { id: data.id } }"
                      class="text--primary cursor-pointer text-decoration-none"
                    > -->
                      <v-row
                        class="ma-1"
                      >
                        <v-avatar
                          class="ml-2 mt-2"
                          size="50"
                        >
                          <img
                            :src="data.avatar"                    
                          >
                        </v-avatar>
                        <div class="d-flex align-center flex-wrap flex-grow-1 ml-2">
                          <div>
                            {{ data.name }}
                          </div>
                        </div>
                      </v-row>
                    <!--</router-link> -->
                  </v-col>
                </v-row>
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>
        <!-- kb search content -->
        <v-row>
          <v-col
            v-for="item in menuContent"
            :key="item.menuImage"
            md="4"
            sm="6"
            cols="12"
          >
            <v-card
              class="mb-3 mx-0"
              color="text-center cursor-pointer"
            >
              <v-img
                :src="item.menuImage"
                aspect-ratio="1"
              ></v-img>

              <!-- title -->
              <v-card-title class="justify-center pb-3">
                {{ item.menu }}
              </v-card-title>
              <v-card-text class="text-left pb-8">
                  {{ item.desc }}
              </v-card-text>
              <v-card-text class="text-right text-h6 pb-2">
                ¥ {{ item.price }}
              </v-card-text>
              <v-btn
                target="blank"
                color="primary"
                rounded
                outlined
                class="my-3"
              >
              <!--
                <event-cart-modal
                card_title="カートの追加"
                :menu="item"
              ></event-cart-modal>
              -->
              </v-btn>
            </v-card>
          </v-col>

          <!-- no result found -->
          <v-col
            v-show="!menuContent.length"
            cols="12"
            class="text-center"
          >
            <h4 class="mt-4">
              Search result not found!!
            </h4>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </section>
</template>
<style lang="scss" scoped></style>