<script setup lang="ts">
</script>

<template>
    <v-row justify="center">
      <v-col cols="12" md="8" sm="8">
        <v-card class="pa-10 ma-10">
            <v-row>
                <v-col class="d-flex align-center">
                    <v-img
                        class="ma-10"
                        cover
                        aspect-ratio="1.91"
                        src="https://firebasestorage.googleapis.com/v0/b/bokudeli-event-dev.appspot.com/o/communities%2FPkPUiPMERa1551Q9FZRl%2Fcommunity_fuse.png?alt=media&token=19a22e5f-11b3-41ac-8de0-6a55f03e166d" />
                </v-col>
            </v-row>
            <v-card-text class="text-left pb-8 text-h6">
            【主催者】FUSE
            </v-card-text>
            <v-card-text class="text-left pb-8 text-h6">
            【イベント】FUSEランチ交流会
            </v-card-text>
            <v-card-text class="text-left pb-8 text-h6">
            【開催場所】静岡県浜松市中区鍛冶町１００−１ 中央館 B1F ザザシティ浜松
            </v-card-text>
            <v-card-text class="text-left pb-8 text-h6">
            【開催日時】2023-06-30 13:00
            </v-card-text>
            <v-card-text class="text-left pb-8 text-h6">
            【注文期限】2023-06-30 10:00
            </v-card-text>
            <v-card-text class="text-left pb-8 text-h6">
            【お店】AKIHABARAグリル
            </v-card-text>

            <v-row class="text-center align-center">
                <v-col cols="12">
                <v-table>
                    <thead>
                        <tr>
                            <th class="text-center" width="100">                            
                            </th>
                            <th class="text-center">
                                メニュー
                            </th>
                            <th class="text-center">
                                価格
                            </th>
                            <th class="text-center">
                                個数
                            </th>
                            <th class="text-center">
                                小計(税込)
                            </th>
                            <th class="text-center">
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>
                            <v-img
                                class="ma-1"
                                height="100"
                                width="100"
                                cover
                                aspect-ratio="1"
                                src="https://firebasestorage.googleapis.com/v0/b/bokudeli-event-dev.appspot.com/o/Et3UOow7B6gGgxPJ10GL9nEX2AZ2%2Fmenus%2Fmenu_1684056619251.jpeg?alt=media&token=0bc76a09-3cad-440d-881d-68b54a62c19b" />
                        </td>
                        <td>カツ丼</td>
                        <td>¥1,500</td>
                        <td>2</td>
                        <td>¥3,000</td>
                        <td>削除</td>
                    </tr>
                    <tr>
                        <td>
                            <v-img
                                class="ma-1"
                                height="100"
                                width="100"
                                cover
                                aspect-ratio="1"
                                src="https://firebasestorage.googleapis.com/v0/b/bokudeli-event-dev.appspot.com/o/Et3UOow7B6gGgxPJ10GL9nEX2AZ2%2Fmenus%2Fmenu_1684056619251.jpeg?alt=media&token=0bc76a09-3cad-440d-881d-68b54a62c19b" />
                        </td>
                        <td>天丼</td>
                        <td>¥1,000</td>
                        <td>1</td>
                        <td>¥1,000</td>
                        <td>削除</td>
                    </tr>
                    <tr>
                        <td>
                            <v-img
                                class="ma-1"
                                height="100"
                                width="100"
                                cover
                                aspect-ratio="1"
                                src="https://firebasestorage.googleapis.com/v0/b/bokudeli-event-dev.appspot.com/o/Et3UOow7B6gGgxPJ10GL9nEX2AZ2%2Fmenus%2Fmenu_1684056619251.jpeg?alt=media&token=0bc76a09-3cad-440d-881d-68b54a62c19b" />
                        </td>
                        <td>釜飯丼</td>
                        <td>¥1,000</td>
                        <td>1</td>
                        <td>¥1,000</td>
                        <td>削除</td>
                    </tr>
                    </tbody>
                </v-table>
                </v-col>
            </v-row>
            <v-card-text class="text-right">
                <span class="text-right ma-2 text-h5">合計(税込)</span>
                <span class="text-right ma-2 text-h4"> ¥5,000</span>
            </v-card-text>
            <v-row class="justify-center">
                <v-col class="text-center">
                    <v-btn
                        class="ma-10 text-h5"
                        color="grey-900"
                        size="x-large"
                        rounded
                        width="500"
                    >
                        注文を確定する
                    </v-btn>
                </v-col>
            </v-row>
        </v-card>
      </v-col>
    </v-row>
</template>
<style lang="scss" scoped></style>