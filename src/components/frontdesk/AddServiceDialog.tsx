import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Sparkles, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useCurrency } from "@/hooks/useCurrency";
import { useConfiguration } from "@/hooks/useConfiguration";
import { calculateTaxesAndCharges } from "@/lib/tax-calculator";
import type { Room } from "./RoomGrid";

interface AddServiceDialogProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (updatedRoom: Room) => void;
}

const SERVICE_CATEGORIES = [
  {
    id: 'minibar',
    name: 'Minibar',
    services: [
      { name: 'Coca Cola', price: 500 },
      { name: 'Water Bottle', price: 300 },
      { name: 'Beer', price: 1000 },
      { name: 'Wine', price: 3000 },
      { name: 'Snacks', price: 800 },
    ]
  },
  {
    id: 'laundry',
    name: 'Laundry',
    services: [
      { name: 'Shirt/Blouse', price: 1500 },
      { name: 'Trousers/Skirt', price: 2000 },
      { name: 'Suit', price: 4000 },
      { name: 'Dress', price: 2500 },
      { name: 'Express Service (same day)', price: 1000 },
    ]
  },
  {
    id: 'room_service',
    name: 'Room Service',
    services: [
      { name: 'Breakfast', price: 5000 },
      { name: 'Lunch', price: 8000 },
      { name: 'Dinner', price: 10000 },
      { name: 'Late Night Snack', price: 3000 },
      { name: 'Coffee/Tea Service', price: 1500 },
    ]
  },
  {
    id: 'housekeeping',
    name: 'Housekeeping',
    services: [
      { name: 'Extra Cleaning', price: 2000 },
      { name: 'Turndown Service', price: 1000 },
      { name: 'Extra Towels', price: 500 },
      { name: 'Extra Bedding', price: 1000 },
      { name: 'Deep Cleaning', price: 5000 },
    ]
  },
  {
    id: 'spa',
    name: 'Spa & Wellness',
    services: [
      { name: 'Massage (1hr)', price: 15000 },
      { name: 'Facial Treatment', price: 12000 },
      { name: 'Manicure', price: 5000 },
      { name: 'Pedicure', price: 6000 },
      { name: 'Spa Package', price: 25000 },
    ]
  },
  {
    id: 'transport',
    name: 'Transportation',
    services: [
      { name: 'Airport Transfer', price: 8000 },
      { name: 'City Tour', price: 15000 },
      { name: 'Car Rental (per day)', price: 20000 },
      { name: 'Taxi Service', price: 3000 },
      { name: 'Uber/Bolt Booking', price: 500 },
    ]
  },
  {
    id: 'other',
    name: 'Other Services',
    services: []
  }
];

