import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import TransferList from '../components/TransferList.vue'
import * as transferApi from '../api/transferApi'
import { toasts, clearToasts } from '../composables/useToast'
import type { TransferResponse, PagedResponse } from '../types/transfer'

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

function pagedResult(content: TransferResponse[], extra?: Partial<PagedResponse<TransferResponse>>): PagedResponse<TransferResponse> {
  return {
    content,
    page: 0,
    size: 10,
    totalElements: content.length,
    totalPages: 1,
    ...extra,
  }
}

const confirmModalStub = {
  template: `<div v-if="open">
    <button class="modal-confirm" @click="$emit('confirm')">Confirmar</button>
    <button class="modal-dismiss" @click="$emit('dismiss')">Voltar</button>
  </div>`,
  props: ['open', 'title', 'message'],
  emits: ['confirm', 'dismiss'],
}

const editModalStub = {
  template: `<div v-if="open">
    <button class="edit-modal-save" @click="$emit('saved', transfer)">Salvar</button>
    <button class="edit-modal-dismiss" @click="$emit('dismiss')">Cancelar</button>
  </div>`,
  props: ['open', 'transfer'],
  emits: ['saved', 'dismiss'],
}

function mountWithModal() {
  return mount(TransferList, {
    global: { stubs: { ConfirmModal: confirmModalStub, EditTransferModal: editModalStub } },
  })
}

