<script setup lang="ts">
const isValid = ref(false)
</script>

<template>
  <v-form v-model="isValid">
    <v-container>
      <v-row> <v-col cols="12"> メッセージ新規作成 </v-col></v-row>
      <v-row>
        <v-col cols="12">
          宛先
          <v-radio-group>
            <v-radio label="全員" value="all"></v-radio>
            <v-radio label="特定の人" value="specific"></v-radio>
          </v-radio-group>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>
