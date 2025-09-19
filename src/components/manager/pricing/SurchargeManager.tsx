import { useState } from 'react';
import { Percent, Clock, Calendar, Plus, Settings, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import type { ServicePricing, SurchargeRule } from '@/types/pricing';

interface SurchargeManagerProps {
  trigger?: React.ReactNode;
  service?: ServicePricing;
  services?: ServicePricing[];
  onUpdate: (serviceId: string | 'global', rules: SurchargeRule[]) => void;
}

export const SurchargeManager = ({ trigger, service, services, onUpdate }: SurchargeManagerProps) => {
  const [open, setOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(service?.id || services?.[0]?.id || '');
  const [newRule, setNewRule] = useState<Partial<SurchargeRule>>({
    type: 'time-based',
    name: '',
    percentage: 0,
    active: true,
    conditions: {}
  });
  const { toast } = useToast();

  const currentService = service || services?.find(s => s.id === selectedService);
  const existingRules = currentService?.surchargeRules || [];

  const handleAddRule = () => {
    if (!newRule.name || !newRule.percentage) {
      toast({
        title: "Validation Error",
        description: "Please fill in rule name and percentage.",
        variant: "destructive"
      });
      return;
    }

    const rule: SurchargeRule = {
      ...newRule as SurchargeRule,
      conditions: {
        ...newRule.conditions,
        timeRange: newRule.type === 'time-based' ? { start: '22:00', end: '06:00' } : undefined,
        days: newRule.type === 'time-based' ? ['saturday', 'sunday'] : undefined,
      }
    };

    const updatedRules = [...existingRules, rule];
    onUpdate(selectedService, updatedRules);

    setNewRule({
      type: 'time-based',
      name: '',
      percentage: 0,
      active: true,
      conditions: {}
    });

    toast({
      title: "Surcharge Rule Added",
      description: `${rule.name} has been added successfully.`,
    });
  };

  const handleToggleRule = (index: number) => {
    const updatedRules = [...existingRules];
    updatedRules[index] = { ...updatedRules[index], active: !updatedRules[index].active };
    onUpdate(selectedService, updatedRules);
  };

  const handleDeleteRule = (index: number) => {
    const updatedRules = existingRules.filter((_, i) => i !== index);
    onUpdate(selectedService, updatedRules);
    
    toast({
      title: "Surcharge Rule Deleted",
      description: "Rule has been removed successfully.",
    });
  };

  const getSurchargeTypeIcon = (type: string) => {
    switch (type) {
      case 'time-based': return <Clock className="h-4 w-4" />;
      case 'seasonal': return <Calendar className="h-4 w-4" />;
      default: return <Percent className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Percent className="h-4 w-4 mr-2" />
            Manage Surcharges
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Dynamic Pricing & Surcharge Rules
          </DialogTitle>
          <DialogDescription>
            Configure time-based, seasonal, and demand-based pricing adjustments
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Selection & Current Rules */}
          <div className="space-y-4">
            {services && (
              <div className="space-y-2">
                <Label>Select Service</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose service to configure" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.itemName} ({s.serviceType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Surcharge Rules</CardTitle>
                <CardDescription>
                  {currentService?.itemName || 'Select a service'} - Active pricing adjustments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {existingRules.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <Percent className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No surcharge rules configured</p>
                  </div>
                ) : (
                  existingRules.map((rule, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getSurchargeTypeIcon(rule.type)}
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-muted-foreground">
                            +{rule.percentage}% • {rule.type.replace('-', ' ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.active ? "default" : "secondary"}>
                          {rule.active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Switch
                          checked={rule.active}
                          onCheckedChange={() => handleToggleRule(index)}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteRule(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Add New Rule */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Surcharge Rule</CardTitle>
                <CardDescription>
                  Create dynamic pricing adjustments based on various conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    value={newRule.name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Night Service Premium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Surcharge Type</Label>
                    <Select 
                      value={newRule.type} 
                      onValueChange={(value) => setNewRule(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="time-based">Time-Based</SelectItem>
                        <SelectItem value="seasonal">Seasonal</SelectItem>
                        <SelectItem value="demand-based">Demand-Based</SelectItem>
                        <SelectItem value="room-type">Room Type</SelectItem>
                        <SelectItem value="bulk-discount">Bulk Discount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="percentage">Surcharge (%)</Label>
                    <Input
                      id="percentage"
                      type="number"
                      value={newRule.percentage}
                      onChange={(e) => setNewRule(prev => ({ ...prev, percentage: parseFloat(e.target.value) || 0 }))}
                      placeholder="10"
                    />
                  </div>
                </div>

                {/* Conditional Configuration */}
                {newRule.type === 'time-based' && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={newRule.conditions?.timeRange?.start || '22:00'}
                          onChange={(e) => setNewRule(prev => ({
                            ...prev,
                            conditions: {
                              ...prev.conditions,
                              timeRange: { 
                                ...prev.conditions?.timeRange,
                                start: e.target.value,
                                end: prev.conditions?.timeRange?.end || '06:00'
                              }
                            }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={newRule.conditions?.timeRange?.end || '06:00'}
                          onChange={(e) => setNewRule(prev => ({
                            ...prev,
                            conditions: {
                              ...prev.conditions,
                              timeRange: { 
                                ...prev.conditions?.timeRange,
                                start: prev.conditions?.timeRange?.start || '22:00',
                                end: e.target.value
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Apply on Days</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select days" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekdays">Weekdays Only</SelectItem>
                          <SelectItem value="weekends">Weekends Only</SelectItem>
                          <SelectItem value="all">All Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {newRule.type === 'seasonal' && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label>Season/Period</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select season" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="festive">Festive Season</SelectItem>
                          <SelectItem value="summer">Summer Peak</SelectItem>
                          <SelectItem value="rainy">Rainy Season</SelectItem>
                          <SelectItem value="custom">Custom Period</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newRule.active}
                      onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, active: checked }))}
                    />
                    <Label>Activate Immediately</Label>
                  </div>
                  <Button onClick={handleAddRule}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setNewRule({
                    type: 'time-based',
                    name: 'Night Service Premium',
                    percentage: 20,
                    active: true,
                    conditions: {
                      timeRange: { start: '22:00', end: '06:00' }
                    }
                  })}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Night Premium (+20%)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setNewRule({
                    type: 'time-based',
                    name: 'Weekend Surcharge',
                    percentage: 15,
                    active: true,
                    conditions: {
                      days: ['saturday', 'sunday']
                    }
                  })}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Weekend Surcharge (+15%)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={() => {
            toast({
              title: "Surcharge Rules Saved",
              description: "All changes have been applied successfully.",
            });
            setOpen(false);
          }}>
            <Settings className="h-4 w-4 mr-2" />
            Save All Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};