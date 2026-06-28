import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TransferList from '../components/TransferList.vue'
import * as transferApi from '../api/transferApi'
import type { TransferResponse } from '../types/transfer'

vi.mock('../api/transferApi')

const mockTransfers: TransferResponse[] = [
  {
    id: 1,
    sourceAccount: '1234567890',
    destinationAccount: '0987654321',
    amount: 500,
    fee: 27.5,
    transferDate: '2026-06-27',
    schedulingDate: '2026-06-27',
    status: 'PENDING',
  },
  {
    id: 2,
    sourceAccount: '1111111111',
    destinationAccount: '2222222222',
    amount: 1000,
    fee: 12,
    transferDate: '2026-07-05',
    schedulingDate: '2026-06-27',
    status: 'EXECUTED',
  },
]

describe('TransferList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls listTransfers on mount', async () => {
    vi.mocked(transferApi.listTransfers).mockResolvedValue([])
    mount(TransferList)
    await flushPromises()

    expect(transferApi.listTransfers).toHaveBeenCalledOnce()
  })

  it('renders a row for each transfer returned by the API', async () => {
    vi.mocked(transferApi.listTransfers).mockResolvedValue(mockTransfers)
    const wrapper = mount(TransferList)
    await flushPromises()

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
  })

  it('displays all column values for a transfer', async () => {
    vi.mocked(transferApi.listTransfers).mockResolvedValue(mockTransfers)
    const wrapper = mount(TransferList)
    await flushPromises()

    const firstRow = wrapper.findAll('tbody tr')[0].text()
    expect(firstRow).toContain('1')
    expect(firstRow).toContain('1234567890')
    expect(firstRow).toContain('0987654321')
    expect(firstRow).toContain('500')
    expect(firstRow).toContain('27')
    expect(firstRow).toContain('27/06/2026')
  })

  it('renders status badge with correct label for each status', async () => {
    vi.mocked(transferApi.listTransfers).mockResolvedValue(mockTransfers)
    const wrapper = mount(TransferList)
    await flushPromises()

    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].find('.status-pending').text()).toBe('Pendente')
    expect(rows[1].find('.status-executed').text()).toBe('Executado')
  })

  it('shows empty state message when there are no transfers', async () => {
    vi.mocked(transferApi.listTransfers).mockResolvedValue([])
    const wrapper = mount(TransferList)
    await flushPromises()

    expect(wrapper.text()).toContain('Nenhum agendamento encontrado')
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('shows error message when the API call fails', async () => {
    vi.mocked(transferApi.listTransfers).mockRejectedValue(new Error('Network Error'))
    const wrapper = mount(TransferList)
    await flushPromises()

    expect(wrapper.text()).toContain('Não foi possível carregar')
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('reloads data when the refresh button is clicked', async () => {
    vi.mocked(transferApi.listTransfers).mockResolvedValue(mockTransfers)
    const wrapper = mount(TransferList)
    await flushPromises()

    await wrapper.find('.refresh-btn').trigger('click')
    await flushPromises()

    expect(transferApi.listTransfers).toHaveBeenCalledTimes(2)
  })

  describe('cancel button', () => {
    it('renders cancel button only for PENDING rows', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(mockTransfers)
      const wrapper = mount(TransferList)
      await flushPromises()

      const rows = wrapper.findAll('tbody tr')
      expect(rows[0].find('.cancel-btn').exists()).toBe(true)
      expect(rows[1].find('.cancel-btn').exists()).toBe(false)
    })

    it('calls cancelTransfer with the correct id when clicked', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(mockTransfers)
      vi.mocked(transferApi.cancelTransfer).mockResolvedValue(undefined)
      const wrapper = mount(TransferList)
      await flushPromises()

      await wrapper.find('.cancel-btn').trigger('click')
      await flushPromises()

      expect(transferApi.cancelTransfer).toHaveBeenCalledWith(1)
    })

    it('refreshes the list after a successful cancellation', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(mockTransfers)
      vi.mocked(transferApi.cancelTransfer).mockResolvedValue(undefined)
      const wrapper = mount(TransferList)
      await flushPromises()

      await wrapper.find('.cancel-btn').trigger('click')
      await flushPromises()

      expect(transferApi.listTransfers).toHaveBeenCalledTimes(2)
    })

    it('shows error message when cancellation returns 404', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(mockTransfers)
      vi.mocked(transferApi.cancelTransfer).mockRejectedValue({ response: { status: 404 } })
      const wrapper = mount(TransferList)
      await flushPromises()

      await wrapper.find('.cancel-btn').trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Agendamento não encontrado')
    })

    it('shows error message when cancellation returns 422', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(mockTransfers)
      vi.mocked(transferApi.cancelTransfer).mockRejectedValue({ response: { status: 422 } })
      const wrapper = mount(TransferList)
      await flushPromises()

      await wrapper.find('.cancel-btn').trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('não pode ser cancelado')
    })

    it('shows fallback error message on unexpected cancellation failure', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(mockTransfers)
      vi.mocked(transferApi.cancelTransfer).mockRejectedValue(new Error('Network Error'))
      const wrapper = mount(TransferList)
      await flushPromises()

      await wrapper.find('.cancel-btn').trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Erro ao cancelar')
    })
  })
})
