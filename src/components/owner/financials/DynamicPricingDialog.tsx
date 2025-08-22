import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const dynamicPricingSchema = z.object({
  occupancyThresholdHigh: z.number().min(70).max(100),
  occupancyThresholdLow: z.number().min(0).max(50),
  priceIncreaseHigh: z.number().min(1).max(50),
  priceDecreaseLow: z.number().min(1).max(50),
  weekendMultiplier: z.number().min(1).max(3),
  seasonalMultiplier: z.number().min(1).max(3),
});

type DynamicPricingFormData = z.infer<typeof dynamicPricingSchema>;

interface DynamicPricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DynamicPricingDialog({ open, onOpenChange }: DynamicPricingDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [occupancyBasedEnabled, setOccupancyBasedEnabled] = useState(true);
  const [seasonalPricingEnabled, setSeasonalPricingEnabled] = useState(true);
  const [competitorMatchingEnabled, setCompetitorMatchingEnabled] = useState(false);
  const { toast } = useToast();

  const form = useForm<DynamicPricingFormData>({
    resolver: zodResolver(dynamicPricingSchema),
    defaultValues: {
      occupancyThresholdHigh: 85,
      occupancyThresholdLow: 30,
      priceIncreaseHigh: 15,
      priceDecreaseLow: 10,
      weekendMultiplier: 1.2,
      seasonalMultiplier: 1.5,
    },
  });

  const handleSubmit = async (data: DynamicPricingFormData) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Dynamic pricing updated",
        description: "Your pricing rules have been configured successfully.",
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update pricing rules. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dynamic Pricing Configuration</DialogTitle>
          <DialogDescription>
            Set up automated pricing rules based on occupancy, demand, and market conditions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Occupancy-Based Pricing */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Occupancy-Based Pricing</CardTitle>
                    <CardDescription>Adjust rates based on current occupancy levels</CardDescription>
                  </div>
                  <Switch 
                    checked={occupancyBasedEnabled}
                    onCheckedChange={setOccupancyBasedEnabled}
                  />
                </div>
              </CardHeader>
              {occupancyBasedEnabled && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="occupancyThresholdHigh"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>High Occupancy Threshold (%)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Slider
                                min={70}
                                max={100}
                                step={5}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                              <div className="text-center text-sm text-muted-foreground">
                                {field.value}%
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priceIncreaseHigh"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price Increase (%)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Slider
                                min={1}
                                max={50}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                              <div className="text-center text-sm text-muted-foreground">
                                +{field.value}%
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="occupancyThresholdLow"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Occupancy Threshold (%)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Slider
                                min={0}
                                max={50}
                                step={5}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                              <div className="text-center text-sm text-muted-foreground">
                                {field.value}%
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priceDecreaseLow"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price Decrease (%)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Slider
                                min={1}
                                max={50}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                              <div className="text-center text-sm text-muted-foreground">
                                -{field.value}%
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            <Separator />

            {/* Seasonal Pricing */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Seasonal & Weekend Pricing</CardTitle>
                    <CardDescription>Apply multipliers for peak periods and weekends</CardDescription>
                  </div>
                  <Switch 
                    checked={seasonalPricingEnabled}
                    onCheckedChange={setSeasonalPricingEnabled}
                  />
                </div>
              </CardHeader>
              {seasonalPricingEnabled && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="weekendMultiplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weekend Multiplier</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Slider
                                min={1}
                                max={3}
                                step={0.1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                              <div className="text-center text-sm text-muted-foreground">
                                {field.value}x
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="seasonalMultiplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peak Season Multiplier</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Slider
                                min={1}
                                max={3}
                                step={0.1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                              <div className="text-center text-sm text-muted-foreground">
                                {field.value}x
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            <Separator />

            {/* Advanced Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Advanced Features</CardTitle>
                <CardDescription>Additional pricing optimization features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Competitor Rate Matching</Label>
                    <p className="text-sm text-muted-foreground">Monitor and match competitor pricing</p>
                  </div>
                  <Switch 
                    checked={competitorMatchingEnabled}
                    onCheckedChange={setCompetitorMatchingEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Last-Minute Discounts</Label>
                    <p className="text-sm text-muted-foreground">Auto-discount for same-day bookings</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Event-Based Pricing</Label>
                    <p className="text-sm text-muted-foreground">Increase rates during local events</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Configuration"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}