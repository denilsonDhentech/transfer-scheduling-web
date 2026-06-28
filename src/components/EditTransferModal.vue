<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { editTransfer } from '../api/transferApi'
import { formatCurrency } from '../utils/formatters'
import { showToast } from '../composables/useToast'
import type { TransferResponse } from '../types/transfer'

const props = defineProps<{
  open: boolean
  transfer: TransferResponse | null
}>()

const emit = defineEmits<{
  saved: [transfer: TransferResponse]
  dismiss: []
}>()

const form = reactive({ amount: '', transferDate: '' })
const errors = reactive({ amount: '', transferDate: '' })
const loading = ref(false)

watch(
  () => props.transfer,
  (t) => {
    if (t) {
      form.amount = String(t.amount)
      form.transferDate = t.transferDate
      errors.amount = ''
      errors.transferDate = ''
    }
  },
  { immediate: true },
)

function localDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function todayLocal(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function validate(): boolean {
  errors.amount = ''
  errors.transferDate = ''

  const amount = parseFloat(form.amount)
  if (isNaN(amount) || amount <= 0) {
    errors.amount = 'O valor deve ser maior que zero.'
  }

  if (!form.transferDate) {
    errors.transferDate = 'Informe a data de transferência.'
  } else {
    const selected = localDate(form.transferDate)
    const start = todayLocal()
    const end = todayLocal()
    end.setDate(end.getDate() + 50)
    if (selected < start || selected > end) {
      errors.transferDate = 'A data deve estar entre hoje e 50 dias à frente.'
    }
  }

  return !errors.amount && !errors.transferDate
}

async function handleSubmit() {
  if (!props.transfer || !validate()) return
  loading.value = true
  try {
    const result = await editTransfer(props.transfer.id, {
      amount: parseFloat(form.amount),
      transferDate: form.transferDate,
    })
    showToast(`Agendamento atualizado. Nova taxa: ${formatCurrency(result.fee)}`, 'success')
    emit('saved', result)
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: Record<string, string>; status?: number } }
    const status = axiosError.response?.status
    const data = axiosError.response?.data
    if (status === 422) {
      showToast(data?.error ?? 'Este agendamento não pode ser editado.', 'error')
    } else if (data?.error) {
      showToast(data.error, 'error')
    } else if (data) {
      showToast(Object.values(data).join(' '), 'error')
    } else {
      showToast('Erro ao atualizar. Tente novamente.', 'error')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="$emit('dismiss')">
      <div class="modal-dialog" role="dialog" aria-modal="true">
        <p class="modal-title">Editar agendamento</p>

        <div class="field">
          <label for="edit-amount">Valor (R$)</label>
          <input
            id="edit-amount"
            v-model="form.amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
          />
          <span v-if="errors.amount" class="field-error">{{ errors.amount }}</span>
        </div>

        <div class="field">
          <label for="edit-date">Data da Transferência</label>
          <input id="edit-date" v-model="form.transferDate" type="date" />
          <span v-if="errors.transferDate" class="field-error">{{ errors.transferDate }}</span>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" :disabled="loading" @click="$emit('dismiss')">Cancelar</button>
          <button class="btn-primary" :disabled="loading" @click="handleSubmit">
            {{ loading ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
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
  gap: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.modal-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.95rem;
  background: var(--color-surface);
  color: var(--color-text-primary);
  outline: none;
  transition: border-color 0.2s;
}

input:focus {
  border-color: #3b82f6;
}

.field-error {
  font-size: 0.78rem;
  color: #dc2626;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-primary {
  padding: 0.5rem 1.25rem;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.5rem 1.25rem;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
