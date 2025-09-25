import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Loader2, Database, Building, DollarSign, Settings } from "lucide-react";
import { useCreateRoom } from "@/hooks/useRooms";
import { useCreateRoomType } from "@/hooks/useRoomTypes";
import { useCreateRatePlan } from "@/hooks/useRatePlans";
import { useCreatePricingRule, useUpdateDynamicPricingSettings } from "@/hooks/useDynamicPricing";
import { useToast } from "@/hooks/use-toast";
import { useRoomLimits } from "@/hooks/useRoomLimits";
import { useMultiTenantAuth } from "@/hooks/useMultiTenantAuth";

interface SeedDataGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomCount: number;
}

interface SeedOptions {
  roomTypes: boolean;
  rooms: boolean;
  ratePlans: boolean;
  dynamicPricing: boolean;
}

export default function SeedDataGenerator({ isOpen, onClose, currentRoomCount }: SeedDataGeneratorProps) {
  const [seedOptions, setSeedOptions] = useState<SeedOptions>({
    roomTypes: true,
    rooms: true,
    ratePlans: true,
    dynamicPricing: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [completed, setCompleted] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const { tenant } = useMultiTenantAuth();
  const createRoom = useCreateRoom();
  const createRoomType = useCreateRoomType();
  const createRatePlan = useCreateRatePlan();
  const createPricingRule = useCreatePricingRule();
  const updateDynamicPricingSettings = useUpdateDynamicPricingSettings();
  const { toast } = useToast();
  const roomLimits = useRoomLimits(tenant?.plan_id || '');

  const updateSeedOption = (key: keyof SeedOptions, value: boolean) => {
    setSeedOptions(prev => ({ ...prev, [key]: value }));
  };

  // Sample data
  const sampleRoomTypes = [
    {
      name: "Standard Room",
      description: "Comfortable room with essential amenities",
      base_rate: 120,
      max_occupancy: 2,
      amenities: ["wifi", "tv", "ac", "minibar"],
      bed_configuration: "1 Queen Bed",
      size_sqm: 25,
    },
    {
      name: "Deluxe Room", 
      description: "Spacious room with premium amenities",
      base_rate: 180,
      max_occupancy: 3,
      amenities: ["wifi", "tv", "ac", "minibar", "balcony"],
      bed_configuration: "1 King Bed",
      size_sqm: 35,
    },
    {
      name: "Executive Suite",
      description: "Luxurious suite with separate living area",
      base_rate: 320,
      max_occupancy: 4,
      amenities: ["wifi", "tv", "ac", "minibar", "balcony", "jacuzzi"],
      bed_configuration: "1 King Bed + Sofa Bed",
      size_sqm: 55,
    },
  ];

  const sampleRooms = [
    // Floor 1 - Standard Rooms
    { room_number: "101", floor: 1, type: "Standard Room" },
    { room_number: "102", floor: 1, type: "Standard Room" },
    { room_number: "103", floor: 1, type: "Deluxe Room" },
    { room_number: "104", floor: 1, type: "Deluxe Room" },
    // Floor 2 - Mixed
    { room_number: "201", floor: 2, type: "Standard Room" },
    { room_number: "202", floor: 2, type: "Standard Room" },
    { room_number: "203", floor: 2, type: "Deluxe Room" },
    { room_number: "204", floor: 2, type: "Executive Suite" },
    // Floor 3 - Premium
    { room_number: "301", floor: 3, type: "Deluxe Room" },
    { room_number: "302", floor: 3, type: "Executive Suite" },
  ];

  const sampleRatePlans = [
    {
      name: "Summer Special",
      description: "Promotional rate for summer season",
      type: "seasonal" as const,
      base_rate: 120,
      adjustment_type: "percentage" as const,
      adjustment: -15,
      final_rate: 102,
      start_date: "2024-06-01",
      end_date: "2024-08-31",
      min_stay: 2,
      max_stay: 14,
      advance_booking: 7,
      restrictions: ["Non-refundable", "Weekend supplement applies"],
    },
    {
      name: "Corporate Rate",
      description: "Special rate for business travelers",
      type: "corporate" as const,
      base_rate: 180,
      adjustment_type: "fixed" as const,
      adjustment: -30,
      final_rate: 150,
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      min_stay: 1,
      max_stay: 30,
      advance_booking: 0,
      corporate_code: "CORP2024",
      restrictions: ["Valid corporate ID required", "Breakfast included"],
    },
  ];

  const samplePricingRules = [
    {
      name: "High Occupancy Surge",
      type: "occupancy" as const,
      is_active: true,
      trigger_condition: "occupancy_rate",
      trigger_value: 85,
      trigger_operator: ">=" as const,
      adjustment_type: "percentage" as const,
      adjustment_value: 20,
      max_increase: 50,
      max_decrease: 0,
      room_categories: ["Standard Room", "Deluxe Room"],
      priority: 1,
    },
    {
      name: "Low Demand Discount",
      type: "demand" as const,
      is_active: true,
      trigger_condition: "advance_bookings",
      trigger_value: 30,
      trigger_operator: "<" as const,
      adjustment_type: "percentage" as const,
      adjustment_value: -15,
      max_increase: 0,
      max_decrease: 30,
      room_categories: ["Standard Room", "Deluxe Room", "Executive Suite"],
      priority: 2,
    },
  ];

  const generateSeedData = async () => {
    setIsGenerating(true);
    setProgress(0);
    setCompleted([]);
    setErrors([]);
    
    const totalSteps = Object.values(seedOptions).filter(Boolean).length;
    let currentStep = 0;

    try {
      // Step 1: Create Room Types
      if (seedOptions.roomTypes) {
        setStatus("Creating room types...");
        try {
          const createdRoomTypes = [];
          for (const roomType of sampleRoomTypes) {
            const result = await createRoomType.mutateAsync(roomType);
            createdRoomTypes.push(result);
          }
          setCompleted(prev => [...prev, `Created ${createdRoomTypes.length} room types`]);
          
          // Step 2: Create Rooms (needs room types)
          if (seedOptions.rooms) {
            currentStep++;
            setProgress((currentStep / totalSteps) * 100);
            setStatus("Creating rooms...");
            
            if (sampleRooms.length + currentRoomCount > roomLimits.maxRooms) {
              setErrors(prev => [...prev, `Cannot create rooms: would exceed limit of ${roomLimits.maxRooms}`]);
            } else {
              let createdRooms = 0;
              for (const room of sampleRooms) {
                const roomType = createdRoomTypes.find(rt => rt.name === room.type);
                if (roomType) {
                  await createRoom.mutateAsync({
                    room_number: room.room_number,
                    room_type_id: roomType.id,
                    floor: room.floor,
                    status: 'available',
                    notes: 'Sample room data'
                  });
                  createdRooms++;
                }
              }
              setCompleted(prev => [...prev, `Created ${createdRooms} rooms`]);
            }
          }
        } catch (error) {
          setErrors(prev => [...prev, `Failed to create room types: ${error}`]);
        }
        
        currentStep++;
        setProgress((currentStep / totalSteps) * 100);
      }

      // Step 3: Create Rate Plans
      if (seedOptions.ratePlans) {
        setStatus("Creating rate plans...");
        try {
          let createdRatePlans = 0;
            for (const ratePlan of sampleRatePlans) {
              await createRatePlan.mutateAsync({
                ...ratePlan,
                is_active: true
              });
              createdRatePlans++;
            }
          setCompleted(prev => [...prev, `Created ${createdRatePlans} rate plans`]);
        } catch (error) {
          setErrors(prev => [...prev, `Failed to create rate plans: ${error}`]);
        }
        
        currentStep++;
        setProgress((currentStep / totalSteps) * 100);
      }

      // Step 4: Create Dynamic Pricing
      if (seedOptions.dynamicPricing) {
        setStatus("Setting up dynamic pricing...");
        try {
          // Create pricing rules
          let createdRules = 0;
          for (const rule of samplePricingRules) {
            await createPricingRule.mutateAsync(rule);
            createdRules++;
          }
          
          // Update dynamic pricing settings
          await updateDynamicPricingSettings.mutateAsync({
            is_enabled: true,
            update_frequency: 30,
            max_price_increase: 50,
            max_price_decrease: 30,
            competitor_sync: false,
            demand_forecast: true,
            event_integration: false,
          });
          
          setCompleted(prev => [...prev, `Created ${createdRules} pricing rules and configured settings`]);
        } catch (error) {
          setErrors(prev => [...prev, `Failed to setup dynamic pricing: ${error}`]);
        }
        
        currentStep++;
        setProgress((currentStep / totalSteps) * 100);
      }

      setStatus("Seed data generation completed!");
      setProgress(100);
      
      toast({
        title: "Success",
        description: "Sample data has been generated successfully",
      });

    } catch (error) {
      setErrors(prev => [...prev, `Unexpected error: ${error}`]);
      toast({
        title: "Error",
        description: "Failed to generate seed data",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Generate Sample Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            This will create sample data to help you get started with your hotel management system.
          </div>

          {/* Seed Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data to Generate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <Label>Room Types</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Standard, Deluxe, and Executive Suite room types
                  </p>
                </div>
                <Switch
                  checked={seedOptions.roomTypes}
                  onCheckedChange={(checked) => updateSeedOption('roomTypes', checked)}
                  disabled={isGenerating}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <Label>Sample Rooms</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    10 rooms across 3 floors ({currentRoomCount + 10} total)
                  </p>
                </div>
                <Switch
                  checked={seedOptions.rooms}
                  onCheckedChange={(checked) => updateSeedOption('rooms', checked)}
                  disabled={isGenerating || !seedOptions.roomTypes || (currentRoomCount + 10 > roomLimits.maxRooms)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Label>Rate Plans</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Seasonal and corporate pricing plans
                  </p>
                </div>
                <Switch
                  checked={seedOptions.ratePlans}
                  onCheckedChange={(checked) => updateSeedOption('ratePlans', checked)}
                  disabled={isGenerating}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <Label>Dynamic Pricing</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automated pricing rules and settings
                  </p>
                </div>
                <Switch
                  checked={seedOptions.dynamicPricing}
                  onCheckedChange={(checked) => updateSeedOption('dynamicPricing', checked)}
                  disabled={isGenerating}
                />
              </div>

              {currentRoomCount + 10 > roomLimits.maxRooms && (
                <div className="flex items-center gap-2 text-sm text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  Sample rooms disabled: would exceed your plan limit of {roomLimits.maxRooms} rooms
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress */}
          {isGenerating && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">{status}</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {(completed.length > 0 || errors.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {completed.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {item}
                  </div>
                ))}
                {errors.map((error, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <Button 
              onClick={generateSeedData}
              disabled={isGenerating || !Object.values(seedOptions).some(Boolean)}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Sample Data"
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isGenerating}
            >
              {isGenerating ? "Cancel" : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}