interface ServiceItem {
  category: string;
  service: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export const AddServiceDialog = ({
  room,
  open,
  onOpenChange,
  onComplete,
}: AddServiceDialogProps) => {
  const { toast } = useToast();
  const { enabledMethods, getMethodIcon } = usePaymentMethods();
  const { formatPrice } = useCurrency();
  const { configuration } = useConfiguration();
  const [isProcessing, setIsProcessing] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [formData, setFormData] = useState({
    category: '',
    service: '',
    customService: '',
    customPrice: '',
    quantity: '1',
    paymentMethod: '',
    notes: '',
  });

  if (!room) return null;

  const selectedCategory = SERVICE_CATEGORIES.find(cat => cat.id === formData.category);
  const totalAmount = services.reduce((sum, service) => sum + service.totalPrice, 0);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addService = () => {
    if (!formData.category) {
      toast({
        title: "Validation Error",
        description: "Please select a service category",
        variant: "destructive",
      });
      return;
    }

    let serviceName = '';
    let unitPrice = 0;

    if (formData.category === 'other') {
      if (!formData.customService.trim() || !formData.customPrice) {
        toast({
          title: "Validation Error",
          description: "Please enter custom service name and price",
          variant: "destructive",
        });
        return;
      }
      serviceName = formData.customService;
      unitPrice = parseFloat(formData.customPrice);
    } else {
      if (!formData.service) {
        toast({
          title: "Validation Error",
          description: "Please select a service",
          variant: "destructive",
        });
        return;
      }
      
      const categoryServices = selectedCategory?.services || [];
      const selectedService = categoryServices.find(s => s.name === formData.service);
      if (!selectedService) return;
      
      serviceName = selectedService.name;
      unitPrice = selectedService.price;
    }

    const quantity = parseInt(formData.quantity) || 1;
    const newService: ServiceItem = {
      category: selectedCategory?.name || 'Other',
      service: serviceName,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
    };

    setServices(prev => [...prev, newService]);

    // Reset service selection fields
    setFormData(prev => ({
      ...prev,
      service: '',
      customService: '',
      customPrice: '',
      quantity: '1',
    }));
  };

  const removeService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (services.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one service",
        variant: "destructive",
      });
      return;
    }

    if (!formData.paymentMethod) {
      toast({
        title: "Validation Error",
        description: "Payment method is required",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // REAL DB OPERATION: Add charges to folio
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        throw new Error('Tenant ID not found');
      }

      // Get the current reservation and folio for this room
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .select('id, status')
        .eq('room_id', room.id)
        .eq('tenant_id', tenantId)
        .in('status', ['checked_in', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (resError) throw resError;
      if (!reservation) {
        throw new Error('No active reservation found for this room');
      }

      // Get the folio for this reservation
      const { data: folio, error: folioError } = await supabase
        .from('folios')
        .select('id')
        .eq('reservation_id', reservation.id)
        .eq('tenant_id', tenantId)
        .eq('status', 'open')
        .maybeSingle();

      if (folioError) throw folioError;
      if (!folio) {
        throw new Error('No open folio found for this reservation');
      }

      // Insert all service charges WITH TAX CALCULATION
      const charges = services.map(service => {
        // Determine charge type based on category
        const chargeType = service.category.toLowerCase().replace(/\s+/g, '_');
        
        // Calculate taxes
        const taxCalc = calculateTaxesAndCharges({
          baseAmount: service.totalPrice,
          chargeType: chargeType,
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

        return {
          tenant_id: tenantId,
          folio_id: folio.id,
          description: `${service.category} - ${service.service}${service.quantity > 1 ? ` (x${service.quantity})` : ''}`,
          base_amount: taxCalc.baseAmount,
          vat_amount: taxCalc.vatAmount,
          service_charge_amount: taxCalc.serviceChargeAmount,
          amount: taxCalc.totalAmount,
          charge_type: 'service',
          reference_type: 'add_service',
          is_taxable: true,
          is_service_chargeable: true,
          posted_by: user.id,
        };
      });

      const { error: chargesError } = await supabase
        .from('folio_charges')
        .insert(charges);

      if (chargesError) throw chargesError;

      // Get updated folio balance
      const { data: updatedFolio, error: balanceError } = await supabase
        .from('folios')
        .select('balance, total_charges')
        .eq('id', folio.id)
        .single();

      if (balanceError) throw balanceError;
      
      const updatedRoom = {
        ...room,
        folio: {
          balance: updatedFolio.balance || 0,
          isPaid: (updatedFolio.balance || 0) === 0
        }
      };

      onComplete(updatedRoom);

      toast({
        title: "Services Added",
        description: `${services.length} service(s) added to Room ${room.number}. Total: ${formatPrice(totalAmount)}`,
      });

      // Reset form
      setServices([]);
      setFormData({
        category: '',
        service: '',
        customService: '',
        customPrice: '',
        quantity: '1',
        paymentMethod: '',
        notes: '',
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add services. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Add Services
          </DialogTitle>
          <DialogDescription>
            Add services and charges to Room {room.number}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Guest Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Guest:</span>
                <span className="font-medium">{room.guest}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Room:</span>
                <span className="font-medium">{room.number} • {room.type}</span>
              </div>
              {room.folio && (
                <div className="flex justify-between text-sm">
                  <span>Current Balance:</span>
                  <span className="font-medium">{formatPrice(room.folio.balance)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Services */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    min="1"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Service Selection */}
              {formData.category && formData.category !== 'other' && selectedCategory && (
                <div>
                  <Label htmlFor="service">Service</Label>
                  <Select 
                    value={formData.service} 
                    onValueChange={(value) => handleInputChange('service', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCategory.services.map((service) => (
                        <SelectItem key={service.name} value={service.name}>
                          <div className="flex justify-between w-full">
                            <span>{service.name}</span>
                            <span className="ml-4 text-muted-foreground">
                              {formatPrice(service.price)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Custom Service */}
              {formData.category === 'other' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="customService">Service Name</Label>
                    <Input
                      id="customService"
                      value={formData.customService}
                      onChange={(e) => handleInputChange('customService', e.target.value)}
                      placeholder="Enter service name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customPrice">Price (₦)</Label>
                    <Input
                      id="customPrice"
                      type="number"
                      value={formData.customPrice}
                      onChange={(e) => handleInputChange('customPrice', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="100"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              <Button
                type="button"
                onClick={addService}
                variant="outline"
                className="w-full"
                disabled={!formData.category}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Bill
              </Button>
            </CardContent>
          </Card>

          {/* Services List */}
          {services.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Services to Add</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{service.service}</div>
                      <div className="text-xs text-muted-foreground">
                        {service.category} • Qty: {service.quantity} × {formatPrice(service.unitPrice)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatPrice(service.totalPrice)}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeService(index)}
                        className="h-8 w-8 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-primary">{formatPrice(totalAmount)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          {services.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Payment Method *</Label>
                  <Select 
                    value={formData.paymentMethod} 
                    onValueChange={(value) => handleInputChange('paymentMethod', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {enabledMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            {getMethodIcon(method.icon)}
                            <span>{method.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about the services..."
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || services.length === 0}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : `Add Services (${formatPrice(totalAmount)})`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};