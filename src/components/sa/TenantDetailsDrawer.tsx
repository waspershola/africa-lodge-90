import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Activity, 
  Calendar,
  MapPin,
  Mail,
  Phone,
  Settings,
  AlertTriangle,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Tenant, Plan } from '@/types/tenant';
import { format } from 'date-fns';

interface TenantDetailsDrawerProps {
  tenant: Tenant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: Plan[];
}

export function TenantDetailsDrawer({ tenant, open, onOpenChange, plans }: TenantDetailsDrawerProps) {
  const [extendReason, setExtendReason] = useState('');
  const [extending, setExtending] = useState(false);
  
  const plan = plans.find(p => p.plan_id === tenant.plan_id);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-700';
      case 'trialing': return 'bg-blue-500/20 text-blue-700';
      case 'expired': return 'bg-red-500/20 text-red-700';
      case 'suspended': return 'bg-orange-500/20 text-orange-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  const handleExtendTrial = async () => {
    if (!extendReason.trim()) return;
    
    setExtending(true);
    try {
      // This would call the API
      console.log(`Extending trial for ${tenant.tenant_id}: ${extendReason}`);
      setTimeout(() => {
        setExtending(false);
        setExtendReason('');
      }, 1000);
    } catch (error) {
      setExtending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {tenant.hotel_name}
          </SheetTitle>
          <SheetDescription>
            Manage tenant subscription, users, and settings
          </SheetDescription>
        </SheetHeader>

        <div className="py-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Status Overview</span>
                    <Badge className={getStatusColor(tenant.subscription_status)}>
                      {tenant.subscription_status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Hotel Name</Label>
                      <p className="font-medium">{tenant.hotel_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Location</Label>
                      <p className="font-medium">{tenant.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Current Plan</Label>
                      <p className="font-medium">{plan?.name} (₦{plan?.price.toLocaleString()}/month)</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Created Date</Label>
                      <p className="font-medium">{format(new Date(tenant.created_at), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>

                  {tenant.subscription_status === 'trialing' && tenant.trial_end && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Trial Information</span>
                      </div>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>Trial ends: {format(new Date(tenant.trial_end), 'MMM dd, yyyy HH:mm')}</p>
                        <p>Days remaining: {tenant.days_remaining || 0} days</p>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="space-y-3">
                        <Label htmlFor="extend-reason">Extend Trial (Admin Only)</Label>
                        <Textarea
                          id="extend-reason"
                          placeholder="Reason for extension..."
                          value={extendReason}
                          onChange={(e) => setExtendReason(e.target.value)}
                          rows={2}
                        />
                        <Button 
                          size="sm" 
                          onClick={handleExtendTrial}
                          disabled={!extendReason.trim() || extending}
                        >
                          {extending ? 'Extending...' : 'Extend +7 Days'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {tenant.subscription_status === 'expired' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-900">Trial Expired</span>
                      </div>
                      <p className="text-sm text-red-700">
                        This hotel's trial ended on {tenant.trial_end && format(new Date(tenant.trial_end), 'MMM dd, yyyy')}. 
                        Dashboards are locked until payment is processed.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm">
                      <Mail className="mr-2 h-4 w-4" />
                      Email Owner
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Reset Password
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                    <Button variant="destructive" size="sm">
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Suspend Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Billing Information</CardTitle>
                  <CardDescription>Subscription and payment details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Billing Provider</Label>
                      <p className="font-medium">{tenant.billing_provider || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Next Billing Date</Label>
                      <p className="font-medium">Nov 15, 2025</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Recent Transactions</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <p className="font-medium">Growth Plan - Oct 2025</p>
                          <p className="text-sm text-muted-foreground">Oct 15, 2025</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₦65,000</p>
                          <Badge variant="secondary">Paid</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Hotel staff and their roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">
                          JD
                        </div>
                        <div>
                          <p className="font-medium">John Doe</p>
                          <p className="text-sm text-muted-foreground">owner@hotel.com</p>
                        </div>
                      </div>
                      <Badge>Owner</Badge>
                    </div>

                    <div className="flex justify-between items-center p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm">
                          SM
                        </div>
                        <div>
                          <p className="font-medium">Sarah Manager</p>
                          <p className="text-sm text-muted-foreground">manager@hotel.com</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Manager</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>System events and user actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <div>
                        <p className="text-sm font-medium">Trial started</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Users className="h-4 w-4 text-blue-600 mt-1" />
                      <div>
                        <p className="text-sm font-medium">Owner account created</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}