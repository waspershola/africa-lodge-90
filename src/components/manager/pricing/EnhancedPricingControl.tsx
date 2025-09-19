import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Plus,
  Settings,
  Filter,
  Calendar,
  Percent,
  Tag
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import type { ServicePricing, PricingChange, SurchargeRule } from '@/types/pricing';
import { PriceChangeDialog } from './PriceChangeDialog';
import { SurchargeManager } from './SurchargeManager';
import { ApprovalQueue } from './ApprovalQueue';

interface EnhancedPricingControlProps {
  services: ServicePricing[];
  pendingChanges: PricingChange[];
  onPriceChange: (change: Partial<PricingChange>) => void;
  onSurchargeUpdate: (serviceId: string, rules: SurchargeRule[]) => void;
}

export const EnhancedPricingControl = ({ 
  services, 
  pendingChanges, 
  onPriceChange, 
  onSurchargeUpdate 
}: EnhancedPricingControlProps) => {
  const [selectedService, setSelectedService] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const serviceMatch = selectedService === 'all' || service.serviceType === selectedService;
      const statusMatch = priceFilter === 'all' || service.status === priceFilter;
      return serviceMatch && statusMatch;
    });
  }, [services, selectedService, priceFilter]);

  const pricingStats = useMemo(() => {
    const totalItems = services.length;
    const pendingApprovals = pendingChanges.filter(c => c.status === 'pending').length;
    const avgPrice = services.reduce((sum, s) => sum + s.currentPrice, 0) / totalItems || 0;
    const dynamicPricing = services.filter(s => s.pricingModel === 'dynamic').length;
    
    return {
      totalItems,
      pendingApprovals,
      avgPrice,
      dynamicPricing,
      activeSurcharges: services.reduce((sum, s) => sum + s.surchargeRules.filter(r => r.active).length, 0)
    };
  }, [services, pendingChanges]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending-approval': return 'secondary';
      case 'inactive': return 'outline';
      default: return 'outline';
    }
  };

  const getPricingModelColor = (model: string) => {
    switch (model) {
      case 'dynamic': return 'text-blue-600';
      case 'tiered': return 'text-purple-600';
      case 'fixed': return 'text-green-600';
      case 'free': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Pricing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{pricingStats.totalItems}</div>
              <div className="text-sm text-muted-foreground">Service Items</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{pricingStats.pendingApprovals}</div>
              <div className="text-sm text-muted-foreground">Pending Approvals</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{formatPrice(pricingStats.avgPrice)}</div>
              <div className="text-sm text-muted-foreground">Avg Price</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{pricingStats.dynamicPricing}</div>
              <div className="text-sm text-muted-foreground">Dynamic Items</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{pricingStats.activeSurcharges}</div>
              <div className="text-sm text-muted-foreground">Active Surcharges</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="pricing" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pricing">Service Pricing</TabsTrigger>
          <TabsTrigger value="surcharges">Dynamic Pricing</TabsTrigger>
          <TabsTrigger value="approvals">Approval Queue</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-6">
          {/* Filters */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Service Pricing Management
                </CardTitle>
                <CardDescription>
                  Manage operational pricing with owner-approved delegation limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="room-service">Room Service</SelectItem>
                      <SelectItem value="housekeeping">Housekeeping</SelectItem>
                      <SelectItem value="spa">Spa Services</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="events">Events</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending-approval">Pending Approval</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <PriceChangeDialog
                    trigger={
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Service Item
                      </Button>
                    }
                    onSubmit={onPriceChange}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Service Pricing Grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="luxury-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{service.itemName}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {service.serviceType.replace('-', ' ')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={getStatusBadgeVariant(service.status)}>
                            {service.status}
                          </Badge>
                          <Badge variant="outline" className={getPricingModelColor(service.pricingModel)}>
                            {service.pricingModel}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Pricing Info */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Current Price:</span>
                          <span className="font-bold text-lg text-green-600">
                            {formatPrice(service.currentPrice)}
                          </span>
                        </div>
                        {service.basePrice !== service.currentPrice && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Base Price:</span>
                            <span className="text-sm line-through text-muted-foreground">
                              {formatPrice(service.basePrice)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Active Surcharges */}
                      {service.surchargeRules.filter(r => r.active).length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Active Surcharges:</Label>
                          <div className="flex flex-wrap gap-1">
                            {service.surchargeRules.filter(r => r.active).map((rule, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                <Percent className="h-3 w-3 mr-1" />
                                {rule.name} +{rule.percentage}%
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Room Type Restrictions */}
                      {service.roomTypeRestrictions.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Room Types:</Label>
                          <div className="flex flex-wrap gap-1">
                            {service.roomTypeRestrictions.map((roomType, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {roomType}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <PriceChangeDialog
                          trigger={
                            <Button size="sm" variant="outline" className="flex-1">
                              <DollarSign className="h-4 w-4 mr-1" />
                              Edit Price
                            </Button>
                          }
                          service={service}
                          onSubmit={onPriceChange}
                        />
                        <SurchargeManager
                          trigger={
                            <Button size="sm" variant="outline" className="flex-1">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              Surcharges
                            </Button>
                          }
                          service={service}
                          onUpdate={(serviceId, rules) => onSurchargeUpdate(serviceId, rules)}
                        />
                      </div>
                      
                      <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                        Updated {new Date(service.lastUpdated).toLocaleDateString()} by {service.updatedBy}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="surcharges" className="space-y-6">
          <SurchargeManager
            services={filteredServices}
            onUpdate={(serviceId, rules) => onSurchargeUpdate(serviceId, rules)}
          />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <ApprovalQueue
            pendingChanges={pendingChanges}
            onApprove={(changeId) => 
              toast({
                title: "Price Change Approved",
                description: "Change has been approved and is now active.",
              })
            }
            onReject={(changeId, reason) =>
              toast({
                title: "Price Change Rejected", 
                description: `Change rejected: ${reason}`,
                variant: "destructive"
              })
            }
          />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Promotional Campaigns
              </CardTitle>
              <CardDescription>
                Create and manage discount campaigns and promotional pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Campaign management coming soon...</p>
                <p className="text-sm">Set up seasonal discounts, loyalty programs, and promo codes</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};