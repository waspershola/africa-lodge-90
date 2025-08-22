import { useState } from "react";
import { Plus, Edit, Calendar, TrendingUp, DollarSign, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import DynamicPricingDialog from "./DynamicPricingDialog";
import ExtraChargesDialog from "./ExtraChargesDialog";

interface RoomRate {
  id: string;
  roomType: string;
  baseRate: number;
  currency: string;
  seasonalRates: {
    peak: number;
    offPeak: number;
  };
  weekendMultiplier: number;
  lastUpdated: string;
}

const mockRoomRates: RoomRate[] = [
  {
    id: '1',
    roomType: 'Standard Room',
    baseRate: 150,
    currency: 'USD',
    seasonalRates: { peak: 200, offPeak: 120 },
    weekendMultiplier: 1.2,
    lastUpdated: '2024-01-15'
  },
  {
    id: '2', 
    roomType: 'Deluxe Room',
    baseRate: 250,
    currency: 'USD',
    seasonalRates: { peak: 320, offPeak: 200 },
    weekendMultiplier: 1.25,
    lastUpdated: '2024-01-15'
  },
  {
    id: '3',
    roomType: 'Suite',
    baseRate: 450,
    currency: 'USD', 
    seasonalRates: { peak: 580, offPeak: 380 },
    weekendMultiplier: 1.3,
    lastUpdated: '2024-01-15'
  }
];

export default function PricingControls() {
  const [roomRates, setRoomRates] = useState<RoomRate[]>(mockRoomRates);
  const [isDynamicPricingOpen, setIsDynamicPricingOpen] = useState(false);
  const [isExtraChargesOpen, setIsExtraChargesOpen] = useState(false);
  const [dynamicPricingEnabled, setDynamicPricingEnabled] = useState(true);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getAverageRate = () => {
    const total = roomRates.reduce((sum, rate) => sum + rate.baseRate, 0);
    return total / roomRates.length;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Daily Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${getAverageRate().toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dynamic Pricing</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={dynamicPricingEnabled}
                onCheckedChange={setDynamicPricingEnabled}
              />
              <span className="text-sm">{dynamicPricingEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Auto-adjust based on demand
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">+18.5%</div>
            <p className="text-xs text-muted-foreground">
              From dynamic pricing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Today</div>
            <p className="text-xs text-muted-foreground">
              All rates synchronized
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Room Rates Configuration</h3>
          <p className="text-sm text-muted-foreground">Manage base rates and seasonal pricing</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsExtraChargesOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Extra Charges
          </Button>
          <Button onClick={() => setIsDynamicPricingOpen(true)}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Dynamic Pricing
          </Button>
        </div>
      </div>

      {/* Room Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Room Type Rates</CardTitle>
          <CardDescription>Configure base rates and seasonal adjustments for each room type</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Type</TableHead>
                <TableHead>Base Rate</TableHead>
                <TableHead>Peak Season</TableHead>
                <TableHead>Off Peak</TableHead>
                <TableHead>Weekend Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>
                    <div className="font-medium">{rate.roomType}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(rate.baseRate, rate.currency)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-accent font-medium">
                      {formatCurrency(rate.seasonalRates.peak, rate.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      +{Math.round(((rate.seasonalRates.peak / rate.baseRate) - 1) * 100)}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-primary font-medium">
                      {formatCurrency(rate.seasonalRates.offPeak, rate.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(((rate.seasonalRates.offPeak / rate.baseRate) - 1) * 100)}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(rate.baseRate * rate.weekendMultiplier, rate.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {rate.weekendMultiplier}x multiplier
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-success/10 text-success border-success/20">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Rate Adjustment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Rate Adjustment</CardTitle>
            <CardDescription>Apply percentage changes to all room rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adjustment">Percentage Change</Label>
                <Input id="adjustment" placeholder="e.g., +10 or -5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Apply To</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rates</SelectItem>
                    <SelectItem value="base">Base Rates Only</SelectItem>
                    <SelectItem value="peak">Peak Season Only</SelectItem>
                    <SelectItem value="weekend">Weekend Rates Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full">Apply Adjustment</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Strategy</CardTitle>
            <CardDescription>Configure automated pricing rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Occupancy-Based Pricing</Label>
                <p className="text-sm text-muted-foreground">Increase rates when occupancy is high</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Competitor Rate Matching</Label>
                <p className="text-sm text-muted-foreground">Auto-adjust based on competitor pricing</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Last-Minute Discounts</Label>
                <p className="text-sm text-muted-foreground">Reduce rates for unsold rooms</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Button variant="outline" className="w-full">Configure Rules</Button>
          </CardContent>
        </Card>
      </div>

      <DynamicPricingDialog
        open={isDynamicPricingOpen}
        onOpenChange={setIsDynamicPricingOpen}
      />

      <ExtraChargesDialog
        open={isExtraChargesOpen}
        onOpenChange={setIsExtraChargesOpen}
      />
    </div>
  );
}