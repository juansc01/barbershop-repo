<template>
  <div id="app-root">
    <ToastNotifications />
    <router-view />
  </div>
</template>

<script>
import ToastNotifications from './components/ui/ToastNotifications.vue'

export default {
  name: 'App',
  components: { ToastNotifications }
}
</script>