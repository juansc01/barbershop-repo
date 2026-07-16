import { reactive } from 'vue'

const state = reactive({
  toasts: []
})

let id = 0

export function useToast() {
  function show(message, type = 'info', duration = 5000) {
    const toast = { id: ++id, message, type }
    state.toasts.push(toast)
    setTimeout(() => {
      const idx = state.toasts.findIndex(t => t.id === toast.id)
      if (idx > -1) state.toasts.splice(idx, 1)
    }, duration)
  }

  function success(message) { show(message, 'success') }
  function error(message) { show(message, 'error') }
  function warning(message) { show(message, 'warning') }

  return {
    toasts: state.toasts,
    show,
    success,
    error,
    warning
  }
}

