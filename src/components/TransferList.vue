<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listTransfers } from '../api/transferApi'
import { formatDate, formatCurrency } from '../utils/formatters'
import type { TransferResponse } from '../types/transfer'

const transfers = ref<TransferResponse[]>([])
const loading = ref(false)
const fetchError = ref<string | null>(null)

async function fetchTransfers() {
  loading.value = true
  fetchError.value = null
  try {
    transfers.value = await listTransfers()
  } catch {
    fetchError.value = 'Não foi possível carregar os agendamentos. Tente novamente.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchTransfers)
</script>

<template>
  <div class="transfer-list">
    <div class="list-header">
      <h2>Extrato de Agendamentos</h2>
      <button class="refresh-btn" :disabled="loading" @click="fetchTransfers">
        {{ loading ? 'Carregando...' : 'Atualizar' }}
      </button>
    </div>

    <div v-if="fetchError" class="feedback error-box">{{ fetchError }}</div>

    <div v-else-if="loading" class="feedback info-box">Carregando agendamentos...</div>

    <div v-else-if="transfers.length === 0" class="feedback info-box">
      Nenhum agendamento encontrado.
    </div>

    <div v-else class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Conta Origem</th>
            <th>Conta Destino</th>
            <th>Valor</th>
            <th>Taxa</th>
            <th>Data Transferência</th>
            <th>Data Agendamento</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="transfer in transfers" :key="transfer.id">
            <td>{{ transfer.id }}</td>
            <td>{{ transfer.sourceAccount }}</td>
            <td>{{ transfer.destinationAccount }}</td>
            <td>{{ formatCurrency(transfer.amount) }}</td>
            <td>{{ formatCurrency(transfer.fee) }}</td>
            <td>{{ formatDate(transfer.transferDate) }}</td>
            <td>{{ formatDate(transfer.schedulingDate) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.transfer-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #111827;
}

.refresh-btn {
  padding: 0.375rem 0.875rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.feedback {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.error-box {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.info-box {
  background: #f9fafb;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

thead {
  background: #f3f4f6;
}

th {
  padding: 0.625rem 0.875rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

td {
  padding: 0.625rem 0.875rem;
  color: #111827;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap;
}

tbody tr:hover {
  background: #f9fafb;
}
</style>
