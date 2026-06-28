<script setup lang="ts">
import { reactive, ref } from 'vue'
import { scheduleTransfer, simulateTransfer } from '../api/transferApi'
import { validateTransferForm, hasErrors } from '../utils/transferValidation'
import { formatDate, formatCurrency, maskAccount } from '../utils/formatters'
import type { TransferResponse, FeeSimulationResponse } from '../types/transfer'
import type { FormErrors } from '../utils/transferValidation'

function todayISO(): string {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

const form = reactive({
  sourceAccount: '',
  destinationAccount: '',
  amount: null as number | null,
  transferDate: todayISO(),
})

const errors = ref<FormErrors>({})
const loading = ref(false)
const simulationLoading = ref(false)
const successResult = ref<TransferResponse | null>(null)
const simulationResult = ref<FeeSimulationResponse | null>(null)
const apiError = ref<string | null>(null)
const simulationError = ref<string | null>(null)

function onAmountInput(event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value)
  form.amount = isNaN(value) ? null : value
}

function buildRequest() {
  return {
    sourceAccount: form.sourceAccount,
    destinationAccount: form.destinationAccount,
    amount: form.amount!,
    transferDate: form.transferDate,
  }
}

async function handleSimulate() {
  simulationResult.value = null
  simulationError.value = null
  errors.value = validateTransferForm(form)

  if (hasErrors(errors.value)) return

  simulationLoading.value = true
  try {
    simulationResult.value = await simulateTransfer(buildRequest())
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: Record<string, string> } }
    const data = axiosError.response?.data
    simulationError.value = data?.error ?? 'Erro ao simular. Tente novamente.'
  } finally {
    simulationLoading.value = false
  }
}

async function handleSubmit() {
  successResult.value = null
  simulationResult.value = null
  apiError.value = null
  simulationError.value = null
  errors.value = validateTransferForm(form)

  if (hasErrors(errors.value)) return

  loading.value = true
  try {
    successResult.value = await scheduleTransfer(buildRequest())
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: Record<string, string> } }
    const data = axiosError.response?.data

    if (data?.error) {
      apiError.value = data.error
    } else if (data) {
      apiError.value = Object.values(data).join(' ')
    } else {
      apiError.value = 'Erro inesperado. Tente novamente.'
    }
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <form class="transfer-form" @submit.prevent="handleSubmit">
    <div class="field">
      <label for="sourceAccount">Conta de Origem</label>
      <input
        id="sourceAccount"
        v-model="form.sourceAccount"
        type="text"
        maxlength="10"
        placeholder="0000000000"
      />
      <span v-if="errors.sourceAccount" class="field-error">{{ errors.sourceAccount }}</span>
    </div>

    <div class="field">
      <label for="destinationAccount">Conta de Destino</label>
      <input
        id="destinationAccount"
        v-model="form.destinationAccount"
        type="text"
        maxlength="10"
        placeholder="0000000000"
      />
      <span v-if="errors.destinationAccount" class="field-error">{{ errors.destinationAccount }}</span>
    </div>

    <div class="field">
      <label for="amount">Valor (R$)</label>
      <input
        id="amount"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="0,00"
        :value="form.amount ?? ''"
        @input="onAmountInput"
      />
      <span v-if="errors.amount" class="field-error">{{ errors.amount }}</span>
    </div>

    <div class="field">
      <label for="transferDate">Data da Transferência</label>
      <input
        id="transferDate"
        v-model="form.transferDate"
        type="date"
      />
      <span v-if="errors.transferDate" class="field-error">{{ errors.transferDate }}</span>
    </div>

    <div v-if="simulationError" class="feedback error-box">{{ simulationError }}</div>

    <div v-if="simulationResult" class="feedback simulation-box">
      <p class="simulation-title">Simulação de taxa</p>
      <p>Taxa estimada: <strong>{{ formatCurrency(simulationResult.fee) }}</strong></p>
      <p>Prazo: <strong>{{ simulationResult.days }} {{ simulationResult.days === 1 ? 'dia' : 'dias' }}</strong></p>
    </div>

    <div v-if="apiError" class="feedback error-box">{{ apiError }}</div>

    <div v-if="successResult" class="feedback success-box">
      <p class="success-title">Transferência agendada com sucesso!</p>
      <p>Origem: {{ maskAccount(successResult.sourceAccount) }}</p>
      <p>Destino: {{ maskAccount(successResult.destinationAccount) }}</p>
      <p>Valor: {{ formatCurrency(successResult.amount) }}</p>
      <p>Taxa: {{ formatCurrency(successResult.fee) }}</p>
      <p>Data de agendamento: {{ formatDate(successResult.schedulingDate) }}</p>
    </div>

    <div class="form-actions">
      <button type="button" class="btn-secondary" :disabled="simulationLoading || loading" @click="handleSimulate">
        {{ simulationLoading ? 'Simulando...' : 'Simular taxa' }}
      </button>
      <button type="submit" :disabled="loading || simulationLoading">
        {{ loading ? 'Aguardando...' : 'Agendar' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.transfer-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 480px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  background: var(--color-surface);
  color: var(--color-text-primary);
  transition: border-color 0.2s, background 0.2s;
}

input:focus {
  border-color: #3b82f6;
}

.field-error {
  font-size: 0.8rem;
  color: #dc2626;
}

.feedback {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  line-height: 1.6;
}

.error-box {
  background: var(--color-error-bg);
  color: var(--color-error-text);
  border: 1px solid var(--color-error-border);
}

.success-box {
  background: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success-border);
}

.success-box p {
  margin: 0;
}

.success-title {
  font-weight: 600;
  margin-bottom: 0.25rem !important;
}

.simulation-box {
  background: var(--color-info-bg);
  color: var(--color-text-primary);
  border: 1px solid var(--color-info-border);
}

.simulation-box p {
  margin: 0;
}

.simulation-title {
  font-weight: 600;
  margin-bottom: 0.25rem !important;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
}

button {
  flex: 1;
  padding: 0.625rem 1.25rem;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #2563eb;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-surface-hover);
}
</style>
