import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { scheduleTransfer, listTransfers } from '../api/transferApi'
import type { TransferRequest, TransferResponse } from '../types/transfer'

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
