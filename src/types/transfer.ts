export interface TransferRequest {
  sourceAccount: string
  destinationAccount: string
  amount: number
  transferDate: string
}

export type TransferStatus = 'PENDING' | 'EXECUTED' | 'CANCELLED'

export interface TransferResponse {
  id: number
  sourceAccount: string
  destinationAccount: string
  amount: number
  fee: number
  transferDate: string
  schedulingDate: string
  status: TransferStatus
}

export interface FeeSimulationResponse {
  fee: number
  days: number
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface TransferEditRequest {
  amount?: number
  transferDate?: string
}

export interface TransferFilters {
  status?: TransferStatus | ''
  from?: string
  to?: string
  sourceAccount?: string
  destinationAccount?: string
  page?: number
  size?: number
}
