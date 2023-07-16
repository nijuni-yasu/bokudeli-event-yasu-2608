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
            <span>お届け先郵便番号</span>
          </v-card-title>

          <v-card-text class="pt-5">
            <v-row class="justify-center">
              <v-col cols="12">
                <v-text-field v-model="optionsLocal.postcode" outlined dense label="お届け先 郵便番号"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text class="pt-5">
            <v-row class="justify-center">
              <v-col cols="12">
                <v-text-field v-model="optionsLocal.address" outlined dense label="お届け先 住所"></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-text>
            <v-btn color="primary" class="me-3 mt-3"> 検索する </v-btn>
          </v-card-text>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped></style>
