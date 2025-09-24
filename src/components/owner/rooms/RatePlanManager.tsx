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
  advanceBooking: number; // days
  isActive: boolean;
  restrictions: string[];
  corporateCode?: string;
}

const mockRatePlans: RatePlan[] = [
  {
    id: "1",
    name: "Summer Special",
    description: "Promotional rate for summer season with pool access",
    type: "seasonal",
    roomCategory: "Standard",
    baseRate: 120,
    adjustmentType: "percentage",
    adjustment: -15,
    finalRate: 102,
    startDate: new Date(2024, 5, 1),
    endDate: new Date(2024, 8, 30),
    minStay: 2,
    maxStay: 14,
    advanceBooking: 7,
    isActive: true,
    restrictions: ["Non-refundable", "Weekend supplement applies"],
  },
  {
    id: "2",
    name: "Corporate Rate - Tech Companies",
    description: "Special rate for technology companies with extended stay benefits",
    type: "corporate",
    roomCategory: "Deluxe",
    baseRate: 180,
    adjustmentType: "fixed",
    adjustment: -30,
    finalRate: 150,
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 11, 31),
    minStay: 1,
    maxStay: 30,
    advanceBooking: 0,
    isActive: true,
    restrictions: ["Valid corporate ID required", "Breakfast included"],
    corporateCode: "TECH2024",
  },
  {
    id: "3",
    name: "Weekend Getaway Package",
    description: "Weekend package including breakfast and spa access",
    type: "package",
    roomCategory: "Suite",
    baseRate: 320,
    adjustmentType: "fixed",
    adjustment: 50,
    finalRate: 370,
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 11, 31),
    minStay: 2,
    maxStay: 3,
    advanceBooking: 14,
    isActive: true,
    restrictions: ["Weekend only", "Includes breakfast & spa"],
  },
];

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
  const [ratePlans, setRatePlans] = useState<RatePlan[]>(mockRatePlans);
  const [selectedPlan, setSelectedPlan] = useState<RatePlan | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewPlan, setIsNewPlan] = useState(false);

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

  const handleSavePlan = () => {
    if (selectedPlan) {
      const finalRate = calculateFinalRate(
        selectedPlan.baseRate,
        selectedPlan.adjustmentType,
        selectedPlan.adjustment
      );
      
      const updatedPlan = { ...selectedPlan, finalRate };
      
      if (isNewPlan) {
        setRatePlans([...ratePlans, updatedPlan]);
      } else {
        setRatePlans(ratePlans.map(plan => 
          plan.id === selectedPlan.id ? updatedPlan : plan
        ));
      }
      setIsEditDialogOpen(false);
      setSelectedPlan(null);
      setIsNewPlan(false);
    }
  };

  const handleDeletePlan = (planId: string) => {
    setRatePlans(ratePlans.filter(plan => plan.id !== planId));
  };

  const togglePlanStatus = (planId: string) => {
    setRatePlans(ratePlans.map(plan =>
      plan.id === planId ? { ...plan, isActive: !plan.isActive } : plan
    ));
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
                  <p className="font-medium">{plan.roomCategory}</p>
                </div>
                
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Base Rate</span>
                  <p className="font-medium">${plan.baseRate}</p>
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
                  <p className="text-xl font-bold text-primary">${plan.finalRate}</p>
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
                      <SelectItem value="Standard">Standard Room</SelectItem>
                      <SelectItem value="Deluxe">Deluxe Room</SelectItem>
                      <SelectItem value="Suite">Executive Suite</SelectItem>
                      <SelectItem value="Presidential">Presidential Suite</SelectItem>
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