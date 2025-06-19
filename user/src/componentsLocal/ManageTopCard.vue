<script setup lang="ts">
interface Props {
  stepNumber: string
  title: string
  description: string
  imageSrc: string
}

defineProps<Props>()
</script>

<template>
  <v-col cols="12" md="3" sm="6" class="">
    <v-card elevation="0" class="card-bg ma-0 pa-0">
      <v-card-text>
        <span class="text-h5 font-weight-bold">{{ stepNumber }} {{ title }}</span>
      </v-card-text>
      <div class="text-center d-flex justify-center">
        <v-img width="150px" height="150px" :src="imageSrc"/>
      </div>
      <v-card-text class="text-subtitle-2">
        {{ description }}
      </v-card-text>
    </v-card>
  </v-col>
</template>
<style scoped>
.card-bg {
  background-color: #F9FbFe;
  /* background-color: #fff; */
  border: 1px solid #e0e0e0;
}
</style>

