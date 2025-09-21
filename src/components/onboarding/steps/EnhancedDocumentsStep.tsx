import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, AlertCircle, Download, Eye, Edit3, Plus } from 'lucide-react';
import { OnboardingData } from '../OnboardingWizard';

interface EnhancedDocumentsStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

const defaultTemplates = {
  basic: `HOTEL TERMS AND CONDITIONS

1. CHECK-IN AND CHECK-OUT
- Check-in time is 3:00 PM
- Check-out time is 12:00 PM
- Early check-in and late check-out subject to availability

2. CANCELLATION POLICY
- Cancellations must be made 24 hours before check-in
- No-show bookings will be charged full rate

3. PAYMENT TERMS
- Payment is due at check-in
- We accept cash, credit cards, and bank transfers
- Additional charges may apply for services

4. GUEST RESPONSIBILITIES
- Guests are responsible for any damages to hotel property
- Smoking is prohibited in all rooms
- Noise levels should be kept reasonable

5. LIABILITY
- The hotel is not liable for personal belongings
- Valuables should be stored in room safes
- Report any incidents to front desk immediately

Last updated: ${new Date().toLocaleDateString()}`,

  comprehensive: `COMPREHENSIVE HOTEL TERMS AND CONDITIONS

SECTION 1: RESERVATIONS AND BOOKINGS
1.1 All reservations must be confirmed with valid payment information
1.2 Room rates are subject to change without notice until confirmed
1.3 Special requests are subject to availability and cannot be guaranteed

SECTION 2: CHECK-IN AND CHECK-OUT PROCEDURES
2.1 Standard check-in time is 3:00 PM
2.2 Standard check-out time is 12:00 PM
2.3 Valid government-issued photo identification required at check-in
2.4 Credit card authorization required for incidental charges

SECTION 3: CANCELLATION AND MODIFICATION POLICY
3.1 Standard bookings: 24-hour notice required for cancellation
3.2 Peak season bookings: 72-hour notice required
3.3 Group bookings: Special terms apply (see separate agreement)
3.4 No-show policy: Full night charge applies

SECTION 4: PAYMENT POLICIES
4.1 Payment methods accepted: Cash, major credit cards, bank transfers
4.2 Foreign currency accepted at current exchange rates
4.3 City tax and service charges may apply
4.4 Disputes must be reported within 30 days

SECTION 5: GUEST CONDUCT AND RESPONSIBILITIES
5.1 Quiet hours: 10:00 PM to 7:00 AM
5.2 Maximum occupancy limits strictly enforced
5.3 Smoking policy: Designated areas only
5.4 Pet policy: Prior approval required
5.5 Damages: Guest liable for all damages to hotel property

SECTION 6: HOTEL LIABILITY AND GUEST PROPERTY
6.1 Hotel not liable for personal belongings left in rooms
6.2 Use hotel safe for valuables
6.3 Lost and found items held for 30 days maximum
6.4 Hotel liability limited as per local regulations

SECTION 7: PRIVACY AND DATA PROTECTION
7.1 Guest information used solely for hotel services
7.2 Data shared only as required by law
7.3 Guest consent required for marketing communications

SECTION 8: FORCE MAJEURE
8.1 Hotel not liable for circumstances beyond reasonable control
8.2 Includes natural disasters, government actions, strikes

SECTION 9: GOVERNING LAW
9.1 These terms governed by local jurisdiction laws
9.2 Disputes resolved through local court system

Last updated: ${new Date().toLocaleDateString()}
Hotel Management reserves the right to modify these terms at any time.`,

  luxury: `LUXURY HOTEL TERMS AND CONDITIONS

WELCOME TO OUR DISTINGUISHED ESTABLISHMENT

ARTICLE I: RESERVATIONS AND GUEST SERVICES
Our commitment to excellence begins with your reservation. All bookings are confirmed upon receipt of deposit and completion of guest registration.

ARTICLE II: ARRIVAL AND DEPARTURE
• Arrival: 4:00 PM (Express check-in available for suite guests)
• Departure: 12:00 PM (Late checkout complimentary for premium guests)
• Concierge services available 24/7 for all guest needs

ARTICLE III: ACCOMMODATION STANDARDS
• All accommodations maintained to the highest luxury standards
• Daily housekeeping service included
• 24-hour room service available
• Premium amenities provided in all rooms

ARTICLE IV: CANCELLATION TERMS
• Flexible cancellation up to 48 hours before arrival
• Premium suite bookings: 72-hour notice required
• Peak season and special events: 7-day notice required
• Deposit fully refundable within cancellation period

ARTICLE V: GUEST PRIVILEGES AND RESPONSIBILITIES
• Access to all hotel facilities and services
• Respect for other guests and hotel property expected
• Compliance with hotel policies and local regulations required
• Any damages will be charged to guest account

ARTICLE VI: CONCIERGE AND PREMIUM SERVICES
• Personal concierge for premium guests
• Dining reservations and event planning
• Transportation arrangements available
• Cultural and entertainment recommendations

ARTICLE VII: PRIVACY AND DISCRETION
• Utmost discretion maintained for all guests
• Personal information protected per privacy policies
• Special arrangements for high-profile guests available

By confirming your reservation, you agree to these terms and conditions.

${new Date().toLocaleDateString()}
Management Team`
};

