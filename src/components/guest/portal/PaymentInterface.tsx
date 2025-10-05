import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Wallet, Banknote, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';

const paymentSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least ₦1').max(1000000, 'Amount too large'),
  paymentMethod: z.enum(['cash', 'card', 'wallet']),
  reference: z.string().optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

interface PaymentInterfaceProps {
  sessionId: string;
  roomNumber?: string;
  suggestedAmount?: number;
  onSuccess?: (receiptId: string) => void;
  onCancel?: () => void;
}

export function PaymentInterface({
  sessionId,
  roomNumber,
  suggestedAmount,
  onSuccess,
  onCancel,
}: PaymentInterfaceProps) {
  const [amount, setAmount] = useState(suggestedAmount?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet'>('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    // Client-side validation
    try {
      const validatedData = paymentSchema.parse({
        amount: parseFloat(amount),
        paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setIsSubmitting(true);

      // Call edge function
      const response = await fetch(
        'https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/qr-unified-api/payment/charge',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-token': sessionId,
          },
          body: JSON.stringify({
            amount: validatedData.amount,
            paymentMethod: validatedData.paymentMethod,
            reference: validatedData.reference,
            notes: validatedData.notes,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment failed');
      }

      const data = await response.json();
      setReceiptId(data.receiptId);
      setSuccess(true);

      // Call success callback after short delay
      setTimeout(() => {
        onSuccess?.(data.receiptId);
      }, 2000);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            errors[error.path[0].toString()] = error.message;
          }
        });
        setValidationErrors(errors);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success && receiptId) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">Payment Submitted</h3>
            <p className="text-sm text-green-700 mt-2">
              Your payment of ₦{parseFloat(amount).toFixed(2)} has been submitted for verification.
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="text-xs text-muted-foreground">Receipt ID</p>
            <p className="font-mono text-sm font-medium">{receiptId}</p>
          </div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              A staff member will verify your payment shortly. You'll receive confirmation once approved.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Make Payment
        </CardTitle>
        <CardDescription>
          Submit a payment for verification
          {roomNumber && ` • Room ${roomNumber}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <Label htmlFor="amount">
              Amount (NGN) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              disabled={isSubmitting}
              className={validationErrors.amount ? 'border-red-500' : ''}
            />
            {validationErrors.amount && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.amount}</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <Label>
              Payment Method <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card' | 'wallet')}
              disabled={isSubmitting}
              className="mt-3 space-y-3"
            >
              <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Banknote className="h-4 w-4 text-green-600" />
                  <span>Cash</span>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span>Card (POS)</span>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Wallet className="h-4 w-4 text-purple-600" />
                  <span>Mobile Wallet</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Reference (optional) */}
          <div>
            <Label htmlFor="reference">Reference/Transaction ID (Optional)</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., Transfer reference or receipt number"
              disabled={isSubmitting}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Provide a transaction reference if available
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information..."
              disabled={isSubmitting}
              maxLength={500}
            />
          </div>

          {/* Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Pending Verification:</strong> All guest payments require staff verification before
              being posted to your folio. Please keep your receipt.
            </AlertDescription>
          </Alert>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1">
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || !amount} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Payment
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
