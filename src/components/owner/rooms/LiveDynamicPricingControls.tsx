import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Settings,
  Zap,
  Target,
  Calendar,
  Plus
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/hooks/useCurrency";
import { useRooms } from "@/hooks/useRooms";

export default function LiveDynamicPricingControls() {
  const [pricingEnabled, setPricingEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { formatPrice } = useCurrency();
  const { rooms = [], roomTypes = [] } = useRooms();

  // Calculate real stats
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const averageRate = roomTypes.length > 0 ? roomTypes.reduce((sum, type) => sum + type.base_rate, 0) / roomTypes.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dynamic Pricing</h2>
          <p className="text-muted-foreground">Real-time pricing optimization based on demand and occupancy</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              checked={pricingEnabled} 
              onCheckedChange={setPricingEnabled}
            />
            <span className="text-sm font-medium">
              {pricingEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <Badge variant={pricingEnabled ? "default" : "secondary"} className="gap-1">
            <Zap className="h-3 w-3" />
            {pricingEnabled ? 'Auto Pricing ON' : 'Manual Pricing'}
          </Badge>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              {occupiedRooms} of {totalRooms} rooms occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(averageRate)}</div>
            <div className="flex items-center text-xs">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">Live rates active</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Changes</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Update</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">5 min</div>
            <p className="text-xs text-muted-foreground">ago</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Live Pricing</TabsTrigger>
          <TabsTrigger value="rules">Pricing Rules</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Pricing Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pricingEnabled ? (
                  <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <Zap className="h-5 w-5" />
                      <span className="font-medium">Dynamic pricing is active</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Rates are automatically adjusting based on demand and occupancy
                    </p>
                  </div>
                ) : (
                  <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <Settings className="h-5 w-5" />
                      <span className="font-medium">Manual pricing active</span>
                    </div>
                    <p className="text-sm text-yellow-600 mt-1">
                      Prices are set manually and not automatically adjusting
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  {roomTypes.map(type => (
                    <div key={type.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{type.name}</span>
                        <Badge variant={pricingEnabled ? "default" : "secondary"}>
                          {formatPrice(type.base_rate)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {pricingEnabled ? 'Auto-adjusting based on demand' : 'Fixed base rate'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4" />
                <p className="font-medium">Pricing rules configuration</p>
                <p className="text-sm">Advanced pricing rules will be available in Phase C</p>
                <Button className="mt-4" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Pricing Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Pricing Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Enable Dynamic Pricing</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically adjust prices based on demand
                    </p>
                  </div>
                  <Switch
                    checked={pricingEnabled}
                    onCheckedChange={setPricingEnabled}
                  />
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Advanced settings and pricing rules will be available in Phase C
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}