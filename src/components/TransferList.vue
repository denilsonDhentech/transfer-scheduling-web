<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listTransfers, cancelTransfer } from '../api/transferApi'
import { formatDate, formatCurrency, formatStatus, maskAccount } from '../utils/formatters'
import { showToast } from '../composables/useToast'
import type { TransferResponse, TransferStatus } from '../types/transfer'
import ConfirmModal from './ConfirmModal.vue'

const transfers = ref<TransferResponse[]>([])
const loading = ref(false)
const fetchError = ref<string | null>(null)
const cancelling = ref<number | null>(null)
const pendingCancelId = ref<number | null>(null)

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

function statusClass(status: TransferStatus): string {
  return `status-${status.toLowerCase()}`
}

function handleCancel(id: number) {
  pendingCancelId.value = id
}

function dismissModal() {
  pendingCancelId.value = null
}

async function confirmCancel() {
  if (pendingCancelId.value === null) return
  const id = pendingCancelId.value
  pendingCancelId.value = null
  cancelling.value = id
  try {
    await cancelTransfer(id)
    await fetchTransfers()
    showToast('Agendamento cancelado com sucesso.', 'success')
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: Record<string, string>; status?: number } }
    const status = axiosError.response?.data?.status ?? axiosError.response?.status
    if (status === 404) {
      showToast('Agendamento não encontrado.', 'error')
    } else if (status === 422) {
      showToast('Este agendamento não pode ser cancelado.', 'error')
    } else {
      showToast(axiosError.response?.data?.error ?? 'Erro ao cancelar. Tente novamente.', 'error')
    }
  } finally {
    cancelling.value = null
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

    <div v-if="loading" class="feedback info-box">Carregando agendamentos...</div>

    <div v-else-if="!fetchError && transfers.length === 0" class="feedback info-box">
      Nenhum agendamento encontrado.
    </div>

    <div v-else-if="!fetchError && transfers.length > 0" class="table-wrapper">
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
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="transfer in transfers" :key="transfer.id">
            <td>{{ transfer.id }}</td>
            <td>{{ maskAccount(transfer.sourceAccount) }}</td>
            <td>{{ maskAccount(transfer.destinationAccount) }}</td>
            <td>{{ formatCurrency(transfer.amount) }}</td>
            <td>{{ formatCurrency(transfer.fee) }}</td>
            <td>{{ formatDate(transfer.transferDate) }}</td>
            <td>{{ formatDate(transfer.schedulingDate) }}</td>
            <td>
              <span class="status-badge" :class="statusClass(transfer.status)">
                {{ formatStatus(transfer.status) }}
              </span>
            </td>
            <td>
              <button
                class="cancel-btn"
                :disabled="transfer.status !== 'PENDING' || cancelling === transfer.id"
                :title="transfer.status !== 'PENDING' ? 'Somente agendamentos pendentes podem ser cancelados' : ''"
                @click="transfer.status === 'PENDING' && handleCancel(transfer.id)"
              >
                {{ cancelling === transfer.id ? 'Cancelando...' : 'Cancelar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <ConfirmModal
    :open="pendingCancelId !== null"
    title="Cancelar agendamento"
    message="Esta ação não pode ser desfeita. Deseja confirmar o cancelamento?"
    @confirm="confirmCancel"
    @dismiss="dismissModal"
  />
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
  color: var(--color-text-primary);
}

.refresh-btn {
  padding: 0.375rem 0.875rem;
  background: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
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
  background: var(--color-error-bg);
  color: var(--color-error-text);
  border: 1px solid var(--color-error-border);
}

.info-box {
  background: var(--color-info-bg);
  color: var(--color-info-text);
  border: 1px solid var(--color-info-border);
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
  background: var(--color-surface-subtle);
}

th {
  padding: 0.625rem 0.875rem;
  text-align: left;
  font-weight: 600;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

td {
  padding: 0.625rem 0.875rem;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-light);
  white-space: nowrap;
}

tbody tr:hover {
  background: var(--color-surface-hover);
}

.status-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-pending {
  background: var(--badge-pending-bg);
  color: var(--badge-pending-text);
}

.status-executed {
  background: var(--badge-executed-bg);
  color: var(--badge-executed-text);
}

.status-cancelled {
  background: var(--badge-cancelled-bg);
  color: var(--badge-cancelled-text);
}

.cancel-btn {
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: transparent;
  color: var(--color-error-text);
  border: 1px solid var(--color-error-border);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.cancel-btn:hover:not(:disabled) {
  background: var(--color-error-bg);
}

.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
