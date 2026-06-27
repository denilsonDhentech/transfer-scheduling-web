export interface FormErrors {
  sourceAccount?: string
  destinationAccount?: string
  amount?: string
  transferDate?: string
}

const ACCOUNT_REGEX = /^\d{10}$/

function localDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function todayLocal(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function validateTransferForm(form: {
  sourceAccount: string
  destinationAccount: string
  amount: number | null
  transferDate: string
}): FormErrors {
  const errors: FormErrors = {}

  if (!ACCOUNT_REGEX.test(form.sourceAccount)) {
    errors.sourceAccount = 'Deve ter exatamente 10 dígitos numéricos.'
  }

  if (!ACCOUNT_REGEX.test(form.destinationAccount)) {
    errors.destinationAccount = 'Deve ter exatamente 10 dígitos numéricos.'
  }

  if (!form.amount || form.amount <= 0) {
    errors.amount = 'O valor deve ser maior que zero.'
  }

  if (!form.transferDate) {
    errors.transferDate = 'Informe a data de transferência.'
  } else {
    const selected = localDate(form.transferDate)
    const start = todayLocal()
    const end = todayLocal()
    end.setDate(end.getDate() + 50)

    if (selected < start || selected > end) {
      errors.transferDate = 'A data deve estar entre hoje e 50 dias à frente.'
    }
  }

  return errors
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0
}
