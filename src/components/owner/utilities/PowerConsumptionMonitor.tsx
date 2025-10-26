// @ts-nocheck
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Zap, TrendingUp, TrendingDown, AlertTriangle, Battery, Power } from "lucide-react";
import { useUtilitiesData } from "@/hooks/data/useUtilitiesData";
import { format } from "date-fns";

export default function PowerConsumptionMonitor() {
  const { powerLogs, isLoading } = useUtilitiesData();

  if (isLoading) {
    return <div>Loading power consumption data...</div>;
  }

  // Calculate current status from latest power log
  const latestLog = powerLogs[0];
  const currentStatus = {
    totalConsumption: latestLog?.consumption_kwh || 0,
    peakDemand: Math.max(...powerLogs.map(log => log.consumption_kwh || 0)),
    powerFactor: 0.92, // Would need separate power_factor column
    gridStatus: "stable",
    generatorStatus: "standby",
    backupLevel: 95,
  };

  // Format consumption data for charts
  const consumptionData = powerLogs.slice(0, 6).reverse().map(log => ({
    time: format(new Date(log.reading_date), "HH:mm"),
    total: log.consumption_kwh,
    hvac: log.consumption_kwh * 0.4, // Simulated breakdown
    lighting: log.consumption_kwh * 0.2,
    kitchen: log.consumption_kwh * 0.25,
    other: log.consumption_kwh * 0.15,
  }));
  return (
    <div className="space-y-6">
      {/* Current Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Load</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStatus.totalConsumption.toFixed(1)} kW</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Demand</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStatus.peakDemand.toFixed(1)} kW</div>
            <p className="text-xs text-muted-foreground">Today's maximum</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Power Factor</CardTitle>
            <Power className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStatus.powerFactor.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Efficiency rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backup Power</CardTitle>
            <Battery className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStatus.backupLevel}%</div>
            <Badge variant={currentStatus.generatorStatus === "standby" ? "secondary" : "destructive"}>
              {currentStatus.generatorStatus}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Power Consumption Trend */}
      <Card>
        <CardHeader>
          <CardTitle>24-Hour Power Consumption</CardTitle>
          <CardDescription>Real-time power usage across different systems</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={consumptionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} name="Total" />
              <Line type="monotone" dataKey="hvac" stroke="hsl(var(--chart-1))" name="HVAC" />
              <Line type="monotone" dataKey="lighting" stroke="hsl(var(--chart-2))" name="Lighting" />
              <Line type="monotone" dataKey="kitchen" stroke="hsl(var(--chart-3))" name="Kitchen" />
              <Line type="monotone" dataKey="other" stroke="hsl(var(--chart-4))" name="Other" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Current System Breakdown</CardTitle>
            <CardDescription>Power distribution by department</CardDescription>
          </CardHeader>
          <CardContent>
          <ResponsiveContainer width="100%" height={300}>
              <BarChart data={consumptionData.slice(-1)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hvac" stackId="a" fill="hsl(var(--chart-1))" name="HVAC" />
                <Bar dataKey="lighting" stackId="a" fill="hsl(var(--chart-2))" name="Lighting" />
                <Bar dataKey="kitchen" stackId="a" fill="hsl(var(--chart-3))" name="Kitchen" />
                <Bar dataKey="other" stackId="a" fill="hsl(var(--chart-4))" name="Other" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Power Alerts</CardTitle>
            <CardDescription>System notifications and warnings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Peak Load Warning</p>
                <p className="text-xs text-yellow-700">Approaching maximum capacity during dinner hours</p>
                <p className="text-xs text-yellow-600">2 hours ago</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border border-green-200 bg-green-50">
              <Battery className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Generator Test Successful</p>
                <p className="text-xs text-green-700">Weekly backup power test completed successfully</p>
                <p className="text-xs text-green-600">1 day ago</p>
              </div>
            </div>

            <div className="pt-4">
              <Button variant="outline" className="w-full">
                View All Alerts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}