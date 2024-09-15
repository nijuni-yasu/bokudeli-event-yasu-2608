<script setup lang="ts">
import { mdiHeartOutline, mdiCheckOutline } from '@mdi/js'
</script>

<template>
  <v-row class="justify-center">
    <v-col cols="12" sm="12" md="9" class="px-0">
      <v-card flat class="mt-2">
        <template v-slot:title>
          <v-icon size="40" class="text--primary me-3" :icon="mdiHeartOutline" />
          <span>{{ $t('home.title1') }}</span>
        </template>
        <template v-slot:text>
          <div v-html="$t('home.message1')"></div>
        </template>
      </v-card>
      <v-card flat class="mt-2">
        <template v-slot:title>
          <v-icon size="40" class="text--primary me-3" :icon="mdiCheckOutline" />
          <span>{{ $t('home.title2') }}</span>
        </template>
        <template v-slot:text>
          <v-table>
            <tbody>
              <tr v-for="(step, i) of $tm('home.todo_list')" :key="`todo_${i}`">
                <td v-html="step[0]"></td>
                <td v-html="step[1]"></td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card>
    </v-col>
  </v-row>
</template>
