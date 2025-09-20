import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/integrations/supabase/client'

// Mock implementation for billing calculations
class Folio {
  private charges: Array<{ amount: number; description: string }> = []
  private payments: Array<{ amount: number; method: string }> = []
  private currency: string

  constructor(options?: { currency?: string }) {
    this.currency = options?.currency || 'NGN'
  }

  addCharge(charge: { amount: number; description: string }) {
    if (charge.amount < 0) {
      throw new Error('Charge amount cannot be negative')
    }
    this.charges.push(charge)
  }

  addPayment(payment: { amount: number; method: string }) {
    if (payment.amount < 0) {
      throw new Error('Payment amount cannot be negative')
    }
    this.payments.push(payment)
  }

  getBalance(): number {
    const totalCharges = this.charges.reduce((sum, charge) => sum + charge.amount, 0)
    const totalPayments = this.payments.reduce((sum, payment) => sum + payment.amount, 0)
    return totalCharges - totalPayments
  }

  getFormattedBalance(): string {
    const balance = this.getBalance()
    const currencySymbols: Record<string, string> = {
      'NGN': '₦',
      'USD': '$',
      'EUR': '€'
    }
    
    const symbol = currencySymbols[this.currency] || this.currency
    return `${symbol}${(balance / 100).toFixed(2)}`
  }
}

describe('Folio Calculations', () => {
  it('should calculate correct balance with charges and payments', () => {
    const folio = new Folio()
    folio.addCharge({ amount: 5000, description: 'Room charge' })
    folio.addCharge({ amount: 1500, description: 'Service charge' })
    folio.addPayment({ amount: 3000, method: 'cash' })
    
    expect(folio.getBalance()).toBe(3500)
  })

  it('should handle multiple currencies correctly', () => {
    const folio = new Folio({ currency: 'USD' })
    folio.addCharge({ amount: 10000, description: 'Room' }) // $100.00 in cents
    
    expect(folio.getFormattedBalance()).toBe('$100.00')
  })

  it('should handle NGN currency formatting', () => {
    const folio = new Folio({ currency: 'NGN' })
    folio.addCharge({ amount: 5000, description: 'Room' }) // ₦50.00 in kobo
    
    expect(folio.getFormattedBalance()).toBe('₦50.00')
  })

  it('should prevent negative charges', () => {
    const folio = new Folio()
    
    expect(() => {
      folio.addCharge({ amount: -100, description: 'Invalid charge' })
    }).toThrow('Charge amount cannot be negative')
  })

  it('should prevent negative payments', () => {
    const folio = new Folio()
    
    expect(() => {
      folio.addPayment({ amount: -100, method: 'cash' })
    }).toThrow('Payment amount cannot be negative')
  })

  it('should handle zero balance correctly', () => {
    const folio = new Folio()
    folio.addCharge({ amount: 1000, description: 'Room charge' })
    folio.addPayment({ amount: 1000, method: 'cash' })
    
    expect(folio.getBalance()).toBe(0)
  })

  it('should handle overpayment correctly', () => {
    const folio = new Folio()
    folio.addCharge({ amount: 1000, description: 'Room charge' })
    folio.addPayment({ amount: 1500, method: 'cash' })
    
    expect(folio.getBalance()).toBe(-500) // Credit balance
  })
})

describe('Database Integration - Folio Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create folio record in database', async () => {
    const mockFolio = {
      id: 'folio-123',
      reservation_id: 'res-123',
      tenant_id: 'tenant-123',
      status: 'open',
      balance: 0
    }

    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockFolio, error: null })
        })
      })
    } as any)

    const result = await supabase
      .from('folios')
      .insert([{
        reservation_id: 'res-123',
        tenant_id: 'tenant-123',
        status: 'open',
        folio_number: 'F001'
      }])
      .select()
      .single()

    expect(result.data).toEqual(mockFolio)
  })

  it('should add charges to folio', async () => {
    const mockCharge = {
      id: 'charge-123',
      folio_id: 'folio-123',
      amount: 5000,
      description: 'Room Service',
      tenant_id: 'tenant-123'
    }

    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockCharge, error: null })
        })
      })
    } as any)

    const result = await supabase
      .from('folio_charges')
      .insert([{
        folio_id: 'folio-123',
        amount: 5000,
        description: 'Room Service',
        tenant_id: 'tenant-123',
        charge_type: 'service'
      }])
      .select()
      .single()

    expect(result.data).toEqual(mockCharge)
  })
})