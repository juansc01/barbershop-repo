<template>
  <teleport to="body">
    <div class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="`toast-${toast.type}`"
      >
        <span class="toast-icon">{{ icons[toast.type] }}</span>
        <span>{{ toast.message }}</span>
      </div>
    </div>
  </teleport>
</template>

<script>
import { useToast } from '../../composables/useToast'

export default {
  name: 'ToastNotifications',
  setup() {
    const { toasts } = useToast()
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    }
    return { toasts, icons }
  }
}
</script>

