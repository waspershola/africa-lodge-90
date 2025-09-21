import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Mail, Phone, Shield, AlertTriangle } from 'lucide-react';
import { OnboardingData } from '../OnboardingWizard';
import { useState } from 'react';

interface OwnerSetupStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

export function OwnerSetupStep({ data, updateData }: OwnerSetupStepProps) {
  const [passwordSetup, setPasswordSetup] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [hasTemporaryPassword, setHasTemporaryPassword] = useState(false);

  const updateOwner = (field: string, value: string) => {
    updateData({
      owner: {
        ...data.owner,
        [field]: value,
      },
    });
  };

  const handlePasswordUpdate = () => {
    // Simulate password update
    console.log('Updating password...');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Owner Account Setup</h3>
        <p className="text-muted-foreground">
          Confirm your details and secure your account
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ownerName">Full Name *</Label>
              <Input
                id="ownerName"
                value={data.owner.name}
                onChange={(e) => updateOwner('name', e.target.value)}
                placeholder="Enter your full name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="ownerEmail">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ownerEmail"
                  type="email"
                  value={data.owner.email}
                  onChange={(e) => updateOwner('email', e.target.value)}
                  placeholder="owner@yourhotel.com"
                  className="mt-1 pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ownerPhone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ownerPhone"
                  type="tel"
                  value={data.owner.phone}
                  onChange={(e) => updateOwner('phone', e.target.value)}
                  placeholder="+234 xxx xxx xxxx"
                  className="mt-1 pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="emergencyContact">Emergency Contact (Optional)</Label>
              <Input
                id="emergencyContact"
                value={data.owner.emergencyContact || ''}
                onChange={(e) => updateOwner('emergencyContact', e.target.value)}
                placeholder="Emergency contact person"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact & Communication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Communication Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h4 className="font-medium text-green-800 mb-2">Account Ready</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Your account is set up and ready to use. You can manage additional security settings from your dashboard.
              </p>
            </div>

            <div className="border-t pt-4">
              <h5 className="font-medium mb-2">Email Notifications</h5>
              <p className="text-sm text-muted-foreground mb-3">
                We'll send important updates and security alerts to your email
              </p>
              <div className="text-sm text-muted-foreground">
                ✓ Account security alerts<br />
                ✓ System maintenance notifications<br />
                ✓ Billing and subscription updates
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Owner Account Privileges</h4>
              <p className="text-sm text-blue-600 mb-2">
                As the hotel owner, you'll have access to:
              </p>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Full system administration and settings</li>
                <li>• Financial reports and billing management</li>
                <li>• Staff management and role assignments</li>
                <li>• All hotel operations and guest data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}