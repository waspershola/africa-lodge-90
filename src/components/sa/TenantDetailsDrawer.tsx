import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, Mail, MapPin, Calendar, Users, Hotel, 
  CreditCard, Clock, Settings, UserCheck, Key, 
  RefreshCw, Trash2, Pause, Play, Crown
} from 'lucide-react';
import { format } from 'date-fns';
import type { TenantWithOwner } from '@/services/tenantService';

interface TenantDetailsDrawerProps {
  tenant: TenantWithOwner | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, tenant: TenantWithOwner) => void;
}

export function TenantDetailsDrawer({ tenant, isOpen, onClose, onAction }: TenantDetailsDrawerProps) {
  if (!tenant) return null;

  const trialProgress = tenant.subscription_status === 'trialing' && tenant.trial_start && tenant.trial_end 
    ? Math.max(0, Math.min(100, 
        ((new Date().getTime() - new Date(tenant.trial_start).getTime()) / 
         (new Date(tenant.trial_end).getTime() - new Date(tenant.trial_start).getTime())) * 100
      ))
    : 0;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-lg">{tenant.hotel_name}</SheetTitle>
              <p className="text-sm text-muted-foreground">{tenant.hotel_slug}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={tenant.subscription_status === 'active' ? 'default' : 
                           tenant.subscription_status === 'trialing' ? 'secondary' : 'destructive'}>
              {tenant.subscription_status}
            </Badge>
            <Badge variant="outline">{tenant.plan_name || 'No Plan'}</Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Hotel className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{tenant.total_rooms || 0}</div>
                <div className="text-xs text-muted-foreground">Rooms</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-5 w-5 mx-auto mb-2 text-accent" />
                <div className="text-2xl font-bold">-</div>
                <div className="text-xs text-muted-foreground">Staff</div>
              </CardContent>
            </Card>
          </div>

          {/* Hotel Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Hotel Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{tenant.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{tenant.city || 'No location'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Created {format(new Date(tenant.created_at), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{tenant.currency || 'NGN'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Owner Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Owner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="font-medium">{tenant.owner_name || 'Unknown'}</div>
                <div className="text-sm text-muted-foreground">{tenant.owner_email || 'No email'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Trial Status */}
          {tenant.subscription_status === 'trialing' && tenant.trial_end && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Trial Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{Math.round(trialProgress)}%</span>
                  </div>
                  <Progress value={trialProgress} className="h-2" />
                </div>
                <div className="text-sm text-muted-foreground">
                  Expires {format(new Date(tenant.trial_end), 'MMM dd, yyyy')}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => onAction('edit', tenant)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => onAction('impersonate', tenant)}
            >
              <Crown className="h-4 w-4 mr-2" />
              Impersonate Owner
            </Button>

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => onAction('reset-password', tenant)}
            >
              <Key className="h-4 w-4 mr-2" />
              Reset Password
            </Button>

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => onAction('resend-invite', tenant)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend Invite
            </Button>

            {tenant.subscription_status === 'active' || tenant.subscription_status === 'trialing' ? (
              <Button 
                className="w-full text-orange-600 hover:text-orange-700" 
                variant="outline"
                onClick={() => onAction('suspend', tenant)}
              >
                <Pause className="h-4 w-4 mr-2" />
                Suspend Tenant
              </Button>
            ) : (
              <Button 
                className="w-full text-green-600 hover:text-green-700" 
                variant="outline"
                onClick={() => onAction('reactivate', tenant)}
              >
                <Play className="h-4 w-4 mr-2" />
                Reactivate Tenant
              </Button>
            )}

            <Button 
              className="w-full text-destructive hover:text-destructive/90" 
              variant="outline"
              onClick={() => onAction('delete', tenant)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Tenant
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}