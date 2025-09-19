import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, Clock, User, Activity, FileText } from 'lucide-react';
import { OnboardingData } from '../OnboardingWizard';

interface AuditTransparencyStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

const auditFeatures = [
  {
    icon: User,
    title: 'User Activity Tracking',
    description: 'Every staff login, logout, and system access is recorded with timestamps',
    example: 'John Doe (Front Desk) logged in at 8:00 AM from Room 101 terminal',
  },
  {
    icon: Activity,
    title: 'Guest Operations Logging',
    description: 'All guest check-ins, check-outs, and service requests are tracked',
    example: 'Sarah Smith checked in Guest #101 (Mr. Johnson) at 2:30 PM - Room 205',
  },
  {
    icon: FileText,
    title: 'Financial Transaction Records',
    description: 'Payment processing, refunds, and billing adjustments are fully audited',
    example: 'Mike Wilson processed ₦25,000 payment for Room 205 - Card ending in 1234',
  },
  {
    icon: Shield,
    title: 'System Configuration Changes',
    description: 'Any changes to settings, prices, or permissions are logged with before/after values',
    example: 'Admin updated room rate for Standard Room from ₦15,000 to ₦18,000',
  },
  {
    icon: Clock,
    title: 'Time-Stamped Evidence',
    description: 'All audit entries include precise timestamps and IP addresses for verification',
    example: 'Timestamp: 2023-09-19 14:32:15 WAT | IP: 192.168.1.45',
  },
];

const compliancePoints = [
  'Meet regulatory requirements for hospitality businesses',
  'Provide evidence for insurance claims and disputes',
  'Monitor staff performance and identify training needs',
  'Detect unauthorized access or suspicious activities',
  'Generate compliance reports for auditors and authorities',
  'Maintain transparency with hotel ownership and management',
];

export function AuditTransparencyStep({ data, updateData }: AuditTransparencyStepProps) {
  const acceptAudit = (accepted: boolean) => {
    updateData({ auditAccepted: accepted });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">System Transparency & Audit Logging</h3>
        <p className="text-muted-foreground">
          Understanding how we maintain accountability and security in your hotel operations
        </p>
      </div>

      <Alert>
        <Eye className="h-4 w-4" />
        <AlertDescription>
          This system automatically logs all staff actions for security, compliance, and accountability. 
          This protects both your business and your staff by maintaining a complete audit trail.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>What Gets Logged</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditFeatures.map((feature, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <feature.icon className="h-5 w-5 text-primary mt-1" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {feature.description}
                    </p>
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-xs font-mono text-muted-foreground">
                        Example: {feature.example}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Benefits of Audit Logging</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {compliancePoints.map((point, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Badge variant="secondary" className="mt-1">
                  ✓
                </Badge>
                <span className="text-sm">{point}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium text-green-800 mb-2">Data Privacy & Security</h4>
                <div className="text-sm text-green-700 space-y-2">
                  <p>• All audit data is encrypted and stored securely</p>
                  <p>• Access to audit logs is restricted to authorized personnel only</p>
                  <p>• Personal guest information is protected according to data protection laws</p>
                  <p>• Audit logs can be exported for compliance reporting</p>
                  <p>• You maintain full ownership and control of your hotel's data</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Eye className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Transparency Promise</h4>
                <p className="text-sm text-blue-700">
                  We believe in complete transparency. You can view all audit logs, understand exactly 
                  what data is collected, and control who has access to what information. This system 
                  is designed to protect your business, your staff, and your guests.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acceptance */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="acceptAudit"
              checked={data.auditAccepted}
              onCheckedChange={acceptAudit}
            />
            <div className="space-y-2">
              <Label
                htmlFor="acceptAudit"
                className="text-sm font-medium cursor-pointer"
              >
                I understand and accept the audit logging system
              </Label>
              <p className="text-xs text-muted-foreground">
                By checking this box, you acknowledge that you understand how the audit logging system works, 
                agree to its implementation in your hotel operations, and confirm that you will inform your 
                staff about the system's monitoring capabilities. This helps ensure accountability, security, 
                and compliance across all hotel operations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}