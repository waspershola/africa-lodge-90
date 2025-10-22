import React, { useState } from 'react';
import { Wrench, Check, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUnifiedQR } from '@/hooks/useUnifiedQR';
import { SMSOptIn } from '@/components/guest/SMSOptIn';

interface MaintenanceServiceProps {
  qrToken: string;
  sessionToken: string;
}

export default function MaintenanceService({ qrToken, sessionToken }: MaintenanceServiceProps) {
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [smsData, setSmsData] = useState({ phone: '', enabled: false });
  const { createRequest } = useUnifiedQR();

  const issueTypes = [
    { id: 'electrical', label: 'Electrical Issue', description: 'Lights, outlets, switches' },
    { id: 'plumbing', label: 'Plumbing Issue', description: 'Taps, shower, toilet, drainage' },
    { id: 'hvac', label: 'Air Conditioning', description: 'AC not working or temperature issues' },
    { id: 'furniture', label: 'Furniture Problem', description: 'Broken or damaged furniture' },
    { id: 'door_lock', label: 'Door/Lock Issue', description: 'Key card, door handle, lock problems' },
    { id: 'tv_wifi', label: 'TV/Internet', description: 'Television or WiFi connectivity issues' },
    { id: 'cleanliness', label: 'Cleanliness Issue', description: 'Room cleanliness concerns' },
    { id: 'other', label: 'Other Issue', description: 'Something else not listed above' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low Priority', description: 'Can wait until tomorrow' },
    { value: 'normal', label: 'Normal', description: 'Within a few hours' },
    { value: 'urgent', label: 'Urgent', description: 'Needs immediate attention' }
  ];

  const submitRequest = async () => {
    if (!issueType || !description.trim()) {
      alert('Please select an issue type and provide a description');
      return;
    }

    setSubmitting(true);
    try {
      await createRequest.mutateAsync({
        sessionId: sessionToken,
        requestType: 'maintenance',
        requestData: {
          issue_type: issueType,
          issue_label: issueTypes.find(t => t.id === issueType)?.label,
          description: description,
          notes: `${issueTypes.find(t => t.id === issueType)?.label}: ${description}`
        },
        priority: priority,
        smsEnabled: smsData.enabled,
        guestPhone: smsData.enabled ? smsData.phone : undefined,
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
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
          <h3 className="text-lg font-semibold mb-2">Maintenance Request Submitted!</h3>
          <p className="text-muted-foreground mb-4">
            Our maintenance team has been notified and will address your issue based on the priority level.
          </p>
          <div className="text-sm text-muted-foreground">
            {priority === 'urgent' && 'Expected response: Within 30 minutes'}
            {priority === 'normal' && 'Expected response: Within 2-4 hours'}
            {priority === 'low' && 'Expected response: Within 24 hours'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Report Maintenance Issue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">What type of issue are you experiencing?</label>
            <RadioGroup value={issueType} onValueChange={setIssueType}>
              {issueTypes.map((type) => (
                <div key={type.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <RadioGroupItem value={type.id} id={type.id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={type.id} className="font-medium">
                      {type.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description of Issue</label>
            <Textarea
              placeholder="Please describe the problem in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Priority Level</label>
            <RadioGroup value={priority} onValueChange={setPriority}>
              {priorityLevels.map((level) => (
                <div key={level.value} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <RadioGroupItem value={level.value} id={level.value} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={level.value} className="font-medium">
                      {level.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{level.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {priority === 'urgent' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                For true emergencies (fire, medical, security), please call the front desk immediately or use emergency services.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <SMSOptIn value={smsData} onChange={setSmsData} />

      <Button
        onClick={submitRequest}
        disabled={submitting || !issueType || !description.trim()}
        className="w-full"
        size="lg"
      >
        {submitting ? 'Submitting Request...' : 'Submit Maintenance Request'}
      </Button>
    </div>
  );
}