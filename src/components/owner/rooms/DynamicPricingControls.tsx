import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  DollarSign, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { 
  usePricingRules, 
  useDynamicPricingSettings, 
  useCreatePricingRule, 
  useUpdatePricingRule, 
  useUpdateDynamicPricingSettings 
} from "@/hooks/useDynamicPricing";
import NewPricingRuleDialog from "./NewPricingRuleDialog";

interface PricingRule {
  id: string;
  name: string;
  type: "occupancy" | "demand" | "seasonal" | "competitor" | "event";
  isActive: boolean;
  trigger: {
    condition: string;
    value: number;
    operator: ">" | "<" | "=" | ">=" | "<=";
  };
  adjustment: {
    type: "percentage" | "fixed";
    value: number;
    maxIncrease: number;
    maxDecrease: number;
  };
  roomCategories: string[];
  priority: number;
}

interface DynamicPricingSettings {
  isEnabled: boolean;
  updateFrequency: number; // minutes
  maxPriceIncrease: number; // percentage
  maxPriceDecrease: number; // percentage
  competitorSync: boolean;
  demandForecast: boolean;
  eventIntegration: boolean;
}

const mockPricingRules: PricingRule[] = [
  {
    id: "1",
    name: "High Occupancy Surge",
    type: "occupancy",
    isActive: true,
    trigger: {
      condition: "occupancy_rate",
      value: 85,
      operator: ">="
    },
    adjustment: {
      type: "percentage",
      value: 20,
      maxIncrease: 50,
      maxDecrease: 0
    },
    roomCategories: ["Standard", "Deluxe"],
    priority: 1
  },
  {
    id: "2",
    name: "Low Demand Discount",
    type: "demand",
    isActive: true,
    trigger: {
      condition: "advance_bookings",
      value: 30,
      operator: "<"
    },
    adjustment: {
      type: "percentage",
      value: -15,
      maxIncrease: 0,
      maxDecrease: 30
    },
    roomCategories: ["All"],
    priority: 2
  },
  {
    id: "3",
    name: "Weekend Premium",
    type: "seasonal",
    isActive: true,
    trigger: {
      condition: "day_of_week",
      value: 6,
      operator: ">="
    },
    adjustment: {
      type: "percentage",
      value: 25,
      maxIncrease: 40,
      maxDecrease: 0
    },
    roomCategories: ["Suite"],
    priority: 3
  }
];

const mockSettings: DynamicPricingSettings = {
  isEnabled: true,
  updateFrequency: 30,
  maxPriceIncrease: 50,
  maxPriceDecrease: 30,
  competitorSync: true,
  demandForecast: true,
  eventIntegration: false
};

const ruleTypeColors = {
  occupancy: "bg-blue-500",
  demand: "bg-green-500",
  seasonal: "bg-orange-500",
  competitor: "bg-purple-500",
  event: "bg-red-500"
};

const ruleTypeLabels = {
  occupancy: "Occupancy",
  demand: "Demand",
  seasonal: "Seasonal",
  competitor: "Competitor",
  event: "Event"
};

