import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Wrench,
  Lightbulb,
  Thermometer,
  Droplets,
  Zap,
  Tv,
  CheckCircle,
  Camera
} from 'lucide-react';
import { QRSession } from '@/hooks/useQRSession';

interface MaintenanceIssue {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'electrical' | 'plumbing' | 'hvac' | 'appliances' | 'other';
  urgency: 'low' | 'medium' | 'high';
}

interface MaintenanceFlowProps {
  session: QRSession;
  onBack: () => void;
  onRequestCreate: (type: string, data: any) => void;
}

const maintenanceIssues: MaintenanceIssue[] = [
  // Electrical
  {
    id: 'lights-not-working',
    name: 'Lights Not Working',
    description: 'Room lights, bathroom lights, or bedside lamps',
    icon: <Lightbulb className="h-5 w-5" />,
    category: 'electrical',
    urgency: 'medium'
  },
  {
    id: 'power-outlet',
    name: 'Power Outlet Issue',
    description: 'Outlet not working or loose connection',
    icon: <Zap className="h-5 w-5" />,
    category: 'electrical',
    urgency: 'medium'
  },

  // Plumbing
  {
    id: 'water-pressure',
    name: 'Low Water Pressure',
    description: 'Weak water flow in shower or sink',
    icon: <Droplets className="h-5 w-5" />,
    category: 'plumbing',
    urgency: 'low'
  },
  {
    id: 'leaking-tap',
    name: 'Leaking Tap/Shower',
    description: 'Water dripping or continuous flow',
    icon: <Droplets className="h-5 w-5" />,
    category: 'plumbing',
    urgency: 'medium'
  },
  {
    id: 'toilet-issue',
    name: 'Toilet Not Working',
    description: 'Flush not working or toilet clogged',
    icon: <Droplets className="h-5 w-5" />,
    category: 'plumbing',
    urgency: 'high'
  },

  // HVAC
  {
    id: 'ac-not-cooling',
    name: 'AC Not Cooling',
    description: 'Air conditioning not working or not cold enough',
    icon: <Thermometer className="h-5 w-5" />,
    category: 'hvac',
    urgency: 'high'
  },
  {
    id: 'ac-noisy',
    name: 'AC Making Noise',
    description: 'Unusual sounds from air conditioning unit',
    icon: <Thermometer className="h-5 w-5" />,
    category: 'hvac',
    urgency: 'low'
  },

  // Appliances
  {
    id: 'tv-not-working',
    name: 'TV Not Working',
    description: 'Television won\'t turn on or no signal',
    icon: <Tv className="h-5 w-5" />,
    category: 'appliances',
    urgency: 'low'
  },
  {
    id: 'mini-fridge',
    name: 'Mini Fridge Issue',
    description: 'Refrigerator not cooling or making noise',
    icon: <Thermometer className="h-5 w-5" />,
    category: 'appliances',
    urgency: 'medium'
  },

  // Other
  {
    id: 'door-lock',
    name: 'Door Lock Problem',
    description: 'Key card not working or door won\'t lock',
    icon: <Wrench className="h-5 w-5" />,
    category: 'other',
    urgency: 'high'
  },
  {
    id: 'window-issue',
    name: 'Window Won\'t Open/Close',
    description: 'Stuck window or broken latch',
    icon: <Wrench className="h-5 w-5" />,
    category: 'other',
    urgency: 'low'
  }
];

const categories = [
  { id: 'electrical', name: 'Electrical', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'plumbing', name: 'Plumbing', color: 'bg-blue-100 text-blue-700' },
  { id: 'hvac', name: 'HVAC', color: 'bg-green-100 text-green-700' },
  { id: 'appliances', name: 'Appliances', color: 'bg-purple-100 text-purple-700' },
  { id: 'other', name: 'Other', color: 'bg-gray-100 text-gray-700' }
];

const urgencyColors = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700'
};

