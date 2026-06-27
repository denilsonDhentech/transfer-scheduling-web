<script setup lang="ts">
import TransferForm from '../components/TransferForm.vue'
</script>

<template>
  <div class="view">
    <h1>Agendar Transferência</h1>
    <TransferForm />
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-text-primary);
  width: 100%;
  max-width: 480px;
}
</style>
