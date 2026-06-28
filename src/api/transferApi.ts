import axios from 'axios'
import type { TransferRequest, TransferResponse, FeeSimulationResponse, PagedResponse, TransferFilters, TransferEditRequest } from '../types/transfer'

export async function scheduleTransfer(data: TransferRequest): Promise<TransferResponse> {
  const response = await axios.post<TransferResponse>('/transfers', data)
  return response.data
}

export async function listTransfers(filters?: TransferFilters): Promise<PagedResponse<TransferResponse>> {
  const response = await axios.get<PagedResponse<TransferResponse>>('/transfers', { params: filters })
  return response.data
}

export async function simulateTransfer(data: TransferRequest): Promise<FeeSimulationResponse> {
  const response = await axios.post<FeeSimulationResponse>('/transfers/simulate', data)
  return response.data
}

export async function cancelTransfer(id: number): Promise<void> {
  await axios.patch(`/transfers/${id}/cancel`)
}

export async function getTransferById(id: number): Promise<TransferResponse> {
  const response = await axios.get<TransferResponse>(`/transfers/${id}`)
  return response.data
}

export async function editTransfer(id: number, data: TransferEditRequest): Promise<TransferResponse> {
  const response = await axios.patch<TransferResponse>(`/transfers/${id}`, data)
  return response.data
}

export async function exportTransfers(): Promise<Blob> {
  const response = await axios.get<Blob>('/transfers/export', { responseType: 'blob' })
  return response.data
}
