<script setup lang="ts">
import avatar1 from '@images/avatars/avatar-1.png'

const userId = 'bokudeli'
</script>

<template>
  <v-badge dot location="bottom right" offset-x="3" offset-y="3" color="success">
    <v-avatar class="cursor-pointer" color="primary" variant="tonal">
      <v-img :src="avatar1" />

      <!-- SECTION Menu -->
      <v-menu activator="parent" width="230" location="bottom end" offset="14px">
        <v-list>
          <!-- 👉 User Avatar & Name -->
          <v-list-item>
            <template #prepend>
              <v-list-item-action start>
                <v-badge dot location="bottom right" offset-x="3" offset-y="3" color="success">
                  <v-avatar color="primary" variant="tonal">
                    <v-img :src="avatar1" />
                  </v-avatar>
                </v-badge>
              </v-list-item-action>
            </template>

            <v-list-item-title class="font-weight-medium"> John Doe </v-list-item-title>
            <v-list-item-subtitle>Admin</v-list-item-subtitle>
          </v-list-item>
          <v-divider class="my-2" />

          <!-- 👉 Profile -->
          <v-list-item :to="`/users/${userId}`">
            <template #prepend>
              <VIcon class="me-2" icon="mdi-account-outline" size="22" />
            </template>

            <v-list-item-title>プロフィール</v-list-item-title>
          </v-list-item>

          <!-- Divider -->
          <v-divider class="my-2" />

          <!-- 👉 Logout -->
          <v-list-item to="/login">
            <template #prepend>
              <VIcon class="me-2" icon="mdi-logout" size="22" />
            </template>

            <v-list-item-title>ログアウト</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <!-- !SECTION -->
    </v-avatar>
  </v-badge>
</template>
