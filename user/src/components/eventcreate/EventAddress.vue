<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit'): void
}>()

const state = reactive({
  postcode: '',
  address: props.modelValue,
  eventName: '',
  eventStartDate:'',
  eventStartHour:'',
  eventStartMinute:'',
  eventEndDate:'',
  eventEndHour:'',
  eventEndMinute:'',
})

const submitSearch = () => {
  emit('update:modelValue', state.address)
  emit('submit')
}
</script>
<template>
  <v-row class="justify-center">
    <v-col cols="10">
      <v-card flat class="pa-3 mt-2">
        <v-form class="multi-col-validation">
          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-list-box-outline" />
            <span>タイトル</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="state.eventName" outlined dense label="イベントタイトル"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-map-marker" />
            <span>会場</span>
          </v-card-title>
          
          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="3">
                <v-text-field v-model="state.postcode" outlined dense label="お届け先 郵便番号"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="state.address" outlined dense label="会場住所"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="6">
                <v-text-field v-model="state.address" outlined dense label="会場名"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="state.address" outlined dense label="会場URL"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-title class="pt-10 px-5">
            <v-icon size="50" class="text--primary me-3" icon="mdi-calendar" />
            <span>開催日時</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="state.eventStartDate"
                  outlined
                  dense
                  label="開始日"
                ></v-text-field>
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="state.eventStartHour"
                  outlined
                  dense
                  label="時間"
                ></v-text-field>
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="state.eventStartMinute"
                  outlined
                  dense
                  label="分"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="state.eventEndDate"
                  outlined
                  dense
                  label="終了日"
                ></v-text-field>
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="state.eventEndHour"
                  outlined
                  dense
                  label="時間"
                ></v-text-field>
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="state.eventEndMinute"
                  outlined
                  dense
                  label="分"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>


          <v-card-text>
            <v-btn color="primary" class="me-3 mt-3" @click="submitSearch"> 検索する </v-btn>
          </v-card-text>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
