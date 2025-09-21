import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  MapPin, 
  CreditCard, 
  User, 
  Palette, 
  FileText, 
  Shield,
  Check,
  Globe,
  Phone,
  Mail
} from 'lucide-react';
import { OnboardingData } from '../OnboardingWizard';

interface ReviewConfirmStepProps {
  data: OnboardingData;
}

export function ReviewConfirmStep({ data }: ReviewConfirmStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">Review Your Configuration</h3>
        <p className="text-muted-foreground">
          Please review all settings before completing your hotel setup
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hotel Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Hotel Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium">Hotel Name</div>
              <div className="text-muted-foreground">{data.hotelInfo.name}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>Address</span>
              </div>
              <div className="text-muted-foreground">
                {data.hotelInfo.address}, {data.hotelInfo.city}, {data.hotelInfo.country}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium flex items-center space-x-1">
                  <Phone className="h-3 w-3" />
                  <span>Phone</span>
                </div>
                <div className="text-muted-foreground">{data.hotelInfo.phone || 'Not provided'}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium flex items-center space-x-1">
                  <Mail className="h-3 w-3" />
                  <span>Support Email</span>
                </div>
                <div className="text-muted-foreground">{data.hotelInfo.supportEmail || 'Not provided'}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium flex items-center space-x-1">
                  <Globe className="h-3 w-3" />
                  <span>Timezone</span>
                </div>
                <div className="text-muted-foreground">{data.hotelInfo.timezone}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium">Currency</div>
                <div className="text-muted-foreground">{data.hotelInfo.currency}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template & Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Template & Subscription</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.template && (
              <div>
                <div className="text-sm font-medium">Hotel Template</div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{data.template.name}</Badge>
                  <span className="text-sm text-muted-foreground">
                    ({data.template.roomCount} rooms)
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {data.template.description}
                </div>
              </div>
            )}
            
            <Separator />
            
            {data.plan && (
              <div>
                <div className="text-sm font-medium">Subscription Plan</div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">{data.plan.name} Plan</Badge>
                  {data.plan.trialDays && (
                    <Badge variant="outline">
                      {data.plan.trialDays}-day trial
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Owner Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Owner Account</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium">Name</div>
              <div className="text-muted-foreground">{data.owner.name}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium">Email</div>
              <div className="text-muted-foreground">{data.owner.email}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium">Phone</div>
              <div className="text-muted-foreground">{data.owner.phone || 'Not provided'}</div>
            </div>
            
            {data.owner.emergencyContact && (
              <div>
                <div className="text-sm font-medium">Emergency Contact</div>
                <div className="text-muted-foreground">{data.owner.emergencyContact}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branding & Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Branding & Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium">Brand Colors</div>
              <div className="flex items-center space-x-2 mt-1">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: data.branding.primaryColor }}
                />
                <span className="text-sm text-muted-foreground">
                  {data.branding.primaryColor}
                </span>
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: data.branding.secondaryColor }}
                />
                <span className="text-sm text-muted-foreground">
                  {data.branding.secondaryColor}
                </span>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium">Receipt Format</div>
              <Badge variant="outline">
                {data.branding.receiptFormat === 'both' ? 'PDF & Thermal' : 
                 data.branding.receiptFormat === 'pdf' ? 'PDF Only' : 'Thermal Only'}
              </Badge>
            </div>
            
            <div>
              <div className="text-sm font-medium">Hotel Logo</div>
              <div className="text-muted-foreground">
                {data.branding.logoUrl ? '✓ Uploaded' : 'Not uploaded'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Permission Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Staff Invitation</div>
              <div className="flex flex-wrap gap-1">
                {data.permissions.staffInvite.map(role => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {role.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2">Pricing Approval</div>
              <div className="flex flex-wrap gap-1">
                {data.permissions.pricingApproval.map(role => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {role.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-2">QR Menu Management</div>
              <div className="flex flex-wrap gap-1">
                {data.permissions.qrMenuManagement.map(role => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {role.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Documents & Compliance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Policy Documents</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {data.documents.policies.length} files uploaded
                </span>
                <Check className="h-4 w-4 text-green-600" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Terms & Conditions</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {data.documents.termsAccepted ? 'Accepted' : 'Pending'}
                </span>
                {data.documents.termsAccepted && <Check className="h-4 w-4 text-green-600" />}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Audit Logging</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {data.auditAccepted ? 'Accepted' : 'Pending'}
                </span>
                {data.auditAccepted && <Check className="h-4 w-4 text-green-600" />}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <h4 className="font-medium mb-3">🎉 What happens next?</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Your hotel management system will be configured with these settings</p>
            <p>2. You'll be redirected to your owner dashboard</p>
            <p>3. You can start inviting staff members and setting up rooms</p>
            <p>4. Begin accepting reservations and managing your hotel operations</p>
          </div>
          
          <div className="mt-4 p-3 bg-background rounded-lg border">
            <div className="text-sm font-medium mb-1">Quick Start Recommendations:</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Invite your key staff members (Manager, Front Desk)</p>
              <p>• Set up your room inventory and pricing</p>
              <p>• Configure your POS system for restaurant services</p>
              <p>• Generate QR codes for guest room services</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}