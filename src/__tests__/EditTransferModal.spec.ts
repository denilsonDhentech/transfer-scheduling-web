import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import EditTransferModal from '../components/EditTransferModal.vue'
import * as transferApi from '../api/transferApi'
import { toasts, clearToasts } from '../composables/useToast'
import type { TransferResponse } from '../types/transfer'

vi.mock('../api/transferApi')

const mockTransfer: TransferResponse = {
  id: 1,
  sourceAccount: '1234567890',
  destinationAccount: '0987654321',
  amount: 500,
  fee: 12,
  transferDate: '2026-07-10',
  schedulingDate: '2026-06-28',
  status: 'PENDING',
}

const teleportStub = { template: '<div><slot /></div>' }

function mountModal(props = {}) {
  return mount(EditTransferModal, {
    props: { open: true, transfer: mockTransfer, ...props },
    global: { stubs: { Teleport: teleportStub } },
  })
}

describe('EditTransferModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearToasts()
  })

  it('renders with pre-filled amount and transferDate from the transfer prop', () => {
    const wrapper = mountModal()

    expect((wrapper.find('#edit-amount').element as HTMLInputElement).value).toBe('500')
    expect((wrapper.find('#edit-date').element as HTMLInputElement).value).toBe('2026-07-10')

  })

  it('does not render when open is false', () => {
    const wrapper = mountModal({ open: false })

    expect(wrapper.find('.modal-dialog').exists()).toBe(false)
  })

  it('emits dismiss when Cancelar is clicked', async () => {
    const wrapper = mountModal()

    await wrapper.find('.btn-secondary').trigger('click')

    expect(wrapper.emitted('dismiss')).toBeTruthy()
  })

  it('shows amount error when submitting with empty amount', async () => {
    const wrapper = mountModal()

    await wrapper.find('#edit-amount').setValue('')
    await wrapper.find('.btn-primary').trigger('click')

    expect(wrapper.text()).toContain('maior que zero')
    expect(transferApi.editTransfer).not.toHaveBeenCalled()
  })

  it('shows date error when submitting with empty date', async () => {
    const wrapper = mountModal()

    await wrapper.find('#edit-date').setValue('')
    await wrapper.find('.btn-primary').trigger('click')

    expect(wrapper.text()).toContain('Informe a data')
    expect(transferApi.editTransfer).not.toHaveBeenCalled()
  })

  it('calls editTransfer with the correct data on valid submit', async () => {
    vi.mocked(transferApi.editTransfer).mockResolvedValue({ ...mockTransfer, amount: 800, fee: 12 })
    const wrapper = mountModal()

    await wrapper.find('#edit-amount').setValue('800')
    await wrapper.find('.btn-primary').trigger('click')
    await flushPromises()

    expect(transferApi.editTransfer).toHaveBeenCalledWith(1, {
      amount: 800,
      transferDate: '2026-07-10',
    })
  })

  it('emits saved with the updated transfer on success', async () => {
    const updated = { ...mockTransfer, amount: 800, fee: 12 }
    vi.mocked(transferApi.editTransfer).mockResolvedValue(updated)
    const wrapper = mountModal()

    await wrapper.find('#edit-amount').setValue('800')
    await wrapper.find('.btn-primary').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('saved')).toBeTruthy()
    expect(wrapper.emitted('saved')![0]).toEqual([updated])
  })

  it('shows success toast with new fee on save', async () => {
    const updated = { ...mockTransfer, fee: 27.5 }
    vi.mocked(transferApi.editTransfer).mockResolvedValue(updated)
    const wrapper = mountModal()

    await wrapper.find('.btn-primary').trigger('click')
    await flushPromises()

    expect(toasts.value[0].type).toBe('success')
    expect(toasts.value[0].message).toContain('Nova taxa')
  })

  it('shows error toast on 422 response', async () => {
    vi.mocked(transferApi.editTransfer).mockRejectedValue({
      response: { status: 422, data: { error: 'Only PENDING transfers can be edited' } },
    })
    const wrapper = mountModal()

    await wrapper.find('.btn-primary').trigger('click')
    await flushPromises()

    expect(toasts.value[0].type).toBe('error')
    expect(toasts.value[0].message).toContain('PENDING')
  })

  it('shows error toast on 400 with error field', async () => {
    vi.mocked(transferApi.editTransfer).mockRejectedValue({
      response: { status: 400, data: { error: 'No applicable fee for the given transfer date' } },
    })
    const wrapper = mountModal()

    await wrapper.find('.btn-primary').trigger('click')
    await flushPromises()

    expect(toasts.value[0].type).toBe('error')
    expect(toasts.value[0].message).toContain('applicable fee')
  })

  it('shows fallback error toast on unexpected failure', async () => {
    vi.mocked(transferApi.editTransfer).mockRejectedValue(new Error('Network Error'))
    const wrapper = mountModal()

    await wrapper.find('.btn-primary').trigger('click')
    await flushPromises()

    expect(toasts.value[0].type).toBe('error')
    expect(toasts.value[0].message).toContain('Erro ao atualizar')
  })
})
