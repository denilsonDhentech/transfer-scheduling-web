import { describe, it, expect } from 'vitest'
import { validateTransferForm, hasErrors } from '../utils/transferValidation'

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const todayStr = addDays(0)
const in25Days = addDays(25)
const in50Days = addDays(50)
const in51Days = addDays(51)
const yesterday = addDays(-1)

const validForm = {
  sourceAccount: '1234567890',
  destinationAccount: '0987654321',
  amount: 500,
  transferDate: todayStr,
}

describe('validateTransferForm', () => {
  it('returns no errors for a valid form', () => {
    expect(hasErrors(validateTransferForm(validForm))).toBe(false)
  })

  describe('sourceAccount', () => {
    it('returns error when value has fewer than 10 digits', () => {
      const errors = validateTransferForm({ ...validForm, sourceAccount: '12345' })
      expect(errors.sourceAccount).toBeDefined()
    })

    it('returns error when value contains non-numeric characters', () => {
      const errors = validateTransferForm({ ...validForm, sourceAccount: '12345678ab' })
      expect(errors.sourceAccount).toBeDefined()
    })

    it('returns error when value has more than 10 digits', () => {
      const errors = validateTransferForm({ ...validForm, sourceAccount: '12345678901' })
      expect(errors.sourceAccount).toBeDefined()
    })

    it('accepts exactly 10 numeric digits', () => {
      const errors = validateTransferForm({ ...validForm, sourceAccount: '1234567890' })
      expect(errors.sourceAccount).toBeUndefined()
    })
  })

  describe('destinationAccount', () => {
    it('returns error when value is invalid', () => {
      const errors = validateTransferForm({ ...validForm, destinationAccount: '123' })
      expect(errors.destinationAccount).toBeDefined()
    })

    it('accepts exactly 10 numeric digits', () => {
      const errors = validateTransferForm({ ...validForm, destinationAccount: '0987654321' })
      expect(errors.destinationAccount).toBeUndefined()
    })
  })

  describe('amount', () => {
    it('returns error when amount is zero', () => {
      const errors = validateTransferForm({ ...validForm, amount: 0 })
      expect(errors.amount).toBeDefined()
    })

    it('returns error when amount is negative', () => {
      const errors = validateTransferForm({ ...validForm, amount: -10 })
      expect(errors.amount).toBeDefined()
    })

    it('returns error when amount is null', () => {
      const errors = validateTransferForm({ ...validForm, amount: null })
      expect(errors.amount).toBeDefined()
    })

    it('accepts a positive amount', () => {
      const errors = validateTransferForm({ ...validForm, amount: 0.01 })
      expect(errors.amount).toBeUndefined()
    })
  })

  describe('transferDate', () => {
    it('returns error when date is empty', () => {
      const errors = validateTransferForm({ ...validForm, transferDate: '' })
      expect(errors.transferDate).toBeDefined()
    })

    it('returns error when date is in the past', () => {
      const errors = validateTransferForm({ ...validForm, transferDate: yesterday })
      expect(errors.transferDate).toBeDefined()
    })

    it('returns error when date is more than 50 days ahead', () => {
      const errors = validateTransferForm({ ...validForm, transferDate: in51Days })
      expect(errors.transferDate).toBeDefined()
    })

    it('accepts today as a valid date', () => {
      const errors = validateTransferForm({ ...validForm, transferDate: todayStr })
      expect(errors.transferDate).toBeUndefined()
    })

    it('accepts a date 25 days ahead', () => {
      const errors = validateTransferForm({ ...validForm, transferDate: in25Days })
      expect(errors.transferDate).toBeUndefined()
    })

    it('accepts exactly 50 days ahead', () => {
      const errors = validateTransferForm({ ...validForm, transferDate: in50Days })
      expect(errors.transferDate).toBeUndefined()
    })
  })
})
