import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Bed,
  Shirt,
  Coffee,
  Trash,
  CheckCircle
} from 'lucide-react';
import { QRSession } from '@/hooks/useQRSession';

interface HousekeepingItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'cleaning' | 'amenities' | 'laundry';
  estimated_time: number;
}

interface HousekeepingFlowProps {
  session: QRSession;
  onBack: () => void;
  onRequestCreate: (type: string, data: any) => void;
}

const housekeepingServices: HousekeepingItem[] = [
  // Cleaning Services
  {
    id: 'clean-room',
    name: 'Room Cleaning',
    description: 'Full room cleaning service',
    icon: <Bed className="h-5 w-5" />,
    category: 'cleaning',
    estimated_time: 45
  },
  {
    id: 'clean-bathroom',
    name: 'Bathroom Cleaning',
    description: 'Deep clean bathroom and restock supplies',
    icon: <Trash className="h-5 w-5" />,
    category: 'cleaning',
    estimated_time: 30
  },
  {
    id: 'make-bed',
    name: 'Make Bed',
    description: 'Fresh bed making with clean linens',
    icon: <Bed className="h-5 w-5" />,
    category: 'cleaning',
    estimated_time: 15
  },

  // Amenities
  {
    id: 'extra-towels',
    name: 'Extra Towels',
    description: 'Additional bath and hand towels',
    icon: <Shirt className="h-5 w-5" />,
    category: 'amenities',
    estimated_time: 10
  },
  {
    id: 'extra-pillows',
    name: 'Extra Pillows',
    description: 'Additional pillows and pillowcases',
    icon: <Bed className="h-5 w-5" />,
    category: 'amenities',
    estimated_time: 10
  },
  {
    id: 'toiletries',
    name: 'Toiletries Refill',
    description: 'Shampoo, soap, and bathroom supplies',
    icon: <Coffee className="h-5 w-5" />,
    category: 'amenities',
    estimated_time: 5
  },
  {
    id: 'coffee-tea',
    name: 'Coffee & Tea',
    description: 'Room coffee and tea service refill',
    icon: <Coffee className="h-5 w-5" />,
    category: 'amenities',
    estimated_time: 5
  },

  // Laundry
  {
    id: 'laundry-pickup',
    name: 'Laundry Pickup',
    description: 'Collect laundry for washing service',
    icon: <Shirt className="h-5 w-5" />,
    category: 'laundry',
    estimated_time: 10
  },
  {
    id: 'ironing',
    name: 'Ironing Service',
    description: 'Press and iron clothing items',
    icon: <Shirt className="h-5 w-5" />,
    category: 'laundry',
    estimated_time: 30
  }
];

const categories = [
  { id: 'cleaning', name: 'Cleaning', color: 'bg-blue-100 text-blue-700' },
  { id: 'amenities', name: 'Amenities', color: 'bg-green-100 text-green-700' },
  { id: 'laundry', name: 'Laundry', color: 'bg-purple-100 text-purple-700' }
];

export const HousekeepingFlow = ({ session, onBack, onRequestCreate }: HousekeepingFlowProps) => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [preferredTime, setPreferredTime] = useState<'now' | 'later-today' | 'tomorrow'>('now');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const getSelectedServicesData = () => {
    return housekeepingServices.filter(service => selectedServices.includes(service.id));
  };

  const getEstimatedTime = () => {
    const selectedServicesData = getSelectedServicesData();
    if (selectedServicesData.length === 0) return 0;
    return Math.max(...selectedServicesData.map(service => service.estimated_time));
  };

  const handleSubmit = async () => {
    if (selectedServices.length === 0) return;

    setIsSubmitting(true);
    
    try {
      const selectedServicesData = getSelectedServicesData();
      
      await onRequestCreate('housekeeping', {
        title: `Housekeeping Request - Room ${session.room_id}`,
        services: selectedServicesData.map(service => ({
          id: service.id,
          name: service.name,
          category: service.category,
          estimated_time: service.estimated_time
        })),
        special_instructions: specialInstructions,
        preferred_time: preferredTime,
        estimated_completion_time: getEstimatedTime(),
        room_id: session.room_id
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit housekeeping request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Request Submitted!</h1>
          <p className="text-muted-foreground mb-4">
            Your housekeeping request has been sent to our team. They will arrive at your room shortly.
          </p>
          <div className="bg-muted/50 p-4 rounded-lg mb-6">
            <p className="text-sm">
              <strong>Estimated time:</strong> {getEstimatedTime()} minutes
            </p>
            <p className="text-sm">
              <strong>Services:</strong> {getSelectedServicesData().length} requested
            </p>
          </div>
          <Button onClick={onBack} className="w-full">
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="p-4">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="font-semibold">Housekeeping Services</h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Room Info */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Bed className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Room {session.room_id}</h3>
                <p className="text-sm text-muted-foreground">
                  Select the services you need
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Categories */}
        {categories.map(category => {
          const categoryServices = housekeepingServices.filter(
            service => service.category === category.id
          );
          
          return (
            <div key={category.id} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold text-lg">{category.name}</h2>
                <Badge className={category.color}>
                  {categoryServices.filter(s => selectedServices.includes(s.id)).length}/
                  {categoryServices.length}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {categoryServices.map(service => (
                  <Card 
                    key={service.id}
                    className={`cursor-pointer transition-colors ${
                      selectedServices.includes(service.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleService(service.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedServices.includes(service.id)}
                          onChange={() => toggleService(service.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {service.icon}
                            <h3 className="font-medium">{service.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {service.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Estimated time: {service.estimated_time} minutes
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {/* Timing Preference */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>When would you like service?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: 'now', label: 'As soon as possible', desc: 'Within the next hour' },
              { id: 'later-today', label: 'Later today', desc: 'This afternoon or evening' },
              { id: 'tomorrow', label: 'Tomorrow', desc: 'Schedule for tomorrow' }
            ].map(option => (
              <div
                key={option.id}
                onClick={() => setPreferredTime(option.id as any)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  preferredTime === option.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={preferredTime === option.id}
                    onChange={() => setPreferredTime(option.id as any)}
                    className="text-primary"
                  />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Special Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Special Instructions (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any specific requests or areas that need attention..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Summary */}
        {selectedServices.length > 0 && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Request Summary</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Services:</strong> {selectedServices.length} selected</p>
                <p><strong>Estimated time:</strong> {getEstimatedTime()} minutes</p>
                <p><strong>When:</strong> {
                  preferredTime === 'now' ? 'As soon as possible' :
                  preferredTime === 'later-today' ? 'Later today' : 'Tomorrow'
                }</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={selectedServices.length === 0 || isSubmitting}
          className="w-full h-12"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting Request...
            </>
          ) : (
            <>Submit Request ({selectedServices.length} services)</>
          )}
        </Button>

        {selectedServices.length === 0 && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            Please select at least one service to continue
          </p>
        )}
      </div>
    </div>
  );
};