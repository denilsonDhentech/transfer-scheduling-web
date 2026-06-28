const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  EXECUTED: 'Executado',
  CANCELLED: 'Cancelado',
}

export function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? status
}

export function maskAccount(account: string): string {
  return '•'.repeat(account.length - 3) + account.slice(-3)
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
