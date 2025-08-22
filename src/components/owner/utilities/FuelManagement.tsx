import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Fuel, TrendingDown, AlertCircle, Plus, Calendar, Truck } from "lucide-react";
import { useState } from "react";

const mockFuelData = {
  dieselLevel: 75,
  gasLevel: 60,
  totalCapacity: 10000,
  currentStock: 7500,
  monthlyConsumption: 1200,
  estimatedDays: 25,
};

const mockFuelHistory = [
  { id: 1, date: "2024-01-15", type: "Diesel", quantity: 2000, cost: 180000, supplier: "Shell Nigeria", status: "delivered" },
  { id: 2, date: "2024-01-10", type: "Gas", quantity: 500, cost: 45000, supplier: "Total Gas", status: "delivered" },
  { id: 3, date: "2024-01-05", type: "Diesel", quantity: 1500, cost: 135000, supplier: "Mobil Oil", status: "delivered" },
  { id: 4, date: "2024-01-02", type: "Gas", quantity: 300, cost: 27000, supplier: "Total Gas", status: "pending" },
];

const mockConsumptionPattern = [
  { period: "Week 1", diesel: 280, gas: 120 },
  { period: "Week 2", diesel: 320, gas: 140 },
  { period: "Week 3", diesel: 300, gas: 135 },
  { period: "Week 4", diesel: 300, gas: 125 },
];

export default function FuelManagement() {
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Fuel Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diesel Level</CardTitle>
            <Fuel className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockFuelData.dieselLevel}%</div>
            <Progress value={mockFuelData.dieselLevel} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">5,625L remaining</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Level</CardTitle>
            <Fuel className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockFuelData.gasLevel}%</div>
            <Progress value={mockFuelData.gasLevel} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">1,800L remaining</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockFuelData.monthlyConsumption}L</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
              8% less than last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockFuelData.estimatedDays}</div>
            <p className="text-xs text-muted-foreground">At current usage rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fuel Inventory */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Fuel Inventory</CardTitle>
              <CardDescription>Current stock levels and consumption tracking</CardDescription>
            </div>
            <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Order Fuel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Order Fuel</DialogTitle>
                  <DialogDescription>Place a new fuel order for the hotel</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="fuel-type">Fuel Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="gas">Gas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity (Liters)</Label>
                    <Input id="quantity" type="number" placeholder="Enter quantity" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shell">Shell Nigeria</SelectItem>
                        <SelectItem value="total">Total Gas</SelectItem>
                        <SelectItem value="mobil">Mobil Oil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery-date">Delivery Date</Label>
                    <Input id="delivery-date" type="date" />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsOrderDialogOpen(false)}>
                    Place Order
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Cost (₦)</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockFuelHistory.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>{order.type}</TableCell>
                    <TableCell>{order.quantity}L</TableCell>
                    <TableCell>₦{order.cost.toLocaleString()}</TableCell>
                    <TableCell>{order.supplier}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Alerts & Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Fuel Alerts</CardTitle>
            <CardDescription>Notifications and recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-orange-200 bg-orange-50">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">Low Diesel Alert</p>
                <p className="text-xs text-orange-700">Diesel level below 80%. Consider reordering.</p>
                <Button variant="link" className="h-auto p-0 text-xs text-orange-600">
                  Order Now
                </Button>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border border-blue-200 bg-blue-50">
              <Truck className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Delivery Scheduled</p>
                <p className="text-xs text-blue-700">2000L diesel delivery tomorrow at 10 AM</p>
                <p className="text-xs text-blue-600">Shell Nigeria</p>
              </div>
            </div>

            <div className="pt-4">
              <h4 className="text-sm font-medium mb-2">Weekly Consumption</h4>
              <div className="space-y-2">
                {mockConsumptionPattern.map((week, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{week.period}</span>
                    <div className="space-x-2">
                      <span>D: {week.diesel}L</span>
                      <span>G: {week.gas}L</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}