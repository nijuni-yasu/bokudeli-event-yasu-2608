<script setup lang="ts">
interface Props {
  stepNumber: string
  title: string
  description: string
  imageSrc: string
  buttonText?: string
  buttonLink?: string
  buttonHref?: string
}

defineProps<Props>()
</script>

<template>
  <v-col cols="12" md="3" sm="6" class="pa-2">
    <v-card elevation="0" class="card-bg ma-0 pa-0">
      <v-card-text class="px-0 text-center card-title">
        <span>{{ stepNumber }}{{ title }}</span>
      </v-card-text>
      <div class="text-center d-flex justify-center">
        <v-img width="110px" height="110px" :src="imageSrc"/>
      </div>
      <v-card-text class="text-subtitle-2">
        {{ description }}
      </v-card-text>
      <v-card-text class="d-flex justify-center">
        <v-btn v-if="buttonLink" class="ma-1" color="primary" variant="outlined" :to="buttonLink">
          {{ buttonText }}
        </v-btn>
        <v-btn v-if="buttonHref" class="ma-1" color="primary" variant="outlined" :href="buttonHref" target="_blank">
          {{ buttonText }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-col>
</template>
<style scoped>
.card-bg {
  background-color: #F9FbFe;
  border: 1px solid #e0e0e0;
}
.card-title {
  font-size:16px;
  font-weight: bold;
}
</style>

