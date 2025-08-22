import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, BedDouble, DollarSign, Calendar, TrendingUp } from "lucide-react";
import RoomCategoryManager from "@/components/owner/rooms/RoomCategoryManager";
import RatePlanManager from "@/components/owner/rooms/RatePlanManager";
import DynamicPricingControls from "@/components/owner/rooms/DynamicPricingControls";
import RoomInventoryGrid from "@/components/owner/rooms/RoomInventoryGrid";

export default function Rooms() {
  const [activeTab, setActiveTab] = useState("rooms");

  // Mock data for overview cards
  const roomStats = {
    totalRooms: 150,
    availableRooms: 120,
    occupiedRooms: 25,
    maintenanceRooms: 5,
    averageRate: 185,
    revenueToday: 4625,
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
            <div className="text-2xl font-bold">${roomStats.averageRate}</div>
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
            <div className="text-2xl font-bold">${roomStats.revenueToday.toLocaleString()}</div>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rooms">Room Inventory</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="rates">Rate Plans</TabsTrigger>
          <TabsTrigger value="pricing">Dynamic Pricing</TabsTrigger>
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
      </Tabs>
    </div>
  );
}