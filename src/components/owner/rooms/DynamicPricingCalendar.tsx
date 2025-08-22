import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, DollarSign, Edit, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { format, isSameDay, addDays, startOfWeek, endOfWeek } from "date-fns";

interface PricingRule {
  id: string;
  name: string;
  description: string;
  type: 'weekend' | 'seasonal' | 'promotion' | 'custom';
  startDate: Date;
  endDate: Date;
  modifier: number; // Percentage or fixed amount
  modifierType: 'percentage' | 'fixed';
  categoryId?: string;
  isActive: boolean;
}

interface DayPricing {
  date: Date;
  baseRate: number;
  finalRate: number;
  rules: PricingRule[];
  occupancyRate: number;
}

const mockPricingRules: PricingRule[] = [
  {
    id: '1',
    name: 'Weekend Premium',
    description: 'Higher rates for weekend stays',
    type: 'weekend',
    startDate: new Date(),
    endDate: addDays(new Date(), 365),
    modifier: 25,
    modifierType: 'percentage',
    isActive: true
  },
  {
    id: '2',
    name: 'Peak Season',
    description: 'Holiday season pricing',
    type: 'seasonal',
    startDate: new Date(2024, 11, 15), // Dec 15
    endDate: new Date(2025, 0, 5), // Jan 5
    modifier: 50,
    modifierType: 'percentage',
    isActive: true
  },
  {
    id: '3',
    name: 'Early Bird Discount',
    description: '20% off for bookings 30 days ahead',
    type: 'promotion',
    startDate: new Date(),
    endDate: addDays(new Date(), 90),
    modifier: -20,
    modifierType: 'percentage',
    isActive: true
  }
];

