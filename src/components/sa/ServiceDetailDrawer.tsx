import React, { useState } from 'react';
import { X, Edit, Settings, Users, Code, Calendar, Globe } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalService } from '@/types/services';
import { useServicesAdmin } from '@/hooks/useServicesAdmin';

interface ServiceDetailDrawerProps {
  service: GlobalService | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateService: (serviceId: string, updates: Partial<GlobalService>) => Promise<GlobalService>;
}

export const ServiceDetailDrawer: React.FC<ServiceDetailDrawerProps> = ({
  service,
  isOpen,
  onClose,
  onUpdateService
}) => {
  const { pricingTemplates, tenantConfigs } = useServicesAdmin();
  const [isEditing, setIsEditing] = useState(false);

  if (!service) return null;

  const servicePricingTemplates = pricingTemplates.filter(
    template => template.service_code === service.code
  );

  const serviceTenantConfigs = tenantConfigs.filter(
    config => config.service_code === service.code
  );

  const activeConfigs = serviceTenantConfigs.filter(config => config.enabled);
  const trialConfigs = serviceTenantConfigs.filter(config => config.trial_mode);

  const totalRevenue = serviceTenantConfigs.reduce(
    (sum, config) => sum + config.usage_stats.revenue_generated, 0
  );

  const totalRequests = serviceTenantConfigs.reduce(
    (sum, config) => sum + config.usage_stats.total_requests, 0
  );

  const avgSatisfaction = serviceTenantConfigs.length > 0
    ? serviceTenantConfigs.reduce(
        (sum, config) => sum + config.usage_stats.customer_satisfaction, 0
      ) / serviceTenantConfigs.length
    : 0;

  const statusColors = {
    active: 'bg-green-50 text-green-700 border-green-200',
    beta: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    deprecated: 'bg-red-50 text-red-700 border-red-200',
    'coming-soon': 'bg-blue-50 text-blue-700 border-blue-200'
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:w-[700px] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SheetTitle className="text-xl">{service.name}</SheetTitle>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[service.status]}>
                  {service.status}
                </Badge>
                <Badge variant="outline">
                  {service.category.replace('-', ' ').toUpperCase()}
                </Badge>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {service.code}
                </code>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Tenants</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  {activeConfigs.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Trial Tenants</CardDescription>
                <CardTitle className="text-2xl text-yellow-600">
                  {trialConfigs.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Revenue</CardDescription>
                <CardTitle className="text-2xl">
                  ₦{totalRevenue.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Satisfaction</CardDescription>
                <CardTitle className="text-2xl">
                  {avgSatisfaction.toFixed(1)}/5.0
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="tenants">Tenants</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Service Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-muted-foreground">{service.description}</p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Required Staff Roles
                      </h4>
                      {service.requires_staff_role && service.requires_staff_role.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {service.requires_staff_role.map((role) => (
                            <Badge key={role} variant="secondary">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">None required</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Multilingual Support
                      </h4>
                      <Badge variant={service.multilingual_support ? 'default' : 'secondary'}>
                        {service.multilingual_support ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      API Endpoints
                    </h4>
                    {service.api_endpoints && service.api_endpoints.length > 0 ? (
                      <div className="space-y-2">
                        {service.api_endpoints.map((endpoint) => (
                          <code key={endpoint} className="block text-xs bg-muted p-2 rounded">
                            {endpoint}
                          </code>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No API endpoints defined</p>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Created:</span>
                      <p className="text-muted-foreground">
                        {new Date(service.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>
                      <p className="text-muted-foreground">
                        {new Date(service.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Templates</CardTitle>
                  <CardDescription>
                    Baseline pricing that tenants can customize within limits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {servicePricingTemplates.length > 0 ? (
                    <div className="space-y-4">
                      {servicePricingTemplates.map((template) => (
                        <div key={template.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{template.item_name}</h4>
                            <Badge variant={template.override_allowed ? 'default' : 'secondary'}>
                              {template.override_allowed ? 'Customizable' : 'Fixed'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {template.description}
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Baseline Price:</span>
                              <p>₦{template.baseline_price.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="font-medium">Allowed Range:</span>
                              <p>₦{template.min_allowed_price.toLocaleString()} - ₦{template.max_allowed_price.toLocaleString()}</p>
                            </div>
                          </div>
                          {template.approval_required_for_changes && (
                            <p className="text-xs text-yellow-600 mt-2">
                              ⚠️ Changes require super admin approval
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No pricing templates configured for this service
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tenants" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tenant Configurations</CardTitle>
                  <CardDescription>
                    Hotels using this service
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {serviceTenantConfigs.length > 0 ? (
                    <div className="space-y-4">
                      {serviceTenantConfigs.map((config) => (
                        <div key={config.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">Tenant {config.tenant_id}</h4>
                            <div className="flex gap-2">
                              <Badge variant={config.enabled ? 'default' : 'secondary'}>
                                {config.enabled ? 'Active' : 'Disabled'}
                              </Badge>
                              {config.trial_mode && (
                                <Badge variant="outline">Trial</Badge>
                              )}
                              <Badge variant="outline">{config.plan}</Badge>
                            </div>
                          </div>
                          
                          {config.trial_mode && config.trial_expires_at && (
                            <p className="text-sm text-yellow-600 mb-2">
                              Trial expires: {new Date(config.trial_expires_at).toLocaleDateString()}
                            </p>
                          )}

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Requests:</span>
                              <p>{config.usage_stats.total_requests.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="font-medium">Revenue:</span>
                              <p>₦{config.usage_stats.revenue_generated.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="font-medium">Satisfaction:</span>
                              <p>{config.usage_stats.customer_satisfaction.toFixed(1)}/5</p>
                            </div>
                          </div>

                          {Object.keys(config.restrictions).length > 0 && (
                            <div className="mt-3 p-2 bg-muted rounded text-xs">
                              <span className="font-medium">Restrictions:</span>
                              <pre>{JSON.stringify(config.restrictions, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No tenants have configured this service yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Analytics</CardTitle>
                  <CardDescription>
                    Service performance metrics across all tenants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Total Requests</h4>
                      <p className="text-2xl font-bold">{totalRequests.toLocaleString()}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Average Response Time</h4>
                      <p className="text-2xl font-bold">
                        {serviceTenantConfigs.length > 0
                          ? (serviceTenantConfigs.reduce((sum, config) => 
                              sum + config.usage_stats.average_response_time, 0) / serviceTenantConfigs.length
                            ).toFixed(1)
                          : 0
                        }s
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div>
                    <h4 className="font-medium mb-4">Recent Activity</h4>
                    <div className="space-y-2 text-sm">
                      {serviceTenantConfigs
                        .sort((a, b) => new Date(b.activated_at).getTime() - new Date(a.activated_at).getTime())
                        .slice(0, 5)
                        .map((config) => (
                        <div key={config.id} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span>Tenant {config.tenant_id} activated service</span>
                          <span className="text-muted-foreground">
                            {new Date(config.activated_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
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
};