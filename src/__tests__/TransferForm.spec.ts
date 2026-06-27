import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TransferForm from '../components/TransferForm.vue'
import * as transferApi from '../api/transferApi'
import type { TransferResponse } from '../types/transfer'

vi.mock('../api/transferApi')

function todayStr(): string {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

const mockResponse: TransferResponse = {
  id: 1,
  sourceAccount: '1234567890',
  destinationAccount: '0987654321',
  amount: 500,
  fee: 27.5,
  transferDate: todayStr(),
  schedulingDate: todayStr(),
}

async function fillValidForm(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('#sourceAccount').setValue('1234567890')
  await wrapper.find('#destinationAccount').setValue('0987654321')
  const amountInput = wrapper.find('#amount').element as HTMLInputElement
  Object.defineProperty(amountInput, 'valueAsNumber', { value: 500, configurable: true })
  await wrapper.find('#amount').trigger('input')
  await wrapper.find('#transferDate').setValue(todayStr())
}

describe('TransferForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders all form fields', () => {
    const wrapper = mount(TransferForm)
    expect(wrapper.find('#sourceAccount').exists()).toBe(true)
    expect(wrapper.find('#destinationAccount').exists()).toBe(true)
    expect(wrapper.find('#amount').exists()).toBe(true)
    expect(wrapper.find('#transferDate').exists()).toBe(true)
  })

  it('does not call API when form has validation errors', async () => {
    const wrapper = mount(TransferForm)
    await wrapper.find('form').trigger('submit')

    expect(transferApi.scheduleTransfer).not.toHaveBeenCalled()
  })

  it('shows field error messages when submitting empty form', async () => {
    const wrapper = mount(TransferForm)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('10 dígitos')
    expect(wrapper.text()).toContain('maior que zero')
    expect(wrapper.text()).toContain('data de transferência')
  })

  it('calls scheduleTransfer with correct data on valid submission', async () => {
    vi.mocked(transferApi.scheduleTransfer).mockResolvedValue(mockResponse)
    const wrapper = mount(TransferForm)
    await fillValidForm(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(transferApi.scheduleTransfer).toHaveBeenCalledWith({
      sourceAccount: '1234567890',
      destinationAccount: '0987654321',
      amount: 500,
      transferDate: todayStr(),
    })
  })

  it('shows success feedback with fee and scheduling date after valid submission', async () => {
    vi.mocked(transferApi.scheduleTransfer).mockResolvedValue(mockResponse)
    const wrapper = mount(TransferForm)
    await fillValidForm(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Transferência agendada com sucesso!')
    expect(wrapper.text()).toContain('27,50')
  })

  it('shows API error message when the request fails', async () => {
    const err = { response: { data: { error: 'Não há taxa aplicável para esta data.' } } }
    vi.mocked(transferApi.scheduleTransfer).mockRejectedValue(err)
    const wrapper = mount(TransferForm)
    await fillValidForm(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Não há taxa aplicável para esta data.')
  })

  it('shows fallback error message when response has no error body', async () => {
    vi.mocked(transferApi.scheduleTransfer).mockRejectedValue(new Error('Network Error'))
    const wrapper = mount(TransferForm)
    await fillValidForm(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Erro inesperado')
  })
})
