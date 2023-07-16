<script setup lang="ts">
const props = defineProps<{
  informationData: any
}>()

const optionsLocal = ref(JSON.parse(JSON.stringify(props.informationData)))
const resetForm = () => {
  optionsLocal.value = JSON.parse(JSON.stringify(props.informationData))
}
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="10">
      <v-card flat class="pa-3 mt-2">
        <v-form class="multi-col-validation">
          <v-card-title>
            <v-icon size="50" class="text--primary me-3" icon="mdi-chart-timeline-variant" />
            <span>イベント概要</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row class="justify-center">
              <v-col cols="12">
                <v-text-field v-model="optionsLocal.birthday" outlined dense label="イベントタイトル"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea v-model="optionsLocal.bio" outlined rows="3" label="イベント詳細"></v-textarea>
              </v-col>

              <v-col cols="12">
                <v-text-field v-model="optionsLocal.birthday" outlined dense label="お届け先 郵便番号"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field v-model="optionsLocal.birthday" outlined dense label="お届け先 住所"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field v-model="optionsLocal.birthday" outlined dense label="開催日時"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="optionsLocal.birthday" outlined dense label="注文締め切り"></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field v-model="optionsLocal.birthday" outlined dense label="最小人数"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="optionsLocal.birthday" outlined dense label="最大人数"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-title class="mt-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-chart-timeline-variant" />
            <span>コロナ対策</span>
          </v-card-title>

          <!-- Activity -->
          <v-card-text>
            <v-switch hide-details class="mt-0">
              <template #label>
                <span class="text-sm ms-2">Email me when someone comments on my article</span>
              </template>
            </v-switch>

            <v-switch hide-details class="mt-5">
              <template #label>
                <span class="text-sm ms-2">Email me when someone answers on my forum thread</span>
              </template>
            </v-switch>

            <v-switch hide-details class="mt-5">
              <template #label>
                <span class="text-sm ms-2">Email me when someone follows me</span>
              </template>
            </v-switch>
            <v-switch hide-details class="mt-5">
              <template #label>
                <span class="text-sm ms-2">Email me when someone comments on my article</span>
              </template>
            </v-switch>

            <v-switch hide-details class="mt-5">
              <template #label>
                <span class="text-sm ms-2">Email me when someone answers on my forum thread</span>
              </template>
            </v-switch>

            <v-switch hide-details class="my-5">
              <template #label>
                <span class="text-sm ms-2">Email me when someone follows me</span>
              </template>
            </v-switch>
          </v-card-text>
          <v-card-text>
            <v-btn color="primary" class="me-3 mt-3"> Save changes </v-btn>
            <v-btn outlined class="mt-3" color="secondary" type="reset" @click.prevent="resetForm"> Cancel </v-btn>
          </v-card-text>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>
