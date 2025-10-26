// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Lock } from 'lucide-react';
import { useRooms } from '@/hooks/useRooms';
import { useCurrency } from '@/hooks/useCurrency';
import { useConfiguration } from '@/hooks/useConfiguration';
import { calculateTaxesAndCharges } from '@/lib/tax-calculator';
import { TaxBreakdownDisplay } from './TaxBreakdownDisplay';
import { useAuth } from '@/hooks/useAuth';

interface RateSelectionComponentProps {
  checkInDate: string;
  checkOutDate: string;
  onRateChange: (rate: number, nights: number, total: number, roomTypeId?: string) => void;
  selectedRoomTypeId?: string;
  defaultRate?: number;
}

export const RateSelectionComponent = ({
  checkInDate,
  checkOutDate,
  onRateChange,
  selectedRoomTypeId,
  defaultRate
}: RateSelectionComponentProps) => {
  const { data: roomsData } = useRooms();
  const { formatPrice } = useCurrency();
  const { configuration } = useConfiguration();
  const { user } = useAuth();
  const [customRate, setCustomRate] = useState(defaultRate?.toString() || '');
  const [selectedRoomType, setSelectedRoomType] = useState(selectedRoomTypeId || '');

  const roomTypes = roomsData?.roomTypes || [];
  
  // Check if user can override rates
  const canOverrideRate = user?.role === 'Owner' || user?.role === 'Manager';

  // Calculate number of nights
  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 1;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, nights);
  };

  const nights = calculateNights();

  // Get selected room type details
  const roomTypeDetails = roomTypes.find(rt => rt.id === selectedRoomType);
  const baseRate = roomTypeDetails ? roomTypeDetails.base_rate : parseFloat(customRate) || 0;

  // F.10.2: Memoize tax calculation to prevent infinite loop
  const taxCalculation = useMemo(() => {
    return calculateTaxesAndCharges({
      baseAmount: baseRate * nights,
      chargeType: 'room',
      isTaxable: true,
      isServiceChargeable: true,
      guestTaxExempt: false,
      configuration: configuration || {
        tax: {
          vat_rate: 7.5,
          service_charge_rate: 10,
          tax_inclusive: false,
          service_charge_inclusive: false,
          vat_applicable_to: ['room', 'food', 'beverage', 'laundry', 'spa'],
          service_applicable_to: ['room', 'food', 'beverage', 'spa']
        }
      } as any
    });
  }, [baseRate, nights, configuration]);

  // Calculate total with taxes
  const totalAmount = taxCalculation.totalAmount;

  // Update parent when values change
  useEffect(() => {
    if (baseRate > 0) {
      onRateChange(baseRate, nights, totalAmount, selectedRoomType || undefined);
    }
  }, [baseRate, nights, totalAmount, selectedRoomType, onRateChange]);

  const handleRoomTypeChange = (roomTypeId: string) => {
    setSelectedRoomType(roomTypeId);
    const roomType = roomTypes.find(rt => rt.id === roomTypeId);
    if (roomType) {
      setCustomRate(roomType.base_rate.toString());
    }
  };

  const handleCustomRateChange = (value: string) => {
    setCustomRate(value);
    const rate = parseFloat(value) || 0;
    onRateChange(rate, nights, rate * nights, selectedRoomType || undefined);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Rate & Stay Duration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stay Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Check-in Date</Label>
            <div className="flex items-center gap-2 mt-1 p-2 bg-muted rounded text-sm">
              <Calendar className="h-3 w-3" />
              {checkInDate || 'Not set'}
            </div>
          </div>
          <div>
            <Label className="text-xs">Check-out Date</Label>
            <div className="flex items-center gap-2 mt-1 p-2 bg-muted rounded text-sm">
              <Calendar className="h-3 w-3" />
              {checkOutDate || 'Not set'}
            </div>
          </div>
        </div>

        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            {nights} night{nights !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Room Type Selection */}
        {roomTypes.length > 0 && (
          <div>
            <Label htmlFor="roomType">Room Type *</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Select a room type to proceed with check-in
            </p>
            <Select value={selectedRoomType} onValueChange={handleRoomTypeChange} required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a room type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((roomType) => (
                  <SelectItem key={roomType.id} value={roomType.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{roomType.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {formatPrice(roomType.base_rate)}/night
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Override Rate Input - Only show for Owner/Manager when room type selected */}
        {selectedRoomType && canOverrideRate && (
          <div>
            <Label htmlFor="customRate">Override Rate (₦/night)</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Change the default room rate if needed
            </p>
            <Input
              id="customRate"
              type="number"
              value={customRate}
              onChange={(e) => handleCustomRateChange(e.target.value)}
              placeholder="Enter custom rate"
              className="mt-1"
              min="0"
              step="100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Default: {formatPrice(roomTypeDetails?.base_rate || 0)}
            </p>
          </div>
        )}

        {/* Rate Summary with Tax Breakdown */}
        {baseRate > 0 && (
          <div className="space-y-3">
            {/* Compact Room Info - Single line */}
            {roomTypeDetails && (
              <div className="p-2 bg-muted rounded-md text-xs text-muted-foreground">
                <span>Max occupancy: {roomTypeDetails.max_occupancy} guest{roomTypeDetails.max_occupancy !== 1 ? 's' : ''}</span>
                <span className="mx-2">•</span>
                <span>{nights} night{nights !== 1 ? 's' : ''} @ {formatPrice(baseRate)}/night</span>
              </div>
            )}

            {/* Tax Breakdown - This shows all the details needed */}
            <TaxBreakdownDisplay
              breakdown={taxCalculation.breakdown}
              totalAmount={taxCalculation.totalAmount}
              showZeroRates={false}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};