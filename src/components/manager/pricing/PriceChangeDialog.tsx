import { useState } from 'react';
import { DollarSign, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import type { ServicePricing, PricingChange } from '@/types/pricing';

interface PriceChangeDialogProps {
  trigger: React.ReactNode;
  service?: ServicePricing;
  onSubmit: (change: Partial<PricingChange>) => void;
}

export const PriceChangeDialog = ({ trigger, service, onSubmit }: PriceChangeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    serviceType: service?.serviceType || 'room-service',
    itemName: service?.itemName || '',
    currentPrice: service?.currentPrice || 0,
    proposedPrice: 0,
    reason: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    roomTypes: service?.roomTypeRestrictions || []
  });
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  const changeAmount = formData.proposedPrice - formData.currentPrice;
  const changePercentage = formData.currentPrice > 0 
    ? ((changeAmount / formData.currentPrice) * 100) 
    : 0;

  // Mock delegation rules - these would come from context/props in real app
  const delegationLimits = {
    maxIncreasePercent: 15,
    maxDecreasePercent: 10,
    maxIncreaseAmount: 5000,
    requiresApproval: Math.abs(changePercentage) > 10 || Math.abs(changeAmount) > 2000
  };

  const isWithinLimits = Math.abs(changePercentage) <= delegationLimits.maxIncreasePercent && 
                        Math.abs(changeAmount) <= delegationLimits.maxIncreaseAmount;

  const handleSubmit = () => {
    if (!formData.itemName || !formData.reason || formData.proposedPrice <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive"
      });
      return;
    }

    const change: Partial<PricingChange> = {
      id: `PC-${Date.now()}`,
      serviceType: formData.serviceType as any,
      itemName: formData.itemName,
      currentPrice: formData.currentPrice,
      proposedPrice: formData.proposedPrice,
      changePercentage: changePercentage,
      changeAmount: changeAmount,
      reason: formData.reason,
      requestedBy: 'Current Manager',
      requestedAt: new Date().toISOString(),
      status: isWithinLimits && !delegationLimits.requiresApproval ? 'auto-approved' : 'pending',
      effectiveDate: formData.effectiveDate,
      hotelId: 'hotel-1',
      roomType: formData.roomTypes
    };

    onSubmit(change);

    toast({
      title: isWithinLimits && !delegationLimits.requiresApproval 
        ? "Price Change Applied" 
        : "Price Change Submitted",
      description: isWithinLimits && !delegationLimits.requiresApproval
        ? "Change is within your delegation limits and has been applied immediately."
        : "Change has been queued for owner approval due to delegation limits.",
    });

    setOpen(false);
    setFormData({
      serviceType: 'room-service',
      itemName: '',
      currentPrice: 0,
      proposedPrice: 0,
      reason: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      roomTypes: []
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {service ? `Edit Price - ${service.itemName}` : 'Request Price Change'}
          </DialogTitle>
          <DialogDescription>
            Submit a pricing change request. Changes within delegation limits are auto-approved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-type">Service Type</Label>
                <Select 
                  value={formData.serviceType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, serviceType: value }))}
                  disabled={!!service}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room-service">Room Service</SelectItem>
                    <SelectItem value="housekeeping">Housekeeping</SelectItem>
                    <SelectItem value="spa">Spa Services</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-name">Item/Service Name</Label>
                <Input
                  id="item-name"
                  value={formData.itemName}
                  onChange={(e) => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
                  placeholder="e.g., Club Sandwich, Room Cleaning"
                  disabled={!!service}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current-price">Current Price (₦)</Label>
                <Input
                  id="current-price"
                  type="number"
                  value={formData.currentPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPrice: parseFloat(e.target.value) || 0 }))}
                  disabled={!!service}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposed-price">Proposed Price (₦)</Label>
                <Input
                  id="proposed-price"
                  type="number"
                  value={formData.proposedPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, proposedPrice: parseFloat(e.target.value) || 0 }))}
                  placeholder="Enter new price"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="effective-date">Effective Date</Label>
              <Input
                id="effective-date"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Change Impact */}
          {formData.proposedPrice > 0 && formData.currentPrice > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Change Amount</div>
                  <div className={`font-bold text-lg ${changeAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {changeAmount >= 0 ? '+' : ''}{formatPrice(changeAmount)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Change Percentage</div>
                  <div className={`font-bold text-lg flex items-center justify-center gap-1 ${changePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {changePercentage >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {changePercentage >= 0 ? '+' : ''}{changePercentage.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Approval Status</div>
                  <Badge variant={isWithinLimits && !delegationLimits.requiresApproval ? "default" : "secondary"}>
                    {isWithinLimits && !delegationLimits.requiresApproval ? "Auto-Approved" : "Requires Approval"}
                  </Badge>
                </div>
              </div>

              {/* Delegation Limits Warning */}
              {!isWithinLimits && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This change exceeds your delegation limits (±{delegationLimits.maxIncreasePercent}% or ±₦{delegationLimits.maxIncreaseAmount.toLocaleString()}) 
                    and will require owner approval before taking effect.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Justification */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Price Change *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Please provide a detailed justification for this price change..."
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <DollarSign className="h-4 w-4 mr-2" />
            {isWithinLimits && !delegationLimits.requiresApproval ? 'Apply Change' : 'Submit for Approval'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};