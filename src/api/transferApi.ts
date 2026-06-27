import axios from 'axios'
import type { TransferRequest, TransferResponse } from '../types/transfer'

export async function scheduleTransfer(data: TransferRequest): Promise<TransferResponse> {
  const response = await axios.post<TransferResponse>('/transfers', data)
  return response.data
}

export async function listTransfers(): Promise<TransferResponse[]> {
  const response = await axios.get<TransferResponse[]>('/transfers')
  return response.data
}
