import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertCircle, Download, Eye } from 'lucide-react';
import { OnboardingData } from '../OnboardingWizard';

interface DocumentsStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

const defaultTerms = `HOTEL TERMS AND CONDITIONS

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

Last updated: ${new Date().toLocaleDateString()}`;

export function DocumentsStep({ data, updateData }: DocumentsStepProps) {
  const [customTerms, setCustomTerms] = useState(defaultTerms);
  const [showTermsPreview, setShowTermsPreview] = useState(false);

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
                  We've provided a template for your hotel's terms and conditions. 
                  You can customize it or use your own legal document.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTermsPreview(!showTermsPreview)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showTermsPreview ? 'Hide' : 'Preview'} Template
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>

                {showTermsPreview && (
                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <Textarea
                        value={customTerms}
                        onChange={(e) => setCustomTerms(e.target.value)}
                        rows={12}
                        className="text-sm"
                      />
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3">
                  <Label>Upload Custom Terms & Conditions (Optional)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={() => {}} // Handle custom terms upload
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload your own legal document or use the provided template
                  </p>
                </div>
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