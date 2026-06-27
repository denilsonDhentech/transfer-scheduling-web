<script setup lang="ts">
import { reactive, ref } from 'vue'
import { scheduleTransfer } from '../api/transferApi'
import { validateTransferForm, hasErrors } from '../utils/transferValidation'
import type { TransferResponse } from '../types/transfer'
import type { FormErrors } from '../utils/transferValidation'

const form = reactive({
  sourceAccount: '',
  destinationAccount: '',
  amount: null as number | null,
  transferDate: '',
})

const errors = ref<FormErrors>({})
const loading = ref(false)
const successResult = ref<TransferResponse | null>(null)
const apiError = ref<string | null>(null)

function onAmountInput(event: Event) {
  const value = (event.target as HTMLInputElement).valueAsNumber
  form.amount = isNaN(value) ? null : value
}

async function handleSubmit() {
  successResult.value = null
  apiError.value = null
  errors.value = validateTransferForm(form)

  if (hasErrors(errors.value)) return

  loading.value = true
  try {
    successResult.value = await scheduleTransfer({
      sourceAccount: form.sourceAccount,
      destinationAccount: form.destinationAccount,
      amount: form.amount!,
      transferDate: form.transferDate,
    })
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

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
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

    <div v-if="apiError" class="feedback error-box">{{ apiError }}</div>

    <div v-if="successResult" class="feedback success-box">
      <p>Transferência agendada com sucesso!</p>
      <p>Taxa: {{ formatCurrency(successResult.fee) }}</p>
      <p>Data de agendamento: {{ formatDate(successResult.schedulingDate) }}</p>
    </div>

    <button type="submit" :disabled="loading">
      {{ loading ? 'Aguardando...' : 'Agendar' }}
    </button>
  </form>
</template>

<style scoped>
.transfer-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  color: #374151;
}

input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
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
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.success-box {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.success-box p {
  margin: 0;
}

button {
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
</style>