export const MaintenanceFlow = ({ session, onBack, onRequestCreate }: MaintenanceFlowProps) => {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [customIssue, setCustomIssue] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const selectedIssueData = selectedIssue 
    ? maintenanceIssues.find(issue => issue.id === selectedIssue)
    : null;

  const handleSubmit = async () => {
    if (!selectedIssue && !customIssue.trim()) return;

    setIsSubmitting(true);
    
    try {
      const issueTitle = selectedIssueData ? selectedIssueData.name : customIssue;
      
      await onRequestCreate('maintenance', {
        title: `Maintenance Request - Room ${session.room_id}`,
        issue_type: selectedIssue || 'custom',
        issue_title: issueTitle,
        description: description,
        urgency: urgency,
        category: selectedIssueData?.category || 'other',
        room_id: session.room_id
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit maintenance request:', error);
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
            Your maintenance request has been sent to our technical team. They will contact you shortly.
          </p>
          <div className="bg-muted/50 p-4 rounded-lg mb-6">
            <p className="text-sm">
              <strong>Priority:</strong> {urgency.charAt(0).toUpperCase() + urgency.slice(1)} urgency
            </p>
            <p className="text-sm">
              <strong>Issue:</strong> {selectedIssueData ? selectedIssueData.name : customIssue}
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
            <h1 className="font-semibold">Maintenance Request</h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Room Info */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Wrench className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">Room {session.room_id}</h3>
                <p className="text-sm text-muted-foreground">
                  Report a maintenance issue
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Common Issues */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Common Issues</h2>
          
          {categories.map(category => {
            const categoryIssues = maintenanceIssues.filter(
              issue => issue.category === category.id
            );
            
            return (
              <div key={category.id} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium">{category.name}</h3>
                  <Badge className={category.color} variant="secondary">
                    {categoryIssues.length}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {categoryIssues.map(issue => (
                    <Card 
                      key={issue.id}
                      className={`cursor-pointer transition-colors ${
                        selectedIssue === issue.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        setSelectedIssue(issue.id);
                        setCustomIssue('');
                        setUrgency(issue.urgency);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            checked={selectedIssue === issue.id}
                            onChange={() => setSelectedIssue(issue.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {issue.icon}
                              <h4 className="font-medium">{issue.name}</h4>
                              <Badge className={urgencyColors[issue.urgency]} variant="secondary">
                                {issue.urgency}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {issue.description}
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
        </div>

        {/* Custom Issue */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Or describe your own issue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="radio"
                checked={!selectedIssue && customIssue.trim() !== ''}
                onChange={() => setSelectedIssue(null)}
                className="mt-1"
              />
              <div className="flex-1">
                <Textarea
                  value={customIssue}
                  onChange={(e) => {
                    setCustomIssue(e.target.value);
                    if (e.target.value.trim()) {
                      setSelectedIssue(null);
                    }
                  }}
                  placeholder="Describe the maintenance issue you're experiencing..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Additional Details (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any additional information that might help our maintenance team..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Urgency Level */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>How urgent is this issue?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: 'low', label: 'Low Priority', desc: 'Can wait until regular maintenance hours' },
              { id: 'medium', label: 'Medium Priority', desc: 'Should be addressed today' },
              { id: 'high', label: 'High Priority', desc: 'Needs immediate attention' }
            ].map(option => (
              <div
                key={option.id}
                onClick={() => setUrgency(option.id as any)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  urgency === option.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={urgency === option.id}
                    onChange={() => setUrgency(option.id as any)}
                    className="text-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{option.label}</p>
                      <Badge className={urgencyColors[option.id as keyof typeof urgencyColors]} variant="secondary">
                        {option.id}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{option.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={(!selectedIssue && !customIssue.trim()) || isSubmitting}
          className="w-full h-12"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting Request...
            </>
          ) : (
            <>Submit Maintenance Request</>
          )}
        </Button>

        {(!selectedIssue && !customIssue.trim()) && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            Please select an issue or describe your own to continue
          </p>
        )}

        {/* Emergency Contact */}
        <Card className="mt-4 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-red-100 flex items-center justify-center">
                <span className="text-lg">🚨</span>
              </div>
              <div>
                <h4 className="font-semibold text-red-900">Emergency?</h4>
                <p className="text-sm text-red-700">
                  For urgent issues call front desk immediately
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
