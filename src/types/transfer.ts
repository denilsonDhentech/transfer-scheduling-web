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
