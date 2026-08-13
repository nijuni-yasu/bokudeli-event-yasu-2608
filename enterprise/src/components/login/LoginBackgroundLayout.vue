<script setup lang="ts">
import loginBg from '@/assets/images/login/login_bg.png'
</script>

<template>
  <div class="login-background" :style="{ backgroundImage: `url(${loginBg})` }">
    <div class="login-background__overlay" aria-hidden="true" />
    <div class="login-background__content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-background {
  position: relative;
  min-height: 100dvh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.login-background__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
}

.login-background__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  width: 100%;
  padding: 2rem 1.25rem;
}

@media (min-width: 600px) {
  .login-background__content {
    padding: 3rem 2rem;
  }
}
</style>
