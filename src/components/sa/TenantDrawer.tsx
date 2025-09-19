import {
  Building,
  Calendar,
  CreditCard,
  DollarSign,
  Globe,
  Hotel,
  Mail,
  MapPin,
  Settings,
  Shield,
  Star,
  TrendingUp,
  User,
  Users,
  Activity,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import type { Tenant } from '@/lib/supabase-api';

interface TenantDrawerProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, tenantId: string) => void;
}

const getStatusColor = (status: string) => {
  if (status === 'active') return 'bg-green-100 text-green-800 border-green-200';
  if (status === 'trialing') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (status === 'suspended' || status === 'expired') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
};

const getPlanColor = (plan: string) => {
  if (plan === 'Pro') return 'bg-purple-100 text-purple-800 border-purple-200';
  if (plan === 'Growth') return 'bg-blue-100 text-blue-800 border-blue-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
};

export default function TenantDrawer({ tenant, isOpen, onClose, onAction }: TenantDrawerProps) {
  if (!tenant) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[540px] p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <SheetHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <SheetTitle className="text-2xl">{tenant.hotel_name}</SheetTitle>
                  <p className="text-sm text-muted-foreground">{tenant.hotel_slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(tenant.subscription_status)}>
                    {tenant.subscription_status}
                  </Badge>
                  <Badge className={getPlanColor('Growth')}>
                    Growth
                  </Badge>
                </div>
              </div>
            </SheetHeader>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Hotel className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Rooms</span>
                  </div>
                  <div className="text-2xl font-bold">50</div>
                  <p className="text-xs text-muted-foreground">Available rooms</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Staff</span>
                  </div>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">Active staff members</p>
                </CardContent>
              </Card>
            </div>

            {/* Tenant Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Building className="mr-2 h-4 w-4" />
                  Hotel Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Contact Email</span>
                    <span className="text-sm font-medium">{tenant.email || 'No email set'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">City</span>
                    <span className="text-sm font-medium">{tenant.city || 'Not specified'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm font-medium">
                      {tenant.created_at ? formatDistanceToNow(new Date(tenant.created_at), { addSuffix: true }) : 'Unknown'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Currency</span>
                    <span className="text-sm font-medium">{tenant.currency || 'NGN'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trial Information */}
            {tenant.subscription_status === 'trialing' && tenant.trial_end && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Zap className="mr-2 h-4 w-4" />
                    Trial Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Trial Progress</span>
                      <span className="font-medium">
                        {Math.max(0, Math.ceil((new Date(tenant.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days left
                      </span>
                    </div>
                    <Progress 
                      value={Math.max(0, 100 - (Math.ceil((new Date(tenant.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) / 14 * 100))} 
                      className="h-2" 
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Trial ends on {new Date(tenant.trial_end).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mock Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                    <span className="text-sm font-medium">₦1,250,000</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Occupancy Rate</span>
                    <span className="text-sm font-medium">78.5%</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Total Orders</span>
                    <span className="text-sm font-medium">342</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Avg Rating</span>
                    <span className="text-sm font-medium flex items-center">
                      <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                      4.6
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAction('edit', tenant.tenant_id)}
                    className="w-full justify-start"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Tenant Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAction('suspend', tenant.tenant_id)}
                    className="w-full justify-start"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Suspend Tenant
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAction('impersonate', tenant.tenant_id)}
                    className="w-full justify-start"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Impersonate Owner
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}