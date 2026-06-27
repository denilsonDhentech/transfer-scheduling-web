export interface TransferRequest {
  sourceAccount: string
  destinationAccount: string
  amount: number
  transferDate: string
}

export interface TransferResponse {
  id: number
  sourceAccount: string
  destinationAccount: string
  amount: number
  fee: number
  transferDate: string
  schedulingDate: string
}
