import { useState } from 'react';
import { Settings, Clock, DollarSign, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface ServiceConfigDialogProps {
  trigger: React.ReactNode;
  serviceName: string;
  currentConfig: {
    enabled: boolean;
    pricing: string;
    availability: string;
    surcharge: string;
  };
}

export const ServiceConfigDialog = ({ trigger, serviceName, currentConfig }: ServiceConfigDialogProps) => {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(currentConfig);
  const [timeRestrictions, setTimeRestrictions] = useState({
    enabled: false,
    startTime: '06:00',
    endTime: '23:00',
    weekdayOnly: false
  });
  const [pricingRules, setPricingRules] = useState({
    basePrice: 0,
    nightSurcharge: 20,
    weekendSurcharge: 15,
    peakHourSurcharge: 10
  });
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: `${serviceName} Configuration Updated`,
      description: "Service settings have been saved successfully.",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure {serviceName}
          </DialogTitle>
          <DialogDescription>
            Set availability, pricing rules, and access controls for {serviceName}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Service Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow guests to access this service via QR code
                  </p>
                </div>
                <Switch 
                  checked={config.enabled}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-name">Service Display Name</Label>
                <Input
                  id="service-name"
                  value={serviceName}
                  placeholder="Service name as shown to guests"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Service Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description for guests"
                />
              </div>

              <div className="space-y-2">
                <Label>Priority Level</Label>
                <Select defaultValue="normal">
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="normal">Normal Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Pricing Model</Label>
                <Select defaultValue="fixed">
                  <SelectTrigger>
                    <SelectValue placeholder="Select pricing model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free Service</SelectItem>
                    <SelectItem value="fixed">Fixed Rate</SelectItem>
                    <SelectItem value="dynamic">Dynamic Pricing</SelectItem>
                    <SelectItem value="tiered">Tiered Pricing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base-price">Base Price (₦)</Label>
                  <Input
                    id="base-price"
                    type="number"
                    value={pricingRules.basePrice}
                    onChange={(e) => setPricingRules(prev => ({ 
                      ...prev, 
                      basePrice: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select defaultValue="ngn">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ngn">Nigerian Naira (₦)</SelectItem>
                      <SelectItem value="usd">US Dollar ($)</SelectItem>
                      <SelectItem value="eur">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Surcharge Rules</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Night Service Surcharge</Label>
                      <p className="text-xs text-muted-foreground">10 PM - 6 AM</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-20 text-center"
                        value={pricingRules.nightSurcharge}
                        onChange={(e) => setPricingRules(prev => ({ 
                          ...prev, 
                          nightSurcharge: parseInt(e.target.value) || 0 
                        }))}
                      />
                      <span className="text-sm">%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Weekend Surcharge</Label>
                      <p className="text-xs text-muted-foreground">Friday - Sunday</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-20 text-center"
                        value={pricingRules.weekendSurcharge}
                        onChange={(e) => setPricingRules(prev => ({ 
                          ...prev, 
                          weekendSurcharge: parseInt(e.target.value) || 0 
                        }))}
                      />
                      <span className="text-sm">%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Peak Hour Surcharge</Label>
                      <p className="text-xs text-muted-foreground">7-9 AM, 6-8 PM</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-20 text-center"
                        value={pricingRules.peakHourSurcharge}
                        onChange={(e) => setPricingRules(prev => ({ 
                          ...prev, 
                          peakHourSurcharge: parseInt(e.target.value) || 0 
                        }))}
                      />
                      <span className="text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="availability" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Time Restrictions</Label>
                  <p className="text-sm text-muted-foreground">
                    Limit service availability to specific hours
                  </p>
                </div>
                <Switch 
                  checked={timeRestrictions.enabled}
                  onCheckedChange={(checked) => 
                    setTimeRestrictions(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              {timeRestrictions.enabled && (
                <div className="space-y-4 pl-4 border-l-2 border-muted">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-time">Start Time</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={timeRestrictions.startTime}
                        onChange={(e) => setTimeRestrictions(prev => ({ 
                          ...prev, 
                          startTime: e.target.value 
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end-time">End Time</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={timeRestrictions.endTime}
                        onChange={(e) => setTimeRestrictions(prev => ({ 
                          ...prev, 
                          endTime: e.target.value 
                        }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Weekdays Only</Label>
                      <p className="text-xs text-muted-foreground">
                        Disable service on weekends
                      </p>
                    </div>
                    <Switch 
                      checked={timeRestrictions.weekdayOnly}
                      onCheckedChange={(checked) => 
                        setTimeRestrictions(prev => ({ ...prev, weekdayOnly: checked }))
                      }
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Special Availability Rules</Label>
                <Select defaultValue="always">
                  <SelectTrigger>
                    <SelectValue placeholder="Select availability rule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">Always Available</SelectItem>
                    <SelectItem value="business-hours">Business Hours Only</SelectItem>
                    <SelectItem value="custom">Custom Schedule</SelectItem>
                    <SelectItem value="on-demand">On-Demand Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="restrictions" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Room Type Restrictions</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Select room types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Room Types</SelectItem>
                    <SelectItem value="standard">Standard Rooms Only</SelectItem>
                    <SelectItem value="deluxe">Deluxe & Above</SelectItem>
                    <SelectItem value="suite">Suites Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-requests">Maximum Requests per Day</Label>
                <Input
                  id="max-requests"
                  type="number"
                  placeholder="Enter limit (0 = unlimited)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-advance">Minimum Advance Notice</Label>
                <Select defaultValue="none">
                  <SelectTrigger>
                    <SelectValue placeholder="Select advance notice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Advance Notice</SelectItem>
                    <SelectItem value="15min">15 Minutes</SelectItem>
                    <SelectItem value="30min">30 Minutes</SelectItem>
                    <SelectItem value="1hour">1 Hour</SelectItem>
                    <SelectItem value="2hour">2 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Require Staff Approval</Label>
                  <p className="text-xs text-muted-foreground">
                    All requests need manual approval
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Settings className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};