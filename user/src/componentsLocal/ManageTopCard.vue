<script setup lang="ts">
interface Props {
  stepNumber: string
  title: string
  description: string
  imageSrc: string
  buttonText?: string
  buttonLink?: string
  buttonHref?: string
  minHeight?: number
}

defineProps<Props>()
</script>

<template>
  <v-col cols="12" md="3" sm="6" class="pa-2">
    <v-card elevation="0" class="card-bg ma-0 pa-0" :min-height="minHeight">
      <v-card-text class="px-0 text-center card-title">
        <span>{{ stepNumber }}{{ title }}</span>
      </v-card-text>
      <div class="text-center d-flex justify-center">
        <v-img width="110px" height="110px" :src="imageSrc"/>
      </div>
      <v-card-text class="card-description">
        <div v-html="description"/>
      </v-card-text>
      <v-card-text class="d-flex justify-center pa-0">
        <v-btn v-if="buttonLink" class="mb-5" color="primary" variant="outlined" :to="buttonLink">
          {{ buttonText }}
        </v-btn>
        <v-btn v-if="buttonHref" class="mb-5" color="primary" variant="outlined" :href="buttonHref" target="_blank">
          {{ buttonText }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-col>
</template>
<style scoped>
.card-bg {

  background-color: #FAFCFF;
  border: 1px solid #e0e0e0;
}
.card-title {
  font-size:17px;
  font-weight: bold;
}
.card-description {
  font-size:14px;
  line-height: 1.6;
}
</style>

