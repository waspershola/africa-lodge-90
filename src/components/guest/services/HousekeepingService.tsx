import React, { useState } from 'react';
import { Home, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HousekeepingServiceProps {
  qrToken: string;
  sessionToken: string;
}

export default function HousekeepingService({ qrToken, sessionToken }: HousekeepingServiceProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const housekeepingOptions = [
    { id: 'room_cleaning', label: 'Room Cleaning', description: 'Full room cleaning service' },
    { id: 'fresh_towels', label: 'Fresh Towels', description: 'Replace towels' },
    { id: 'fresh_linens', label: 'Fresh Bed Linens', description: 'Change bed sheets and pillowcases' },
    { id: 'toiletries', label: 'Toiletries Refill', description: 'Shampoo, soap, toilet paper' },
    { id: 'minibar_restock', label: 'Minibar Restock', description: 'Refill minibar items' },
    { id: 'extra_pillows', label: 'Extra Pillows', description: 'Additional pillows and blankets' },
    { id: 'trash_removal', label: 'Trash Removal', description: 'Empty trash bins' },
    { id: 'vacuum_cleaning', label: 'Vacuum Cleaning', description: 'Vacuum carpets and floors' }
  ];

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const submitRequest = async () => {
    if (selectedServices.length === 0) {
      alert('Please select at least one service');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/qr-guest-portal/guest/qr/${qrToken}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionToken,
          service_type: 'housekeeping',
          request_details: {
            services: selectedServices,
            service_labels: selectedServices.map(s => housekeepingOptions.find(o => o.id === s)?.label).filter(Boolean)
          },
          notes: specialRequests || `Housekeeping request: ${selectedServices.map(s => housekeepingOptions.find(o => o.id === s)?.label).join(', ')}`,
          priority: 1
        })
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting housekeeping request:', error);
      alert('Failed to submit your request. Please try again or contact the front desk.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Request Submitted!</h3>
          <p className="text-muted-foreground">
            Our housekeeping team has been notified and will attend to your room shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Housekeeping Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {housekeepingOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                onClick={() => toggleService(option.id)}
              >
                <Checkbox
                  id={option.id}
                  checked={selectedServices.includes(option.id)}
                  onChange={() => toggleService(option.id)}
                />
                <div className="flex-1">
                  <label htmlFor={option.id} className="font-medium cursor-pointer">
                    {option.label}
                  </label>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Special Requests (Optional)</label>
            <Textarea
              placeholder="Any special instructions or requests..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={3}
            />
          </div>

          <Alert>
            <AlertDescription>
              Housekeeping services are typically completed within 30-60 minutes. You'll receive a notification when complete.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Button 
        onClick={submitRequest}
        disabled={submitting || selectedServices.length === 0}
        className="w-full"
        size="lg"
      >
        {submitting ? 'Submitting Request...' : `Request ${selectedServices.length} Service${selectedServices.length !== 1 ? 's' : ''}`}
      </Button>
    </div>
  );
}