<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { listTransfers, cancelTransfer, exportTransfers } from '../api/transferApi'
import { formatDate, formatCurrency, formatStatus, maskAccount } from '../utils/formatters'
import { showToast } from '../composables/useToast'
import type { TransferResponse, TransferStatus, TransferFilters } from '../types/transfer'
import ConfirmModal from './ConfirmModal.vue'
import EditTransferModal from './EditTransferModal.vue'

type SortKey = keyof TransferResponse
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 10

const transfers = ref<TransferResponse[]>([])
const loading = ref(false)
const fetchError = ref<string | null>(null)
const cancelling = ref<number | null>(null)
const pendingCancelId = ref<number | null>(null)
const pendingEditTransfer = ref<TransferResponse | null>(null)
const sortKey = ref<SortKey>('transferDate')
const sortDir = ref<SortDir>('asc')
const page = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)

const filters = reactive({
  status: '' as TransferStatus | '',
  from: '',
  to: '',
  sourceAccount: '',
  destinationAccount: '',
})

const hasActiveFilters = computed(
  () =>
    filters.status !== '' ||
    filters.from !== '' ||
    filters.to !== '' ||
    filters.sourceAccount !== '' ||
    filters.destinationAccount !== '',
)

const sortedTransfers = computed(() => {
  return [...transfers.value].sort((a, b) => {
    const va = a[sortKey.value]
    const vb = b[sortKey.value]
    if (va < vb) return sortDir.value === 'asc' ? -1 : 1
    if (va > vb) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })
})

function buildParams(): TransferFilters {
  const params: TransferFilters = { page: page.value, size: PAGE_SIZE }
  if (filters.status) params.status = filters.status
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to
  if (filters.sourceAccount) params.sourceAccount = filters.sourceAccount
  if (filters.destinationAccount) params.destinationAccount = filters.destinationAccount
  return params
}

