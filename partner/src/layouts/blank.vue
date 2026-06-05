<template>
  <div class="layout-wrapper layout-blank">
    <RouterView #="{ Component }">
      <Suspense :timeout="0">
        <Component :is="Component" />
      </Suspense>
    </RouterView>
  </div>
</template>
