import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign } from 'lucide-react';
import { useRooms } from '@/hooks/useRooms';
import { useCurrency } from '@/hooks/useCurrency';

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
  const [customRate, setCustomRate] = useState(defaultRate?.toString() || '');
  const [selectedRoomType, setSelectedRoomType] = useState(selectedRoomTypeId || '');

  const roomTypes = roomsData?.roomTypes || [];

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

  // Calculate total
  const totalAmount = baseRate * nights;

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
            <Label htmlFor="roomType">Room Type (Optional)</Label>
            <Select value={selectedRoomType} onValueChange={handleRoomTypeChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select room type or enter custom rate" />
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

        {/* Custom Rate Input */}
        <div>
          <Label htmlFor="customRate">
            {selectedRoomType ? 'Override Rate' : 'Room Rate'} (₦/night)
          </Label>
          <Input
            id="customRate"
            type="number"
            value={customRate}
            onChange={(e) => handleCustomRateChange(e.target.value)}
            placeholder="Enter rate per night"
            className="mt-1"
            min="0"
            step="100"
          />
        </div>

        {/* Rate Summary */}
        {baseRate > 0 && (
          <div className="p-3 bg-primary/5 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Rate per night:</span>
              <span className="font-medium">{formatPrice(baseRate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Number of nights:</span>
              <span className="font-medium">{nights}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total Amount:</span>
              <span className="text-primary">{formatPrice(totalAmount)}</span>
            </div>
            {roomTypeDetails && (
              <div className="text-xs text-muted-foreground">
                Max occupancy: {roomTypeDetails.max_occupancy} guest{roomTypeDetails.max_occupancy !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};