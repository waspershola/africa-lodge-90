import { motion } from 'framer-motion';
import { 
  Building2, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Users, 
  Activity,
  Settings,
  Pause,
  Play,
  UserCheck,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import type { Tenant } from '@/lib/api/mockAdapter';

interface TenantDrawerProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, tenantId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-success/10 text-success border-success/20';
    case 'suspended': return 'bg-danger/10 text-danger border-danger/20';
    case 'inactive': return 'bg-muted/10 text-muted-foreground border-muted/20';
    default: return 'bg-muted/10 text-muted-foreground border-muted/20';
  }
};

const getPlanColor = (plan: string) => {
  switch (plan) {
    case 'Pro': return 'bg-primary/10 text-primary border-primary/20';
    case 'Growth': return 'bg-accent/10 text-accent border-accent/20';
    case 'Starter': return 'bg-muted/10 text-muted-foreground border-muted/20';
    default: return 'bg-muted/10 text-muted-foreground border-muted/20';
  }
};

export default function TenantDrawer({ tenant, isOpen, onClose, onAction }: TenantDrawerProps) {
  if (!tenant) return null;

  const quickActions = [
    {
      id: 'impersonate',
      label: 'Impersonate',
      icon: UserCheck,
      variant: 'outline',
      description: 'Login as this tenant'
    },
    {
      id: 'suspend',
      label: tenant.status === 'active' ? 'Suspend' : 'Reactivate',
      icon: tenant.status === 'active' ? Pause : Play,
      variant: tenant.status === 'active' ? 'destructive' : 'default',
      description: tenant.status === 'active' ? 'Suspend tenant access' : 'Restore tenant access'
    },
    {
      id: 'logout',
      label: 'Force Logout',
      icon: ExternalLink,
      variant: 'outline',
      description: 'Log out all tenant users'
    },
    {
      id: 'sandbox',
      label: 'Clone to Sandbox',
      icon: Settings,
      variant: 'outline',
      description: 'Create test environment'
    }
  ] as const;

  // Mock additional data - in real app this would come from API
  const additionalData = {
    billing: {
      currentInvoice: 75000,
      lastPayment: '2024-01-15',
      nextBilling: '2024-02-15',
      outstandingAmount: 0
    },
    usage: {
      apiCalls: 45230,
      storage: 2.4,
      bandwidth: 156.8
    },
    health: {
      uptime: 99.8,
      lastSeen: new Date(Date.now() - 300000).toISOString(),
      errors: 2,
      warnings: 5
    },
    recentActivity: [
      { action: 'User login', time: '5 minutes ago', user: 'admin@hotel.com' },
      { action: 'Payment processed', time: '2 hours ago', amount: '₦45,000' },
      { action: 'Booking created', time: '4 hours ago', details: '3-night stay' },
      { action: 'Settings updated', time: '1 day ago', user: 'manager@hotel.com' }
    ]
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{tenant.name}</h2>
              <p className="text-sm text-muted-foreground">{tenant.slug}</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="space-y-6">
            {/* Status & Plan */}
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(tenant.status)}>
                {tenant.status}
              </Badge>
              <Badge className={getPlanColor(tenant.plan)}>
                {tenant.plan} Plan
              </Badge>
              <Badge variant="outline">
                {tenant.totalRooms} Rooms
              </Badge>
            </div>

            {/* Contact Info */}
            <Card className="modern-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{tenant.contactEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{tenant.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Created {formatDistanceToNow(new Date(tenant.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div>
              <h3 className="font-medium mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.variant}
                    className="h-auto p-3 flex flex-col items-start gap-1"
                    onClick={() => onAction(action.id, tenant.id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <action.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{action.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground text-left">
                      {action.description}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Billing Overview */}
            <Card className="modern-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Billing Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Invoice</span>
                  <span className="font-medium">₦{additionalData.billing.currentInvoice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Payment</span>
                  <span className="font-medium">{additionalData.billing.lastPayment}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Next Billing</span>
                  <span className="font-medium">{additionalData.billing.nextBilling}</span>
                </div>
                {additionalData.billing.outstandingAmount > 0 && (
                  <div className="flex justify-between items-center text-danger">
                    <span className="text-sm">Outstanding</span>
                    <span className="font-medium">₦{additionalData.billing.outstandingAmount.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="modern-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Uptime</span>
                    <span className="font-medium">{additionalData.health.uptime}%</span>
                  </div>
                  <Progress value={additionalData.health.uptime} className="h-2" />
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-success">{additionalData.health.uptime}%</div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-warning">{additionalData.health.warnings}</div>
                    <div className="text-xs text-muted-foreground">Warnings</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-danger">{additionalData.health.errors}</div>
                    <div className="text-xs text-muted-foreground">Errors</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-muted-foreground">
                    Last seen {formatDistanceToNow(new Date(additionalData.health.lastSeen), { addSuffix: true })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Usage Stats */}
            <Card className="modern-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Usage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">API Calls (Month)</span>
                  <span className="font-medium">{additionalData.usage.apiCalls.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Storage Used</span>
                  <span className="font-medium">{additionalData.usage.storage} GB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Bandwidth</span>
                  <span className="font-medium">{additionalData.usage.bandwidth} GB</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="modern-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {additionalData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{activity.action}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{activity.time}</span>
                          {activity.user && <span>• {activity.user}</span>}
                          {activity.amount && <span>• {activity.amount}</span>}
                          {activity.details && <span>• {activity.details}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}