export default function DynamicPricingCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(mockPricingRules);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PricingRule | null>(null);
  const [isNewRule, setIsNewRule] = useState(false);

  const baseRate = 45000; // Base rate for calculation

  // Generate pricing data for calendar view
  const generateDayPricing = (date: Date): DayPricing => {
    const applicableRules = pricingRules.filter(rule => 
      rule.isActive && 
      date >= rule.startDate && 
      date <= rule.endDate
    );

    let finalRate = baseRate;
    applicableRules.forEach(rule => {
      if (rule.modifierType === 'percentage') {
        finalRate = finalRate * (1 + rule.modifier / 100);
      } else {
        finalRate += rule.modifier;
      }
    });

    return {
      date,
      baseRate,
      finalRate: Math.round(finalRate),
      rules: applicableRules,
      occupancyRate: Math.random() * 100 // Mock occupancy
    };
  };

  const handleNewRule = () => {
    setSelectedRule({
      id: '',
      name: '',
      description: '',
      type: 'custom',
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      modifier: 0,
      modifierType: 'percentage',
      isActive: true
    });
    setIsNewRule(true);
    setIsRuleDialogOpen(true);
  };

  const handleEditRule = (rule: PricingRule) => {
    setSelectedRule({ ...rule });
    setIsNewRule(false);
    setIsRuleDialogOpen(true);
  };

  const handleSaveRule = () => {
    if (!selectedRule) return;

    if (isNewRule) {
      setPricingRules([...pricingRules, { ...selectedRule, id: Date.now().toString() }]);
    } else {
      setPricingRules(pricingRules.map(rule => 
        rule.id === selectedRule.id ? selectedRule : rule
      ));
    }
    setIsRuleDialogOpen(false);
    setSelectedRule(null);
  };

  const selectedDayPricing = selectedDate ? generateDayPricing(selectedDate) : null;

  const getRuleTypeBadge = (type: string) => {
    const variants = {
      weekend: 'default',
      seasonal: 'secondary',
      promotion: 'destructive',
      custom: 'outline'
    };
    return variants[type as keyof typeof variants] || 'outline';
  };

  const getRuleTypeColor = (type: string) => {
    const colors = {
      weekend: 'bg-blue-500',
      seasonal: 'bg-orange-500',
      promotion: 'bg-green-500',
      custom: 'bg-purple-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Dynamic Pricing Calendar</h3>
          <p className="text-sm text-muted-foreground">
            Set seasonal rates, weekend premiums, and promotional pricing
          </p>
        </div>
        <Button onClick={handleNewRule} className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Pricing Rule
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 luxury-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Pricing Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                weekend: (date) => date.getDay() === 0 || date.getDay() === 6,
                promotion: (date) => {
                  const dayPricing = generateDayPricing(date);
                  return dayPricing.rules.some(rule => rule.type === 'promotion');
                }
              }}
              modifiersStyles={{
                weekend: { backgroundColor: 'hsl(var(--primary) / 0.1)' },
                promotion: { backgroundColor: 'hsl(var(--success) / 0.1)' }
              }}
            />
            
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary/10"></div>
                <span>Weekend</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-success/10"></div>
                <span>Promotion</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <div className="space-y-4">
          {selectedDayPricing && (
            <Card className="luxury-card">
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDayPricing.date, 'EEEE, MMM d')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Base Rate:</span>
                    <span>₦{selectedDayPricing.baseRate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Final Rate:</span>
                    <span className="text-primary">
                      ₦{selectedDayPricing.finalRate.toLocaleString()}
                    </span>
                  </div>
                  {selectedDayPricing.finalRate !== selectedDayPricing.baseRate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Change:</span>
                      <span className={
                        selectedDayPricing.finalRate > selectedDayPricing.baseRate 
                          ? 'text-success' 
                          : 'text-destructive'
                      }>
                        {selectedDayPricing.finalRate > selectedDayPricing.baseRate ? '+' : ''}
                        {Math.round(((selectedDayPricing.finalRate - selectedDayPricing.baseRate) / selectedDayPricing.baseRate) * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {selectedDayPricing.rules.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Active Rules:</h4>
                    <div className="space-y-2">
                      {selectedDayPricing.rules.map(rule => (
                        <div key={rule.id} className="text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded ${getRuleTypeColor(rule.type)}`}></div>
                            <span className="font-medium">{rule.name}</span>
                          </div>
                          <div className="text-muted-foreground ml-4">
                            {rule.modifier > 0 ? '+' : ''}{rule.modifier}
                            {rule.modifierType === 'percentage' ? '%' : '₦'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="text-lg">Pricing Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Rules:</span>
                <span className="font-medium">{pricingRules.filter(r => r.isActive).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Weekend Premium:</span>
                <span className="font-medium text-primary">+25%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg. Increase:</span>
                <span className="font-medium text-success">+15%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pricing Rules List */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle>Pricing Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pricingRules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded ${getRuleTypeColor(rule.type)}`}></div>
                  <div>
                    <div className="font-medium">{rule.name}</div>
                    <div className="text-sm text-muted-foreground">{rule.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={getRuleTypeBadge(rule.type) as any}>
                    {rule.type}
                  </Badge>
                  <div className="text-sm">
                    {rule.modifier > 0 ? '+' : ''}{rule.modifier}
                    {rule.modifierType === 'percentage' ? '%' : '₦'}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rule Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isNewRule ? 'Create Pricing Rule' : 'Edit Pricing Rule'}
            </DialogTitle>
          </DialogHeader>

          {selectedRule && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="ruleName">Rule Name</Label>
                <Input
                  id="ruleName"
                  value={selectedRule.name}
                  onChange={(e) => setSelectedRule({
                    ...selectedRule,
                    name: e.target.value
                  })}
                  placeholder="e.g. Summer Special"
                />
              </div>

              <div>
                <Label htmlFor="ruleDescription">Description</Label>
                <Textarea
                  id="ruleDescription"
                  value={selectedRule.description}
                  onChange={(e) => setSelectedRule({
                    ...selectedRule,
                    description: e.target.value
                  })}
                  placeholder="Describe this pricing rule..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ruleType">Type</Label>
                  <Select
                    value={selectedRule.type}
                    onValueChange={(value: any) => setSelectedRule({
                      ...selectedRule,
                      type: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekend">Weekend</SelectItem>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="modifierType">Modifier Type</Label>
                  <Select
                    value={selectedRule.modifierType}
                    onValueChange={(value: any) => setSelectedRule({
                      ...selectedRule,
                      modifierType: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="modifier">
                  Modifier ({selectedRule.modifierType === 'percentage' ? '%' : '₦'})
                </Label>
                <Input
                  id="modifier"
                  type="number"
                  value={selectedRule.modifier}
                  onChange={(e) => setSelectedRule({
                    ...selectedRule,
                    modifier: parseInt(e.target.value) || 0
                  })}
                  placeholder="25"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule} className="bg-gradient-primary">
              {isNewRule ? 'Create Rule' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}