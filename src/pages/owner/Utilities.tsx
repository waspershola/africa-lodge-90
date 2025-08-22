import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PowerConsumptionMonitor from "@/components/owner/utilities/PowerConsumptionMonitor";
import FuelManagement from "@/components/owner/utilities/FuelManagement";
import UtilityCostTracking from "@/components/owner/utilities/UtilityCostTracking";
import EnergyEfficiencyMetrics from "@/components/owner/utilities/EnergyEfficiencyMetrics";

export default function Utilities() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">Power & Fuel Management</h1>
        <p className="text-muted-foreground">Monitor power consumption, manage fuel inventory, and track utility costs.</p>
      </div>

      <Tabs defaultValue="power" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="power">Power Monitoring</TabsTrigger>
          <TabsTrigger value="fuel">Fuel Management</TabsTrigger>
          <TabsTrigger value="costs">Cost Tracking</TabsTrigger>
          <TabsTrigger value="efficiency">Energy Efficiency</TabsTrigger>
        </TabsList>

        <TabsContent value="power" className="space-y-6">
          <PowerConsumptionMonitor />
        </TabsContent>

        <TabsContent value="fuel" className="space-y-6">
          <FuelManagement />
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <UtilityCostTracking />
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-6">
          <EnergyEfficiencyMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
}