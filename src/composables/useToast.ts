import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

export const toasts = ref<Toast[]>([])
let nextId = 0

export function showToast(message: string, type: Toast['type'] = 'info', duration = 4000) {
  const id = ++nextId
  toasts.value.push({ id, message, type })
  setTimeout(() => dismissToast(id), duration)
}

export function dismissToast(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export function clearToasts() {
  toasts.value = []
}