async function fetchTransfers() {
  loading.value = true
  fetchError.value = null
  try {
    const result = await listTransfers(buildParams())
    transfers.value = result.content
    totalPages.value = result.totalPages
    totalElements.value = result.totalElements
  } catch {
    fetchError.value = 'Não foi possível carregar os agendamentos. Tente novamente.'
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  page.value = 0
  fetchTransfers()
}

function clearFilters() {
  filters.status = ''
  filters.from = ''
  filters.to = ''
  filters.sourceAccount = ''
  filters.destinationAccount = ''
  page.value = 0
  fetchTransfers()
}

function goToPage(target: number) {
  page.value = target
  fetchTransfers()
}

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function statusClass(status: TransferStatus): string {
  return `status-${status.toLowerCase()}`
}

function handleEdit(transfer: TransferResponse) {
  pendingEditTransfer.value = transfer
}

async function handleEditSaved() {
  pendingEditTransfer.value = null
  await fetchTransfers()
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

async function handleExport() {
  try {
    const blob = await exportTransfers()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'agendamentos.csv'
    link.click()
    URL.revokeObjectURL(url)
  } catch {
    showToast('Erro ao exportar. Tente novamente.', 'error')
  }
}

onMounted(fetchTransfers)
</script>

<template>
  <div class="transfer-list">
    <div class="list-header">
      <h2>Extrato de Agendamentos</h2>
      <div class="header-actions">
        <button class="export-btn" :disabled="loading || transfers.length === 0" @click="handleExport">
          Exportar CSV
        </button>
        <button class="refresh-btn" :disabled="loading" @click="fetchTransfers">
          {{ loading ? 'Carregando...' : 'Atualizar' }}
        </button>
      </div>
    </div>

    <div class="filter-panel">
      <div class="filter-row">
        <div class="filter-field">
          <label>Status</label>
          <select v-model="filters.status">
            <option value="">Todos</option>
            <option value="PENDING">Pendente</option>
            <option value="EXECUTED">Executado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>
        <div class="filter-field">
          <label>De</label>
          <input type="date" v-model="filters.from" />
        </div>
        <div class="filter-field">
          <label>Até</label>
          <input type="date" v-model="filters.to" />
        </div>
        <div class="filter-field">
          <label>Conta Origem</label>
          <input type="text" v-model="filters.sourceAccount" maxlength="10" placeholder="0000000000" />
        </div>
        <div class="filter-field">
          <label>Conta Destino</label>
          <input type="text" v-model="filters.destinationAccount" maxlength="10" placeholder="0000000000" />
        </div>
      </div>
      <div class="filter-actions">
        <button class="btn-filter" :disabled="loading" @click="applyFilters">Filtrar</button>
        <button class="btn-clear" :disabled="!hasActiveFilters || loading" @click="clearFilters">
          Limpar filtros
        </button>
      </div>
    </div>

    <div v-if="fetchError" class="feedback error-box">{{ fetchError }}</div>

    <div v-if="loading" class="table-wrapper">
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
          <tr v-for="n in 5" :key="n" class="skeleton-row">
            <td><div class="skeleton-bar skeleton-bar--xs"></div></td>
            <td><div class="skeleton-bar skeleton-bar--md"></div></td>
            <td><div class="skeleton-bar skeleton-bar--md"></div></td>
            <td><div class="skeleton-bar skeleton-bar--sm"></div></td>
            <td><div class="skeleton-bar skeleton-bar--sm"></div></td>
            <td><div class="skeleton-bar skeleton-bar--sm"></div></td>
            <td><div class="skeleton-bar skeleton-bar--sm"></div></td>
            <td><div class="skeleton-bar skeleton-bar--badge"></div></td>
            <td><div class="skeleton-bar skeleton-bar--sm"></div></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="!fetchError && transfers.length === 0" class="feedback info-box">
      Nenhum agendamento encontrado.
    </div>

    <div v-else-if="!fetchError && transfers.length > 0" class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th class="sortable" :class="{ 'sort-active': sortKey === 'id', [`sort-${sortDir}`]: sortKey === 'id' }" @click="toggleSort('id')">ID</th>
            <th class="sortable" :class="{ 'sort-active': sortKey === 'sourceAccount', [`sort-${sortDir}`]: sortKey === 'sourceAccount' }" @click="toggleSort('sourceAccount')">Conta Origem</th>
            <th class="sortable" :class="{ 'sort-active': sortKey === 'destinationAccount', [`sort-${sortDir}`]: sortKey === 'destinationAccount' }" @click="toggleSort('destinationAccount')">Conta Destino</th>
            <th class="sortable" :class="{ 'sort-active': sortKey === 'amount', [`sort-${sortDir}`]: sortKey === 'amount' }" @click="toggleSort('amount')">Valor</th>
            <th class="sortable" :class="{ 'sort-active': sortKey === 'fee', [`sort-${sortDir}`]: sortKey === 'fee' }" @click="toggleSort('fee')">Taxa</th>
            <th class="sortable" :class="{ 'sort-active': sortKey === 'transferDate', [`sort-${sortDir}`]: sortKey === 'transferDate' }" @click="toggleSort('transferDate')">Data Transferência</th>
            <th class="sortable" :class="{ 'sort-active': sortKey === 'schedulingDate', [`sort-${sortDir}`]: sortKey === 'schedulingDate' }" @click="toggleSort('schedulingDate')">Data Agendamento</th>
            <th class="sortable" :class="{ 'sort-active': sortKey === 'status', [`sort-${sortDir}`]: sortKey === 'status' }" @click="toggleSort('status')">Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="transfer in sortedTransfers" :key="transfer.id">
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
            <td class="actions-cell">
              <button
                class="edit-btn"
                :disabled="transfer.status !== 'PENDING'"
                :title="transfer.status !== 'PENDING' ? 'Somente agendamentos pendentes podem ser editados' : ''"
                @click="transfer.status === 'PENDING' && handleEdit(transfer)"
              >
                Editar
              </button>
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

    <div v-if="!loading && !fetchError && totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="page === 0" @click="goToPage(page - 1)">Anterior</button>
      <span class="page-info">Página {{ page + 1 }} de {{ totalPages }} ({{ totalElements }} registros)</span>
      <button class="page-btn" :disabled="page >= totalPages - 1" @click="goToPage(page + 1)">Próxima</button>
    </div>
  </div>

  <ConfirmModal
    :open="pendingCancelId !== null"
    title="Cancelar agendamento"
    message="Esta ação não pode ser desfeita. Deseja confirmar o cancelamento?"
    @confirm="confirmCancel"
    @dismiss="dismissModal"
  />

  <EditTransferModal
    :open="pendingEditTransfer !== null"
    :transfer="pendingEditTransfer"
    @saved="handleEditSaved"
    @dismiss="pendingEditTransfer = null"
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

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.export-btn {
  padding: 0.375rem 0.875rem;
  background: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.2s;
}

.export-btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.export-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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

.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 140px;
}

.filter-field label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.filter-field input,
.filter-field select {
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.875rem;
  background: var(--color-surface);
  color: var(--color-text-primary);
  outline: none;
  transition: border-color 0.2s;
}

.filter-field input:focus,
.filter-field select:focus {
  border-color: #3b82f6;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-filter {
  padding: 0.375rem 1rem;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-filter:hover:not(:disabled) {
  background: #2563eb;
}

.btn-filter:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-clear {
  padding: 0.375rem 1rem;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-clear:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.btn-clear:disabled {
  opacity: 0.4;
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

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  color: var(--color-text-primary);
}

.sortable::after {
  content: ' ⇅';
  opacity: 0.3;
  font-size: 0.7rem;
}

.sort-active {
  color: var(--color-text-primary);
}

.sort-active.sort-asc::after {
  content: ' ▲';
  opacity: 1;
}

.sort-active.sort-desc::after {
  content: ' ▼';
  opacity: 1;
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

.actions-cell {
  display: flex;
  gap: 0.375rem;
  align-items: center;
}

.edit-btn {
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.edit-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.08);
}

.edit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.5rem 0;
}

.page-btn {
  padding: 0.375rem 0.875rem;
  background: var(--color-surface-subtle);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.skeleton-row td {
  padding: 0.75rem 0.875rem;
  border-bottom: 1px solid var(--color-border-light);
}

.skeleton-bar {
  height: 0.75rem;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    var(--color-surface-subtle) 25%,
    var(--color-surface-hover) 50%,
    var(--color-surface-subtle) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton-bar--xs    { width: 24px; }
.skeleton-bar--sm    { width: 72px; }
.skeleton-bar--md    { width: 96px; }
.skeleton-bar--badge { width: 56px; height: 1rem; border-radius: 12px; }

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
