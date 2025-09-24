import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, BedDouble, DollarSign, Calendar, TrendingUp, Settings } from "lucide-react";
import RoomCategoryManager from "@/components/owner/rooms/RoomCategoryManager";
import RatePlanManager from "@/components/owner/rooms/RatePlanManager";
import DynamicPricingControls from "@/components/owner/rooms/DynamicPricingControls";
import RoomInventoryGrid from "@/components/owner/rooms/RoomInventoryGrid";
import CurrencyTaxSettings from "@/components/owner/financials/CurrencyTaxSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { useRooms } from "@/hooks/useRooms";

export default function Rooms() {
  const [activeTab, setActiveTab] = useState("rooms");
  const { formatPrice, updateSettings } = useCurrency();
  const { rooms = [], roomTypes = [] } = useRooms();

  // Calculate real room stats from API data
  const roomStats = {
    totalRooms: rooms.length,
    availableRooms: rooms.filter(room => room.status === 'available').length,
    occupiedRooms: rooms.filter(room => room.status === 'occupied').length,
    maintenanceRooms: rooms.filter(room => room.status === 'maintenance' || room.status === 'out_of_order').length,
    averageRate: roomTypes.length > 0 ? roomTypes.reduce((sum, type) => sum + type.base_rate, 0) / roomTypes.length : 0,
    revenueToday: 0, // Will be calculated from today's reservations
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rooms & Rates</h1>
          <p className="text-muted-foreground mt-2">
            Manage room inventory, categories, and pricing strategies
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roomStats.totalRooms}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Badge variant="secondary" className="mr-2">
                {roomStats.availableRooms} Available
              </Badge>
              <Badge variant="destructive">
                {roomStats.occupiedRooms} Occupied
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(roomStats.averageRate)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.5%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(roomStats.revenueToday)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.2%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((roomStats.occupiedRooms / roomStats.totalRooms) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {roomStats.occupiedRooms} of {roomStats.totalRooms} rooms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="rooms">Room Inventory</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="rates">Rate Plans</TabsTrigger>
          <TabsTrigger value="pricing">Dynamic Pricing</TabsTrigger>
          <TabsTrigger value="settings">Currency & Tax</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <RoomInventoryGrid />
        </TabsContent>

        <TabsContent value="categories">
          <RoomCategoryManager />
        </TabsContent>

        <TabsContent value="rates">
          <RatePlanManager />
        </TabsContent>

        <TabsContent value="pricing">
          <DynamicPricingControls />
        </TabsContent>

        <TabsContent value="settings">
          <CurrencyTaxSettings onSettingsChange={updateSettings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}