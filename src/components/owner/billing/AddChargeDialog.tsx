import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddChargeDialogProps {
  bill: any;
  onClose: () => void;
}

export default function AddChargeDialog({ bill, onClose }: AddChargeDialogProps) {
  const { toast } = useToast();
  const [chargeData, setChargeData] = useState({
    type: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    isDiscount: false,
    discountPercentage: 0
  });

  // Predefined charges
  const predefinedCharges = [
    { type: 'meals', description: 'Restaurant Meal', unitPrice: 8000 },
    { type: 'minibar', description: 'Minibar Items', unitPrice: 5000 },
    { type: 'laundry', description: 'Laundry Service', unitPrice: 3000 },
    { type: 'conference', description: 'Conference Room', unitPrice: 25000 },
    { type: 'spa', description: 'Spa Services', unitPrice: 15000 },
    { type: 'transport', description: 'Airport Transfer', unitPrice: 20000 },
    { type: 'internet', description: 'Premium Wi-Fi', unitPrice: 2000 },
    { type: 'parking', description: 'Valet Parking', unitPrice: 5000 },
    { type: 'room-service', description: 'Room Service', unitPrice: 4000 },
    { type: 'late-checkout', description: 'Late Checkout Fee', unitPrice: 10000 }
  ];

  const handlePredefinedSelect = (value: string) => {
    const selected = predefinedCharges.find(charge => charge.type === value);
    if (selected) {
      setChargeData({
        ...chargeData,
        type: selected.type,
        description: selected.description,
        unitPrice: selected.unitPrice
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chargeData.description || chargeData.unitPrice <= 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please fill in all required fields with valid values.',
        variant: 'destructive'
      });
      return;
    }

    const totalAmount = chargeData.isDiscount 
      ? -(bill.totalAmount * chargeData.discountPercentage / 100)
      : chargeData.quantity * chargeData.unitPrice;

    // Here you would normally update the bill in your backend
    console.log('Adding charge to bill:', {
      billId: bill.id,
      charge: {
        ...chargeData,
        total: totalAmount
      }
    });

    toast({
      title: 'Charge Added',
      description: `${chargeData.isDiscount ? 'Discount' : 'Charge'} of ₦${Math.abs(totalAmount).toLocaleString()} added successfully.`,
      variant: 'default'
    });

    onClose();
  };

  const calculateTotal = () => {
    if (chargeData.isDiscount) {
      return -(bill.totalAmount * chargeData.discountPercentage / 100);
    }
    return chargeData.quantity * chargeData.unitPrice;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Charge to Bill {bill.id}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Charge Type Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={!chargeData.isDiscount ? "default" : "outline"}
              size="sm"
              onClick={() => setChargeData({...chargeData, isDiscount: false})}
              className="flex-1"
            >
              Add Charge
            </Button>
            <Button
              type="button"
              variant={chargeData.isDiscount ? "default" : "outline"}
              size="sm"
              onClick={() => setChargeData({...chargeData, isDiscount: true})}
              className="flex-1"
            >
              Add Discount
            </Button>
          </div>

          {!chargeData.isDiscount ? (
            <>
              {/* Predefined Charges */}
              <div className="space-y-2">
                <Label>Quick Select</Label>
                <Select onValueChange={handlePredefinedSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose predefined charge" />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedCharges.map(charge => (
                      <SelectItem key={charge.type} value={charge.type}>
                        {charge.description} - ₦{charge.unitPrice.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={chargeData.description}
                  onChange={(e) => setChargeData({...chargeData, description: e.target.value})}
                  placeholder="Enter charge description"
                  required
                />
              </div>

              {/* Quantity and Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={chargeData.quantity}
                    onChange={(e) => setChargeData({...chargeData, quantity: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price (₦)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    value={chargeData.unitPrice}
                    onChange={(e) => setChargeData({...chargeData, unitPrice: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Discount Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Discount Description *</Label>
                <Input
                  id="description"
                  value={chargeData.description}
                  onChange={(e) => setChargeData({...chargeData, description: e.target.value})}
                  placeholder="e.g., Corporate Discount, Early Bird, etc."
                  required
                />
              </div>

              {/* Discount Percentage */}
              <div className="space-y-2">
                <Label htmlFor="discountPercentage">Discount Percentage</Label>
                <div className="relative">
                  <Input
                    id="discountPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={chargeData.discountPercentage}
                    onChange={(e) => setChargeData({...chargeData, discountPercentage: parseFloat(e.target.value) || 0})}
                    placeholder="0.0"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
            </>
          )}

          {/* Total Calculation */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Total {chargeData.isDiscount ? 'Discount' : 'Charge'}:
              </span>
              <span className={`font-bold text-lg ${
                chargeData.isDiscount ? 'text-success' : 'text-foreground'
              }`}>
                {chargeData.isDiscount ? '-' : ''}₦{Math.abs(calculateTotal()).toLocaleString()}
              </span>
            </div>
            {chargeData.isDiscount && (
              <div className="text-sm text-muted-foreground mt-1">
                Applied to current total: ₦{bill.totalAmount.toLocaleString()}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add {chargeData.isDiscount ? 'Discount' : 'Charge'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}