<script setup lang="ts">
defineProps<{ open: boolean; title: string; message: string }>()
defineEmits<{ confirm: []; dismiss: [] }>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="$emit('dismiss')">
      <div class="modal-dialog" role="dialog" aria-modal="true">
        <p class="modal-title">{{ title }}</p>
        <p class="modal-message">{{ message }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="$emit('dismiss')">Voltar</button>
          <button class="btn-danger" @click="$emit('confirm')">Confirmar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-dialog {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.modal-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.modal-message {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.625rem;
  margin-top: 0.25rem;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: var(--color-surface-hover);
}

.btn-danger {
  padding: 0.5rem 1rem;
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-danger:hover {
  background: #b91c1c;
}
</style>