export default function DynamicPricingControls() {
  const [activeTab, setActiveTab] = useState("rules");
  const [showNewRuleDialog, setShowNewRuleDialog] = useState(false);
  const { formatPrice } = useCurrency();
  
  // Real database hooks
  const { data: pricingRulesData, isLoading: rulesLoading } = usePricingRules();
  const { data: settingsData, isLoading: settingsLoading } = useDynamicPricingSettings();
  const createPricingRule = useCreatePricingRule();
  const updatePricingRule = useUpdatePricingRule();
  const updateSettings = useUpdateDynamicPricingSettings();
  
  const pricingRules = pricingRulesData || [];
  const settings = settingsData || {
    id: '',
    tenant_id: '',
    is_enabled: false,
    update_frequency: 30,
    max_price_increase: 50,
    max_price_decrease: 30,
    competitor_sync: false,
    demand_forecast: false,
    event_integration: false,
    created_at: '',
    updated_at: ''
  };

  const toggleRule = async (ruleId: string) => {
    try {
      const rule = pricingRules.find(r => r.id === ruleId);
      if (rule) {
        await updatePricingRule.mutateAsync({
          id: ruleId,
          is_active: !rule.is_active
        });
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const updateSettingsValue = async (key: string, value: any) => {
    try {
      await updateSettings.mutateAsync({ [key]: value });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  // Mock current pricing data (would come from analytics in real app)
  const currentPricing = {
    occupancyRate: 78,
    averageRate: 165,
    rateChange: 12,
    demandForecast: 85,
    activeRules: pricingRules.filter(rule => rule.is_active).length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dynamic Pricing</h2>
          <p className="text-muted-foreground">Automated pricing optimization based on demand, occupancy, and market conditions</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              checked={settings.is_enabled} 
              onCheckedChange={(checked) => updateSettingsValue('is_enabled', checked)}
            />
            <span className="text-sm font-medium">
              {settings.is_enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <Badge variant={settings.is_enabled ? "default" : "secondary"} className="gap-1">
            <Zap className="h-3 w-3" />
            {settings.is_enabled ? 'Auto Pricing ON' : 'Manual Pricing'}
          </Badge>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPricing.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(currentPricing.averageRate)}</div>
            <div className="flex items-center text-xs">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">+{currentPricing.rateChange}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demand Forecast</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPricing.demandForecast}%</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPricing.activeRules}</div>
            <p className="text-xs text-muted-foreground">
              of {pricingRules.length} total rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Update</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">15 min</div>
            <p className="text-xs text-muted-foreground">ago</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Pricing Rules</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pricing Rules</h3>
            <Button onClick={() => setShowNewRuleDialog(true)}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Create New Rule
            </Button>
          </div>

          <div className="grid gap-4">
            {pricingRules.map((rule) => (
              <Card key={rule.id} className={`${!rule.is_active ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${ruleTypeColors[rule.type]}`} />
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <Badge variant="outline">
                        {ruleTypeLabels[rule.type]}
                      </Badge>
                      <Badge variant="secondary">
                        Priority {rule.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {rule.is_active ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <span className="text-sm font-medium">Trigger Condition</span>
                        <p className="text-sm text-muted-foreground">
                          {rule.trigger_condition.replace('_', ' ')} {rule.trigger_operator} {rule.trigger_value}
                          {rule.trigger_condition === 'occupancy_rate' ? '%' : ''}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-sm font-medium">Price Adjustment</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-sm font-medium ${
                            rule.adjustment_value >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {rule.adjustment_value >= 0 ? '+' : ''}{rule.adjustment_value}
                            {rule.adjustment_type === 'percentage' ? '%' : '$'}
                          </span>
                          {rule.adjustment_value >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-sm font-medium">Room Categories</span>
                        <div className="flex flex-wrap gap-1">
                          {rule.room_categories.map((category, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Max Increase:</span>
                        <span className="font-medium">{rule.max_increase}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Max Decrease:</span>
                        <span className="font-medium">{rule.max_decrease}%</span>
                      </div>
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Pricing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Update Frequency (minutes)</Label>
                    <Select
                      value={settings.update_frequency.toString()}
                      onValueChange={(value) => updateSettingsValue('update_frequency', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Maximum Price Increase (%)</Label>
                    <Slider
                      value={[settings.max_price_increase]}
                      onValueChange={([value]) => updateSettingsValue('max_price_increase', value)}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <div className="text-right text-sm text-muted-foreground">
                      {settings.max_price_increase}%
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Maximum Price Decrease (%)</Label>
                    <Slider
                      value={[settings.max_price_decrease]}
                      onValueChange={([value]) => updateSettingsValue('max_price_decrease', value)}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                    <div className="text-right text-sm text-muted-foreground">
                      {settings.max_price_decrease}%
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Competitor Price Sync</Label>
                      <p className="text-sm text-muted-foreground">
                        Monitor competitor rates and adjust accordingly
                      </p>
                    </div>
                    <Switch
                      checked={settings.competitor_sync}
                      onCheckedChange={(checked) => updateSettingsValue('competitor_sync', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Demand Forecasting</Label>
                      <p className="text-sm text-muted-foreground">
                        Use AI to predict future demand patterns
                      </p>
                    </div>
                    <Switch
                      checked={settings.demand_forecast}
                      onCheckedChange={(checked) => updateSettingsValue('demand_forecast', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Event Integration</Label>
                      <p className="text-sm text-muted-foreground">
                        Adjust pricing based on local events and holidays
                      </p>
                    </div>
                    <Switch
                      checked={settings.event_integration}
                      onCheckedChange={(checked) => updateSettingsValue('event_integration', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button className="w-full">
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">This Week</span>
                    <span className="text-lg font-bold text-green-600">+$12,450</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">This Month</span>
                    <span className="text-lg font-bold text-green-600">+$45,230</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">YTD</span>
                    <span className="text-lg font-bold text-green-600">+$156,890</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rule Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>High Occupancy Surge</span>
                    <Badge variant="default">+18.5%</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Weekend Premium</span>
                    <Badge variant="default">+12.3%</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Low Demand Discount</span>
                    <Badge variant="secondary">-8.2%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <NewPricingRuleDialog 
        open={showNewRuleDialog} 
        onOpenChange={setShowNewRuleDialog}
      />
    </div>
  );
}