export function EnhancedDocumentsStep({ data, updateData }: EnhancedDocumentsStepProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof defaultTemplates>('basic');
  const [customTerms, setCustomTerms] = useState(defaultTemplates[selectedTemplate]);
  const [showTermsEditor, setShowTermsEditor] = useState(false);
  const [useCustomDocument, setUseCustomDocument] = useState(false);

  const updateDocuments = (field: string, value: any) => {
    updateData({
      documents: {
        ...data.documents,
        [field]: value,
      },
    });
  };

  const handlePolicyUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    updateDocuments('policies', [...data.documents.policies, ...files]);
  };

  const removePolicyFile = (index: number) => {
    const newPolicies = data.documents.policies.filter((_, i) => i !== index);
    updateDocuments('policies', newPolicies);
  };

  const handleTemplateChange = (template: keyof typeof defaultTemplates) => {
    setSelectedTemplate(template);
    setCustomTerms(defaultTemplates[template]);
    setUseCustomDocument(false);
  };

  const handleCustomTermsUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCustomTerms(content);
        setUseCustomDocument(true);
      };
      reader.readAsText(file);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([customTerms], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotel-terms-${selectedTemplate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Documents & Policies</h3>
        <p className="text-muted-foreground">
          Set up your hotel policies and legal documents
        </p>
      </div>

      <Tabs defaultValue="policies" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="policies">Hotel Policies</TabsTrigger>
          <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Upload Hotel Policies</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload your hotel's policies such as check-in rules, cancellation policy, 
                  refund policy, house rules, etc. These will be available to staff and guests.
                </AlertDescription>
              </Alert>

              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center space-y-4">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <div>
                    <h4 className="font-medium mb-1">Upload Policy Documents</h4>
                    <p className="text-sm text-muted-foreground">
                      PDF, DOC, or DOCX files. Multiple files accepted.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="policyUpload">
                      <Button variant="outline" className="cursor-pointer">
                        Choose Files
                      </Button>
                    </Label>
                    <Input
                      id="policyUpload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      multiple
                      onChange={handlePolicyUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {data.documents.policies.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Policy Files:</Label>
                  {data.documents.policies.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePolicyFile(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-800 mb-2">Recommended Policies:</h5>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• Check-in and Check-out procedures</li>
                  <li>• Cancellation and refund policy</li>
                  <li>• House rules and guest conduct</li>
                  <li>• Payment terms and accepted methods</li>
                  <li>• Privacy and data protection policy</li>
                  <li>• Damage and liability terms</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Choose from our professionally crafted templates or upload your own legal document.
                  All templates can be customized to match your hotel's specific needs.
                </AlertDescription>
              </Alert>

              {/* Template Selection */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="templateSelect">Select Template</Label>
                  <Select
                    value={selectedTemplate}
                    onValueChange={(value: keyof typeof defaultTemplates) => handleTemplateChange(value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic Template - Standard hotel terms</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive Template - Detailed legal coverage</SelectItem>
                      <SelectItem value="luxury">Luxury Template - Premium hotel standards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTermsEditor(!showTermsEditor)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    {showTermsEditor ? 'Hide' : 'Edit'} Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => setUseCustomDocument(!useCustomDocument)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Custom
                  </Button>
                </div>

                {showTermsEditor && (
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg">Edit Terms & Conditions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={customTerms}
                        onChange={(e) => setCustomTerms(e.target.value)}
                        rows={15}
                        className="text-sm font-mono"
                        placeholder="Enter your custom terms and conditions..."
                      />
                      <div className="mt-2 text-xs text-muted-foreground">
                        You can edit this template to match your hotel's specific requirements.
                        Consider consulting with legal counsel for complex terms.
                      </div>
                    </CardContent>
                  </Card>
                )}

                {useCustomDocument && (
                  <div className="space-y-3">
                    <Label>Upload Custom Terms & Conditions</Label>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleCustomTermsUpload}
                    />
                    <p className="text-sm text-muted-foreground">
                      Upload your own legal document. Supported formats: PDF, DOC, DOCX, TXT
                    </p>
                  </div>
                )}

                {/* Template Preview */}
                <Card className="bg-muted/20 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-sm">Template Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {customTerms.substring(0, 300)}...
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto mt-2"
                      onClick={() => setShowTermsEditor(true)}
                    >
                      View Full Document
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Acceptance */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="acceptTerms"
              checked={data.documents.termsAccepted}
              onCheckedChange={(checked) => updateDocuments('termsAccepted', checked)}
            />
            <div className="space-y-2">
              <Label
                htmlFor="acceptTerms"
                className="text-sm font-medium cursor-pointer"
              >
                I confirm that I have reviewed and accept the terms and conditions
              </Label>
              <p className="text-xs text-muted-foreground">
                By checking this box, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions. You also confirm that the uploaded policies comply with local laws and regulations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}