describe('TransferList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearToasts()
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    URL.revokeObjectURL = vi.fn()
  })

  it('calls listTransfers on mount', async () => {
    vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult([]))
    mount(TransferList, { global: { stubs: { ConfirmModal: true } } })
    await flushPromises()

    expect(transferApi.listTransfers).toHaveBeenCalledOnce()
  })

  it('shows skeleton rows while loading', async () => {
    vi.mocked(transferApi.listTransfers).mockReturnValue(new Promise(() => {}))
    const wrapper = mountWithModal()
    await nextTick()

    expect(wrapper.findAll('.skeleton-row')).toHaveLength(5)
    expect(wrapper.find('table').exists()).toBe(true)
  })

  it('renders a row for each transfer returned by the API', async () => {
    vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
    const wrapper = mountWithModal()
    await flushPromises()

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
  })

  it('displays all column values for a transfer', async () => {
    vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
    const wrapper = mountWithModal()
    await flushPromises()

    const firstRow = wrapper.findAll('tbody tr')[0].text()
    expect(firstRow).toContain('1')
    expect(firstRow).toContain('•••••••890')
    expect(firstRow).toContain('•••••••321')
    expect(firstRow).toContain('500')
    expect(firstRow).toContain('27')
    expect(firstRow).toContain('27/06/2026')
  })

  it('renders status badge with correct label for each status', async () => {
    vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
    const wrapper = mountWithModal()
    await flushPromises()

    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].find('.status-pending').text()).toBe('Pendente')
    expect(rows[1].find('.status-executed').text()).toBe('Executado')
  })

  it('shows empty state message when there are no transfers', async () => {
    vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult([]))
    const wrapper = mountWithModal()
    await flushPromises()

    expect(wrapper.text()).toContain('Nenhum agendamento encontrado')
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('shows error message when the API call fails', async () => {
    vi.mocked(transferApi.listTransfers).mockRejectedValue(new Error('Network Error'))
    const wrapper = mountWithModal()
    await flushPromises()

    expect(wrapper.text()).toContain('Não foi possível carregar')
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('reloads data when the refresh button is clicked', async () => {
    vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
    const wrapper = mountWithModal()
    await flushPromises()

    await wrapper.find('.refresh-btn').trigger('click')
    await flushPromises()

    expect(transferApi.listTransfers).toHaveBeenCalledTimes(2)
  })

  describe('column sorting', () => {
    it('sorts by transferDate ascending by default', async () => {
      const transfers = [
        { ...mockTransfers[0], id: 1, transferDate: '2026-07-10' },
        { ...mockTransfers[1], id: 2, transferDate: '2026-06-30' },
      ]
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(transfers))
      const wrapper = mountWithModal()
      await flushPromises()

      const rows = wrapper.findAll('tbody tr')
      expect(rows[0].text()).toContain('30/06/2026')
      expect(rows[1].text()).toContain('10/07/2026')
    })

    it('reverses order when the active column header is clicked again', async () => {
      const transfers = [
        { ...mockTransfers[0], id: 1, transferDate: '2026-07-10' },
        { ...mockTransfers[1], id: 2, transferDate: '2026-06-30' },
      ]
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(transfers))
      const wrapper = mountWithModal()
      await flushPromises()

      const headers = wrapper.findAll('th')
      await headers[5].trigger('click')

      const rows = wrapper.findAll('tbody tr')
      expect(rows[0].text()).toContain('10/07/2026')
      expect(rows[1].text()).toContain('30/06/2026')
    })

    it('sorts by a different column when its header is clicked', async () => {
      const transfers = [
        { ...mockTransfers[0], id: 2, amount: 200 },
        { ...mockTransfers[1], id: 1, amount: 100 },
      ]
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(transfers))
      const wrapper = mountWithModal()
      await flushPromises()

      const headers = wrapper.findAll('th')
      await headers[0].trigger('click')

      const rows = wrapper.findAll('tbody tr')
      expect(rows[0].text()).toContain('1')
      expect(rows[1].text()).toContain('2')
    })

    it('marks the active sort column with sort-active class', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      const wrapper = mountWithModal()
      await flushPromises()

      const headers = wrapper.findAll('th')
      expect(headers[5].classes()).toContain('sort-active')
    })

    it('adds sort-asc class when sorting ascending', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      const wrapper = mountWithModal()
      await flushPromises()

      const headers = wrapper.findAll('th')
      expect(headers[5].classes()).toContain('sort-asc')
    })

    it('adds sort-desc class when sorting descending', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      const wrapper = mountWithModal()
      await flushPromises()

      const headers = wrapper.findAll('th')
      await headers[5].trigger('click')
      expect(headers[5].classes()).toContain('sort-desc')
    })
  })

  describe('filters', () => {
    it('renders the filter panel', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult([]))
      const wrapper = mountWithModal()
      await flushPromises()

      expect(wrapper.find('.filter-panel').exists()).toBe(true)
      expect(wrapper.find('select').exists()).toBe(true)
      expect(wrapper.find('.btn-filter').exists()).toBe(true)
      expect(wrapper.find('.btn-clear').exists()).toBe(true)
    })

    it('clear button is disabled when no filters are active', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult([]))
      const wrapper = mountWithModal()
      await flushPromises()

      expect((wrapper.find('.btn-clear').element as HTMLButtonElement).disabled).toBe(true)
    })

    it('passes status filter to listTransfers when Filtrar is clicked', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult([]))
      const wrapper = mountWithModal()
      await flushPromises()

      await wrapper.find('select').setValue('PENDING')
      await wrapper.find('.btn-filter').trigger('click')
      await flushPromises()

      expect(transferApi.listTransfers).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'PENDING', page: 0 }),
      )
    })

    it('passes from/to date filters to listTransfers', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult([]))
      const wrapper = mountWithModal()
      await flushPromises()

      const dateInputs = wrapper.findAll('input[type="date"]')
      await dateInputs[0].setValue('2026-07-01')
      await dateInputs[1].setValue('2026-07-31')
      await wrapper.find('.btn-filter').trigger('click')
      await flushPromises()

      expect(transferApi.listTransfers).toHaveBeenLastCalledWith(
        expect.objectContaining({ from: '2026-07-01', to: '2026-07-31' }),
      )
    })

    it('clears all filters and reloads when Limpar is clicked', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult([]))
      const wrapper = mountWithModal()
      await flushPromises()

      await wrapper.find('select').setValue('PENDING')
      await wrapper.find('.btn-filter').trigger('click')
      await flushPromises()

      await wrapper.find('.btn-clear').trigger('click')
      await flushPromises()

      expect(transferApi.listTransfers).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 0 }),
      )
      const lastCall = vi.mocked(transferApi.listTransfers).mock.calls.at(-1)![0]
      expect(lastCall?.status).toBeUndefined()
    })
  })

  describe('pagination', () => {
    it('does not show pagination when there is only one page', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      const wrapper = mountWithModal()
      await flushPromises()

      expect(wrapper.find('.pagination').exists()).toBe(false)
    })

    it('shows pagination controls when totalPages > 1', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(
        pagedResult(mockTransfers, { totalPages: 3, totalElements: 25 }),
      )
      const wrapper = mountWithModal()
      await flushPromises()

      expect(wrapper.find('.pagination').exists()).toBe(true)
      expect(wrapper.find('.page-info').text()).toContain('Página 1 de 3')
      expect(wrapper.find('.page-info').text()).toContain('25 registros')
    })

    it('disables the Anterior button on the first page', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(
        pagedResult(mockTransfers, { totalPages: 3, totalElements: 25 }),
      )
      const wrapper = mountWithModal()
      await flushPromises()

      const [prevBtn] = wrapper.findAll('.page-btn')
      expect((prevBtn.element as HTMLButtonElement).disabled).toBe(true)
    })

    it('disables the Próxima button on the last page', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(
        pagedResult(mockTransfers, { page: 2, totalPages: 3, totalElements: 25 }),
      )
      const wrapper = mountWithModal()
      await flushPromises()

      await wrapper.findAll('.page-btn')[1].trigger('click')
      await wrapper.findAll('.page-btn')[1].trigger('click')
      await flushPromises()

      const pageBtns = wrapper.findAll('.page-btn')
      expect((pageBtns[1].element as HTMLButtonElement).disabled).toBe(true)
    })

    it('calls listTransfers with next page when Próxima is clicked', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(
        pagedResult(mockTransfers, { totalPages: 3, totalElements: 25 }),
      )
      const wrapper = mountWithModal()
      await flushPromises()

      await wrapper.findAll('.page-btn')[1].trigger('click')
      await flushPromises()

      expect(transferApi.listTransfers).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1 }),
      )
    })
  })

  describe('edit button', () => {
    it('renders edit button on every row', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      const wrapper = mountWithModal()
      await flushPromises()

      const rows = wrapper.findAll('tbody tr')
      expect(rows[0].find('.edit-btn').exists()).toBe(true)
      expect(rows[1].find('.edit-btn').exists()).toBe(true)
    })

    it('enables edit button only for PENDING rows', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      const wrapper = mountWithModal()
      await flushPromises()

      const rows = wrapper.findAll('tbody tr')
      expect((rows[0].find('.edit-btn').element as HTMLButtonElement).disabled).toBe(false)
      expect((rows[1].find('.edit-btn').element as HTMLButtonElement).disabled).toBe(true)
    })

    it('shows tooltip on disabled edit button for non-PENDING rows', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      const wrapper = mountWithModal()
      await flushPromises()

      const rows = wrapper.findAll('tbody tr')
      expect(rows[1].find('.edit-btn').attributes('title')).toContain('pendentes')
    })

    it('opens edit modal when edit button is clicked on a PENDING row', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      const wrapper = mountWithModal()
      await flushPromises()

      await wrapper.find('.edit-btn').trigger('click')

      expect(wrapper.find('.edit-modal-save').exists()).toBe(true)
    })

    it('reloads the list when edit modal emits saved', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      const wrapper = mountWithModal()
      await flushPromises()

      await wrapper.find('.edit-btn').trigger('click')
      await wrapper.find('.edit-modal-save').trigger('click')
      await flushPromises()

      expect(transferApi.listTransfers).toHaveBeenCalledTimes(2)
    })

    it('closes edit modal when dismiss is emitted', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      const wrapper = mountWithModal()
      await flushPromises()

      await wrapper.find('.edit-btn').trigger('click')
      await wrapper.find('.edit-modal-dismiss').trigger('click')
      await nextTick()

      expect(wrapper.find('.edit-modal-save').exists()).toBe(false)
    })
  })

  describe('export button', () => {
    it('is disabled when there are no transfers', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult([]))
      const wrapper = mountWithModal()
      await flushPromises()

      const btn = wrapper.find('.export-btn')
      expect((btn.element as HTMLButtonElement).disabled).toBe(true)
    })

    it('is enabled when there are transfers', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      const wrapper = mountWithModal()
      await flushPromises()

      const btn = wrapper.find('.export-btn')
      expect((btn.element as HTMLButtonElement).disabled).toBe(false)
    })

    it('calls exportTransfers and triggers download on click', async () => {
      const blob = new Blob(['csv'], { type: 'text/csv' })
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      vi.mocked(transferApi.exportTransfers).mockResolvedValue(blob)
      const wrapper = mountWithModal()
      await flushPromises()

      await wrapper.find('.export-btn').trigger('click')
      await flushPromises()

      expect(transferApi.exportTransfers).toHaveBeenCalledOnce()
      expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })

    it('shows error toast when export fails', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      vi.mocked(transferApi.exportTransfers).mockRejectedValue(new Error('Network Error'))
      const wrapper = mountWithModal()
      await flushPromises()

      await wrapper.find('.export-btn').trigger('click')
      await flushPromises()

      expect(toasts.value[0].type).toBe('error')
      expect(toasts.value[0].message).toContain('Erro ao exportar')
    })
  })

  describe('cancel button', () => {
    it('renders cancel button on every row', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      const wrapper = mountWithModal()
      await flushPromises()

      const rows = wrapper.findAll('tbody tr')
      expect(rows[0].find('.cancel-btn').exists()).toBe(true)
      expect(rows[1].find('.cancel-btn').exists()).toBe(true)
    })

    it('enables cancel button only for PENDING rows', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      const wrapper = mountWithModal()
      await flushPromises()

      const rows = wrapper.findAll('tbody tr')
      expect((rows[0].find('.cancel-btn').element as HTMLButtonElement).disabled).toBe(false)
      expect((rows[1].find('.cancel-btn').element as HTMLButtonElement).disabled).toBe(true)
    })

    it('shows tooltip on disabled cancel button for non-PENDING rows', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      const wrapper = mountWithModal()
      await flushPromises()

      const rows = wrapper.findAll('tbody tr')
      expect(rows[1].find('.cancel-btn').attributes('title')).toContain('pendentes')
    })

    it('opens confirmation modal when cancel button is clicked', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      const wrapper = mountWithModal()
      await flushPromises()

      await wrapper.find('.cancel-btn').trigger('click')

      expect(wrapper.find('.modal-confirm').exists()).toBe(true)
      expect(transferApi.cancelTransfer).not.toHaveBeenCalled()
    })

    it('does not call cancelTransfer when modal is dismissed', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      const wrapper = mountWithModal()
      await flushPromises()

      await wrapper.find('.cancel-btn').trigger('click')
      await wrapper.find('.modal-dismiss').trigger('click')
      await flushPromises()

      expect(transferApi.cancelTransfer).not.toHaveBeenCalled()
    })

    it('calls cancelTransfer with the correct id when modal is confirmed', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      vi.mocked(transferApi.cancelTransfer).mockResolvedValue(undefined)
      const wrapper = mountWithModal()
      await flushPromises()

      await wrapper.find('.cancel-btn').trigger('click')
      await wrapper.find('.modal-confirm').trigger('click')
      await flushPromises()

      expect(transferApi.cancelTransfer).toHaveBeenCalledWith(1)
    })

    it('refreshes the list and shows success toast after cancellation', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      vi.mocked(transferApi.cancelTransfer).mockResolvedValue(undefined)
      const wrapper = mountWithModal()
      await flushPromises()

      await wrapper.find('.cancel-btn').trigger('click')
      await wrapper.find('.modal-confirm').trigger('click')
      await flushPromises()

      expect(transferApi.listTransfers).toHaveBeenCalledTimes(2)
      expect(toasts.value[0].type).toBe('success')
      expect(toasts.value[0].message).toContain('cancelado com sucesso')
    })

    it('shows error toast when cancellation returns 404', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      vi.mocked(transferApi.cancelTransfer).mockRejectedValue({ response: { status: 404 } })
      const wrapper = mountWithModal()
      await flushPromises()

      await wrapper.find('.cancel-btn').trigger('click')
      await wrapper.find('.modal-confirm').trigger('click')
      await flushPromises()

      expect(toasts.value[0].type).toBe('error')
      expect(toasts.value[0].message).toContain('Agendamento não encontrado')
    })

    it('shows error toast when cancellation returns 422', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      vi.mocked(transferApi.cancelTransfer).mockRejectedValue({ response: { status: 422 } })
      const wrapper = mountWithModal()
      await flushPromises()

      await wrapper.find('.cancel-btn').trigger('click')
      await wrapper.find('.modal-confirm').trigger('click')
      await flushPromises()

      expect(toasts.value[0].type).toBe('error')
      expect(toasts.value[0].message).toContain('não pode ser cancelado')
    })

    it('shows fallback error toast on unexpected cancellation failure', async () => {
      vi.mocked(transferApi.listTransfers).mockResolvedValue(pagedResult(mockTransfers))
      vi.mocked(transferApi.cancelTransfer).mockRejectedValue(new Error('Network Error'))
      const wrapper = mountWithModal()
      await flushPromises()

      await wrapper.find('.cancel-btn').trigger('click')
      await wrapper.find('.modal-confirm').trigger('click')
      await flushPromises()

      expect(toasts.value[0].type).toBe('error')
      expect(toasts.value[0].message).toContain('Erro ao cancelar')
    })
  })
})
