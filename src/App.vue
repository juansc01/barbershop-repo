<template>
  <div id="app-root">
    <ToastNotifications />
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script>
import ToastNotifications from './components/ui/ToastNotifications.vue'

export default {
  name: 'App',
  components: { ToastNotifications }
}
</script>