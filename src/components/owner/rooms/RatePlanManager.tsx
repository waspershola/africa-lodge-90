import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar as CalendarIcon,
  Percent,
  DollarSign,
  Users,
  Clock,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRatePlans, useCreateRatePlan, useUpdateRatePlan, useDeleteRatePlan } from "@/hooks/useRatePlans";
import { useRoomTypes } from "@/hooks/useApi";

interface RatePlan {
  id: string;
  name: string;
  description: string;
  type: "seasonal" | "corporate" | "promotional" | "package";
  roomCategory: string;
  baseRate: number;
  adjustmentType: "fixed" | "percentage";
  adjustment: number;
  finalRate: number;
  startDate: Date;
  endDate: Date;
  minStay: number;
  maxStay: number;
  advanceBooking: number;
  isActive: boolean;
  restrictions: string[];
  corporateCode?: string;
}

const rateTypeColors = {
  seasonal: "bg-green-500",
  corporate: "bg-blue-500",
  promotional: "bg-orange-500",
  package: "bg-purple-500",
};

const rateTypeLabels = {
  seasonal: "Seasonal",
  corporate: "Corporate",
  promotional: "Promotional",
  package: "Package",
};

export default function RatePlanManager() {
  const [selectedPlan, setSelectedPlan] = useState<RatePlan | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewPlan, setIsNewPlan] = useState(false);
  
  // Use live data from Supabase
  const { data: dbRatePlans = [], isLoading } = useRatePlans();
  const { data: roomTypes = [] } = useRoomTypes();
  const createRatePlanMutation = useCreateRatePlan();
  const updateRatePlanMutation = useUpdateRatePlan();
  const deleteRatePlanMutation = useDeleteRatePlan();

  // Transform database format to component format
  const ratePlans: RatePlan[] = dbRatePlans.map(dbPlan => ({
    id: dbPlan.id,
    name: dbPlan.name,
    description: dbPlan.description || '',
    type: dbPlan.type as RatePlan['type'],
    roomCategory: dbPlan.room_type_id || 'Standard',
    baseRate: dbPlan.base_rate,
    adjustmentType: dbPlan.adjustment_type as RatePlan['adjustmentType'],
    adjustment: dbPlan.adjustment,
    finalRate: dbPlan.final_rate,
    startDate: new Date(dbPlan.start_date),
    endDate: new Date(dbPlan.end_date),
    minStay: dbPlan.min_stay,
    maxStay: dbPlan.max_stay,
    advanceBooking: dbPlan.advance_booking,
    isActive: dbPlan.is_active,
    restrictions: dbPlan.restrictions || [],
    corporateCode: dbPlan.corporate_code
  }));

  if (isLoading) {
    return <div className="text-center py-8">Loading rate plans...</div>;
  }

  const handleNewPlan = () => {
    setSelectedPlan({
      id: '',
      name: "",
      description: "",
      type: "promotional",
      roomCategory: roomTypes[0]?.id || "",
      baseRate: 120,
      adjustmentType: "percentage",
      adjustment: 0,
      finalRate: 120,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      minStay: 1,
      maxStay: 30,
      advanceBooking: 0,
      isActive: true,
      restrictions: [],
    });
    setIsNewPlan(true);
    setIsEditDialogOpen(true);
  };

  const handleEditPlan = (plan: RatePlan) => {
    setSelectedPlan({ ...plan });
    setIsNewPlan(false);
    setIsEditDialogOpen(true);
  };

  const calculateFinalRate = (baseRate: number, adjustmentType: string, adjustment: number) => {
    if (adjustmentType === "percentage") {
      return baseRate + (baseRate * adjustment / 100);
    } else {
      return baseRate + adjustment;
    }
  };

  const handleSavePlan = async () => {
    if (selectedPlan) {
      const finalRate = calculateFinalRate(
        selectedPlan.baseRate,
        selectedPlan.adjustmentType,
        selectedPlan.adjustment
      );
      
      const updatedPlan = { ...selectedPlan, finalRate };
      
      try {
        if (isNewPlan) {
          await createRatePlanMutation.mutateAsync({
            tenant_id: '', // Will be set by the hook using auth context
            name: updatedPlan.name,
            description: updatedPlan.description,
            type: updatedPlan.type,
            room_type_id: updatedPlan.roomCategory,
            base_rate: updatedPlan.baseRate,
            adjustment_type: updatedPlan.adjustmentType,
            adjustment: updatedPlan.adjustment,
            final_rate: finalRate,
            start_date: updatedPlan.startDate.toISOString().split('T')[0],
            end_date: updatedPlan.endDate.toISOString().split('T')[0],
            min_stay: updatedPlan.minStay,
            max_stay: updatedPlan.maxStay,
            advance_booking: updatedPlan.advanceBooking,
            is_active: updatedPlan.isActive,
            restrictions: updatedPlan.restrictions,
            corporate_code: updatedPlan.corporateCode
          });
        } else {
          await updateRatePlanMutation.mutateAsync({
            id: selectedPlan.id,
            updates: {
              name: updatedPlan.name,
              description: updatedPlan.description,
              type: updatedPlan.type,
              room_type_id: updatedPlan.roomCategory,
              base_rate: updatedPlan.baseRate,
              adjustment_type: updatedPlan.adjustmentType,
              adjustment: updatedPlan.adjustment,
              final_rate: finalRate,
              start_date: updatedPlan.startDate.toISOString().split('T')[0],
              end_date: updatedPlan.endDate.toISOString().split('T')[0],
              min_stay: updatedPlan.minStay,
              max_stay: updatedPlan.maxStay,
              advance_booking: updatedPlan.advanceBooking,
              is_active: updatedPlan.isActive,
              restrictions: updatedPlan.restrictions,
              corporate_code: updatedPlan.corporateCode
            }
          });
        }
        setIsEditDialogOpen(false);
        setSelectedPlan(null);
        setIsNewPlan(false);
      } catch (error) {
        console.error('Error saving rate plan:', error);
      }
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this rate plan?')) {
      try {
        await deleteRatePlanMutation.mutateAsync(planId);
      } catch (error) {
        console.error('Error deleting rate plan:', error);
      }
    }
  };

  const togglePlanStatus = async (planId: string) => {
    const plan = ratePlans.find(p => p.id === planId);
    if (plan) {
      try {
        await updateRatePlanMutation.mutateAsync({
          id: planId,
          updates: { is_active: !plan.isActive }
        });
      } catch (error) {
        console.error('Error toggling rate plan status:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Rate Plans</h2>
        <Button onClick={handleNewPlan}>
          <Plus className="h-4 w-4 mr-2" />
          Create Rate Plan
        </Button>
      </div>

      {ratePlans.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground">
              No rate plans yet. Create your first rate plan to get started.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {ratePlans.map((plan) => (
            <Card key={plan.id} className={`relative ${!plan.isActive ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${rateTypeColors[plan.type]}`} />
                        <Badge variant="outline">
                          {rateTypeLabels[plan.type]}
                        </Badge>
                        {plan.corporateCode && (
                          <Badge variant="secondary">{plan.corporateCode}</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={plan.isActive}
                      onCheckedChange={() => togglePlanStatus(plan.id)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Room Category</span>
                    <p className="font-medium">
                      {roomTypes.find(rt => rt.id === plan.roomCategory)?.name || 'Standard'}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Base Rate</span>
                    <p className="font-medium">₦{plan.baseRate.toLocaleString()}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Adjustment</span>
                    <div className="flex items-center gap-1">
                      {plan.adjustmentType === "percentage" ? (
                        <Percent className="h-4 w-4" />
                      ) : (
                        <DollarSign className="h-4 w-4" />
                      )}
                      <span className={`font-medium ${plan.adjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {plan.adjustment >= 0 ? '+' : ''}{plan.adjustment}
                        {plan.adjustmentType === "percentage" ? '%' : ''}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Final Rate</span>
                    <p className="text-xl font-bold text-primary">₦{plan.finalRate.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{format(plan.startDate, "MMM d")} - {format(plan.endDate, "MMM d, yyyy")}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.minStay}-{plan.maxStay} nights</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.advanceBooking} days advance</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className={plan.adjustment >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(Math.round((plan.adjustment / plan.baseRate) * 100))}% 
                      {plan.adjustment >= 0 ? ' increase' : ' decrease'}
                    </span>
                  </div>
                </div>

                {plan.restrictions.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Restrictions</span>
                    <div className="flex flex-wrap gap-1">
                      {plan.restrictions.map((restriction, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {restriction}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPlan(plan)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Plan
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePlan(plan.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Rate Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewPlan ? "Create New Rate Plan" : `Edit ${selectedPlan?.name}`}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan Name</Label>
                  <Input
                    value={selectedPlan.name}
                    onChange={(e) => setSelectedPlan({
                      ...selectedPlan,
                      name: e.target.value
                    })}
                    placeholder="e.g., Summer Special"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Plan Type</Label>
                  <Select
                    value={selectedPlan.type}
                    onValueChange={(value: RatePlan['type']) => setSelectedPlan({
                      ...selectedPlan,
                      type: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="package">Package</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={selectedPlan.description}
                  onChange={(e) => setSelectedPlan({
                    ...selectedPlan,
                    description: e.target.value
                  })}
                  placeholder="Describe the rate plan..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room Category</Label>
                  <Select
                    value={selectedPlan.roomCategory}
                    onValueChange={(value) => setSelectedPlan({
                      ...selectedPlan,
                      roomCategory: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map(roomType => (
                        <SelectItem key={roomType.id} value={roomType.id}>
                          {roomType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Base Rate (₦)</Label>
                  <Input
                    type="number"
                    value={selectedPlan.baseRate}
                    onChange={(e) => setSelectedPlan({
                      ...selectedPlan,
                      baseRate: parseFloat(e.target.value) || 0
                    })}
                    placeholder="120000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Adjustment Type</Label>
                  <Select
                    value={selectedPlan.adjustmentType}
                    onValueChange={(value: "fixed" | "percentage") => setSelectedPlan({
                      ...selectedPlan,
                      adjustmentType: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₦)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Adjustment</Label>
                  <Input
                    type="number"
                    value={selectedPlan.adjustment}
                    onChange={(e) => setSelectedPlan({
                      ...selectedPlan,
                      adjustment: parseFloat(e.target.value) || 0
                    })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Final Rate</Label>
                  <div className="text-2xl font-bold text-primary pt-2">
                    ₦{calculateFinalRate(
                      selectedPlan.baseRate,
                      selectedPlan.adjustmentType,
                      selectedPlan.adjustment
                    ).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(selectedPlan.startDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedPlan.startDate}
                        onSelect={(date) => date && setSelectedPlan({
                          ...selectedPlan,
                          startDate: date
                        })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(selectedPlan.endDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedPlan.endDate}
                        onSelect={(date) => date && setSelectedPlan({
                          ...selectedPlan,
                          endDate: date
                        })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Min Stay (nights)</Label>
                  <Input
                    type="number"
                    value={selectedPlan.minStay}
                    onChange={(e) => setSelectedPlan({
                      ...selectedPlan,
                      minStay: parseInt(e.target.value) || 1
                    })}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Stay (nights)</Label>
                  <Input
                    type="number"
                    value={selectedPlan.maxStay}
                    onChange={(e) => setSelectedPlan({
                      ...selectedPlan,
                      maxStay: parseInt(e.target.value) || 30
                    })}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Advance Booking (days)</Label>
                  <Input
                    type="number"
                    value={selectedPlan.advanceBooking}
                    onChange={(e) => setSelectedPlan({
                      ...selectedPlan,
                      advanceBooking: parseInt(e.target.value) || 0
                    })}
                    min="0"
                  />
                </div>
              </div>

              {selectedPlan.type === "corporate" && (
                <div className="space-y-2">
                  <Label>Corporate Code</Label>
                  <Input
                    value={selectedPlan.corporateCode || ""}
                    onChange={(e) => setSelectedPlan({
                      ...selectedPlan,
                      corporateCode: e.target.value
                    })}
                    placeholder="e.g., CORP2024"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSavePlan} className="flex-1">
                  {isNewPlan ? "Create Rate Plan" : "Save Changes"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}