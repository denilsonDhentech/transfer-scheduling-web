import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TransferForm from '../components/TransferForm.vue'
import * as transferApi from '../api/transferApi'
import type { TransferResponse, FeeSimulationResponse } from '../types/transfer'

vi.mock('../api/transferApi')

const TODAY = new Date().toISOString().split('T')[0]

const mockResponse: TransferResponse = {
  id: 1,
  sourceAccount: '1234567890',
  destinationAccount: '0987654321',
  amount: 500,
  fee: 27.5,
  transferDate: TODAY,
  schedulingDate: TODAY,
  status: 'PENDING',
}

const mockSimulation: FeeSimulationResponse = {
  fee: 27.5,
  days: 1,
}

async function fillValidForm(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('#sourceAccount').setValue('1234567890')
  await wrapper.find('#destinationAccount').setValue('0987654321')
  await wrapper.find('#amount').setValue('500')
  await wrapper.find('#amount').trigger('input')
  await wrapper.find('#transferDate').setValue(TODAY)
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
    // transferDate defaults to today, so no date error on empty submit
  })

  it('defaults transferDate to today', () => {
    const wrapper = mount(TransferForm)
    const input = wrapper.find('#transferDate').element as HTMLInputElement
    expect(input.value).toBe(TODAY)
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
      transferDate: TODAY,
    })
  })

  it('shows success feedback with amount, masked accounts, fee and scheduling date', async () => {
    vi.mocked(transferApi.scheduleTransfer).mockResolvedValue(mockResponse)
    const wrapper = mount(TransferForm)
    await fillValidForm(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Transferência agendada com sucesso!')
    expect(text).toContain('•••••••890')
    expect(text).toContain('•••••••321')
    expect(text).toContain('500')
    expect(text).toContain('27,50')
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

  describe('simulate button', () => {
    it('renders the simulate button', () => {
      const wrapper = mount(TransferForm)
      expect(wrapper.find('.btn-secondary').exists()).toBe(true)
      expect(wrapper.find('.btn-secondary').text()).toBe('Simular taxa')
    })

    it('does not call simulateTransfer when form is invalid', async () => {
      const wrapper = mount(TransferForm)
      await wrapper.find('.btn-secondary').trigger('click')
      await flushPromises()

      expect(transferApi.simulateTransfer).not.toHaveBeenCalled()
    })

    it('calls simulateTransfer with correct data on valid form', async () => {
      vi.mocked(transferApi.simulateTransfer).mockResolvedValue(mockSimulation)
      const wrapper = mount(TransferForm)
      await fillValidForm(wrapper)
      await wrapper.find('.btn-secondary').trigger('click')
      await flushPromises()

      expect(transferApi.simulateTransfer).toHaveBeenCalledWith({
        sourceAccount: '1234567890',
        destinationAccount: '0987654321',
        amount: 500,
        transferDate: TODAY,
      })
    })

    it('shows simulation result with fee and days', async () => {
      vi.mocked(transferApi.simulateTransfer).mockResolvedValue(mockSimulation)
      const wrapper = mount(TransferForm)
      await fillValidForm(wrapper)
      await wrapper.find('.btn-secondary').trigger('click')
      await flushPromises()

      const text = wrapper.text()
      expect(text).toContain('Simulação de taxa')
      expect(text).toContain('27,50')
      expect(text).toContain('1 dia')
    })

    it('shows simulation error when the API fails', async () => {
      const err = { response: { data: { error: 'Data sem taxa aplicável.' } } }
      vi.mocked(transferApi.simulateTransfer).mockRejectedValue(err)
      const wrapper = mount(TransferForm)
      await fillValidForm(wrapper)
      await wrapper.find('.btn-secondary').trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Data sem taxa aplicável.')
    })

    it('shows fallback simulation error when response has no error body', async () => {
      vi.mocked(transferApi.simulateTransfer).mockRejectedValue(new Error('Network Error'))
      const wrapper = mount(TransferForm)
      await fillValidForm(wrapper)
      await wrapper.find('.btn-secondary').trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Erro ao simular')
    })
  })
})
