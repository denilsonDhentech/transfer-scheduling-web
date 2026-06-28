import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import {
  scheduleTransfer,
  listTransfers,
  simulateTransfer,
  cancelTransfer,
  getTransferById,
  exportTransfers,
} from '../api/transferApi'
import type { TransferRequest, TransferResponse, FeeSimulationResponse } from '../types/transfer'

vi.mock('axios')
const mockedAxios = vi.mocked(axios)

const mockTransferResponse: TransferResponse = {
  id: 1,
  sourceAccount: '1234567890',
  destinationAccount: '0987654321',
  amount: 500,
  fee: 27.5,
  transferDate: '2026-06-27',
  schedulingDate: '2026-06-27',
  status: 'PENDING',
}

const mockTransferRequest: TransferRequest = {
  sourceAccount: '1234567890',
  destinationAccount: '0987654321',
  amount: 500,
  transferDate: '2026-06-27',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('scheduleTransfer', () => {
  it('posts to /transfers and returns the response data', async () => {
    mockedAxios.post.mockResolvedValue({ data: mockTransferResponse })

    const result = await scheduleTransfer(mockTransferRequest)

    expect(mockedAxios.post).toHaveBeenCalledWith('/transfers', mockTransferRequest)
    expect(result).toEqual(mockTransferResponse)
  })

  it('propagates the error when the API returns a failure', async () => {
    const apiError = new Error('Request failed with status code 400')
    mockedAxios.post.mockRejectedValue(apiError)

    await expect(scheduleTransfer(mockTransferRequest)).rejects.toThrow(apiError)
  })
})

describe('listTransfers', () => {
  it('gets /transfers and returns the response data', async () => {
    mockedAxios.get.mockResolvedValue({ data: [mockTransferResponse] })

    const result = await listTransfers()

    expect(mockedAxios.get).toHaveBeenCalledWith('/transfers')
    expect(result).toEqual([mockTransferResponse])
  })

  it('returns an empty array when there are no transfers', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] })

    const result = await listTransfers()

    expect(result).toEqual([])
  })

  it('propagates the error when the API returns a failure', async () => {
    const apiError = new Error('Request failed with status code 500')
    mockedAxios.get.mockRejectedValue(apiError)

    await expect(listTransfers()).rejects.toThrow(apiError)
  })
})

describe('simulateTransfer', () => {
  it('posts to /transfers/simulate and returns fee simulation data', async () => {
    const mockSimulation: FeeSimulationResponse = { fee: 27.5, days: 1 }
    mockedAxios.post.mockResolvedValue({ data: mockSimulation })

    const result = await simulateTransfer(mockTransferRequest)

    expect(mockedAxios.post).toHaveBeenCalledWith('/transfers/simulate', mockTransferRequest)
    expect(result).toEqual(mockSimulation)
  })

  it('propagates the error when the simulation API returns a failure', async () => {
    const apiError = new Error('Request failed with status code 422')
    mockedAxios.post.mockRejectedValue(apiError)

    await expect(simulateTransfer(mockTransferRequest)).rejects.toThrow(apiError)
  })
})

describe('cancelTransfer', () => {
  it('patches /transfers/:id/cancel', async () => {
    mockedAxios.patch.mockResolvedValue({})

    await cancelTransfer(1)

    expect(mockedAxios.patch).toHaveBeenCalledWith('/transfers/1/cancel')
  })

  it('propagates the error when the cancel API returns a failure', async () => {
    const apiError = new Error('Request failed with status code 404')
    mockedAxios.patch.mockRejectedValue(apiError)

    await expect(cancelTransfer(1)).rejects.toThrow(apiError)
  })
})

describe('exportTransfers', () => {
  it('gets /transfers/export with blob responseType and returns the blob', async () => {
    const blob = new Blob(['csv content'], { type: 'text/csv' })
    mockedAxios.get.mockResolvedValue({ data: blob })

    const result = await exportTransfers()

    expect(mockedAxios.get).toHaveBeenCalledWith('/transfers/export', { responseType: 'blob' })
    expect(result).toBe(blob)
  })

  it('propagates the error when the export API returns a failure', async () => {
    const apiError = new Error('Request failed with status code 500')
    mockedAxios.get.mockRejectedValue(apiError)

    await expect(exportTransfers()).rejects.toThrow(apiError)
  })
})

describe('getTransferById', () => {
  it('gets /transfers/:id and returns the transfer', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockTransferResponse })

    const result = await getTransferById(1)

    expect(mockedAxios.get).toHaveBeenCalledWith('/transfers/1')
    expect(result).toEqual(mockTransferResponse)
  })

  it('propagates the error when the transfer is not found', async () => {
    const apiError = new Error('Request failed with status code 404')
    mockedAxios.get.mockRejectedValue(apiError)

    await expect(getTransferById(1)).rejects.toThrow(apiError)
  })
})
