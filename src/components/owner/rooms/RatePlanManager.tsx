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
import { useCurrency } from "@/hooks/useCurrency";
import { useMultiTenantAuth } from "@/hooks/useMultiTenantAuth";
import { useToast } from "@/hooks/use-toast";
import { useRatePlans, useCreateRatePlan, useUpdateRatePlan, useDeleteRatePlan, RatePlan } from "@/hooks/useRatePlans";
import { useRoomTypes } from "@/hooks/useRoomTypes";
import React from "react";

interface LocalRatePlan {
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
  advanceBooking: number; // days
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
  const [selectedPlan, setSelectedPlan] = useState<LocalRatePlan | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewPlan, setIsNewPlan] = useState(false);
  
  const { formatPrice } = useCurrency();
  const { user, tenant } = useMultiTenantAuth();
  const { toast } = useToast();
  
  // Use real database hooks
  const { data: ratePlansData, isLoading } = useRatePlans();
  const { data: roomTypesData } = useRoomTypes();
  const createRatePlan = useCreateRatePlan();
  const updateRatePlan = useUpdateRatePlan();
  const deleteRatePlan = useDeleteRatePlan();
  
  const ratePlans = (ratePlansData || []) as RatePlan[];
  const roomTypes = roomTypesData || [];

  const convertToLocalFormat = (dbPlan: RatePlan): LocalRatePlan => ({
    id: dbPlan.id,
    name: dbPlan.name,
    description: dbPlan.description || '',
    type: dbPlan.type as "seasonal" | "corporate" | "promotional" | "package",
    roomCategory: 'Standard', // Default for now
    baseRate: dbPlan.base_rate,
    adjustmentType: dbPlan.adjustment_type,
    adjustment: dbPlan.adjustment,
    finalRate: dbPlan.final_rate,
    startDate: new Date(dbPlan.start_date),
    endDate: new Date(dbPlan.end_date),
    minStay: dbPlan.min_stay || 1,
    maxStay: dbPlan.max_stay || 30,
    advanceBooking: dbPlan.advance_booking || 0,
    isActive: dbPlan.is_active,
    restrictions: dbPlan.restrictions || [],
    corporateCode: dbPlan.corporate_code,
  });

  // Convert local format to database format
  const convertToDbFormat = (localPlan: LocalRatePlan) => ({
    name: localPlan.name,
    description: localPlan.description,
    type: localPlan.type,
    base_rate: localPlan.baseRate,
    adjustment_type: localPlan.adjustmentType,
    adjustment: localPlan.adjustment,
    final_rate: localPlan.finalRate,
    start_date: localPlan.startDate.toISOString().split('T')[0],
    end_date: localPlan.endDate.toISOString().split('T')[0],
    min_stay: localPlan.minStay,
    max_stay: localPlan.maxStay,
    advance_booking: localPlan.advanceBooking,
    corporate_code: localPlan.corporateCode,
    restrictions: localPlan.restrictions,
    is_active: localPlan.isActive,
  });

  const handleNewPlan = () => {
    setSelectedPlan({
      id: Date.now().toString(),
      name: "",
      description: "",
      type: "promotional",
      roomCategory: "Standard",
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

  const handleEditPlan = (dbPlan: RatePlan) => {
    setSelectedPlan(convertToLocalFormat(dbPlan));
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
    if (!selectedPlan) return;

    try {
      const finalRate = calculateFinalRate(
        selectedPlan.baseRate,
        selectedPlan.adjustmentType,
        selectedPlan.adjustment
      );

      const updatedPlan = { ...selectedPlan, finalRate };
      const dbData = convertToDbFormat(updatedPlan);
      
      if (isNewPlan) {
        await createRatePlan.mutateAsync(dbData);
      } else {
        await updateRatePlan.mutateAsync({ id: selectedPlan.id, ...dbData });
      }

      setIsEditDialogOpen(false);
      setSelectedPlan(null);
      setIsNewPlan(false);
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm('Are you sure you want to delete this rate plan?')) return;
    
    try {
      await deleteRatePlan.mutateAsync(planId);
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const togglePlanStatus = async (planId: string) => {
    try {
      const plan = ratePlans.find(p => p.id === planId);
      if (plan) {
        await updateRatePlan.mutateAsync({ 
          id: planId, 
          is_active: !plan.is_active 
        });
      }
    } catch (error) {
      // Error handling is done in the hooks
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

      {isLoading ? (
        <div className="text-center py-8">Loading rate plans...</div>
      ) : ratePlans.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No rate plans found. Create your first rate plan to get started.
        </div>
      ) : (
        <div className="grid gap-4">
          {ratePlans.map((plan) => {
            const localPlan = convertToLocalFormat(plan);
            return (
          <Card key={plan.id} className={`relative ${!localPlan.isActive ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">{localPlan.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${rateTypeColors[localPlan.type]}`} />
                      <Badge variant="outline">
                        {rateTypeLabels[localPlan.type]}
                      </Badge>
                      {localPlan.corporateCode && (
                        <Badge variant="secondary">{localPlan.corporateCode}</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground">{localPlan.description}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={localPlan.isActive}
                    onCheckedChange={() => togglePlanStatus(plan.id)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {localPlan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Room Category</span>
                  <p className="font-medium">{localPlan.roomCategory}</p>
                </div>
                
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Base Rate</span>
                  <p className="font-medium">{formatPrice(localPlan.baseRate)}</p>
                </div>
                
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Adjustment</span>
                  <div className="flex items-center gap-1">
                    {localPlan.adjustmentType === "percentage" ? (
                      <Percent className="h-4 w-4" />
                    ) : (
                      <DollarSign className="h-4 w-4" />
                    )}
                    <span className={`font-medium ${localPlan.adjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {localPlan.adjustment >= 0 ? '+' : ''}{localPlan.adjustment}
                      {localPlan.adjustmentType === "percentage" ? '%' : ''}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Final Rate</span>
                  <p className="text-xl font-bold text-primary">{formatPrice(localPlan.finalRate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{format(localPlan.startDate, "MMM d")} - {format(localPlan.endDate, "MMM d, yyyy")}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{localPlan.minStay}-{localPlan.maxStay} nights</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{localPlan.advanceBooking} days advance</span>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className={localPlan.adjustment >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(Math.round((localPlan.adjustment / localPlan.baseRate) * 100))}% 
                    {localPlan.adjustment >= 0 ? ' increase' : ' decrease'}
                  </span>
                </div>
              </div>

              {localPlan.restrictions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Restrictions</span>
                  <div className="flex flex-wrap gap-1">
                    {localPlan.restrictions.map((restriction, index) => (
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
          );
          })}
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
                  <Label>Base Rate (USD)</Label>
                  <Input
                    type="number"
                    value={selectedPlan.baseRate}
                    onChange={(e) => setSelectedPlan({
                      ...selectedPlan,
                      baseRate: parseFloat(e.target.value) || 0
                    })}
                    placeholder="120"
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
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
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
                    ${calculateFinalRate(
                      selectedPlan.baseRate,
                      selectedPlan.adjustmentType,
                      selectedPlan.adjustment
                    ).toFixed(2)}
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
                        className="pointer-events-auto"
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
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Stay (nights)</Label>
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
                  <Label>Maximum Stay (nights)</Label>
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
                    placeholder="CORP2024"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Restrictions (one per line)</Label>
                <Textarea
                  value={selectedPlan.restrictions.join('\n')}
                  onChange={(e) => setSelectedPlan({
                    ...selectedPlan,
                    restrictions: e.target.value.split('\n').filter(r => r.trim())
                  })}
                  placeholder="Non-refundable&#10;Weekend supplement applies&#10;Valid ID required"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
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