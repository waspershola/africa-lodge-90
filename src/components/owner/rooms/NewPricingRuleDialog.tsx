import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useCreatePricingRule } from "@/hooks/useDynamicPricing";
import { useRoomTypes } from "@/hooks/useRoomTypes";

interface NewPricingRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewPricingRuleDialog({ open, onOpenChange }: NewPricingRuleDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "occupancy" as const,
    trigger_condition: "occupancy_rate",
    trigger_value: 80,
    trigger_operator: ">=" as const,
    adjustment_type: "percentage" as const,
    adjustment_value: 15,
    max_increase: 50,
    max_decrease: 30,
    room_categories: [] as string[],
    priority: 1,
    is_active: true,
  });

  const { data: roomTypes } = useRoomTypes();
  const createPricingRule = useCreatePricingRule();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createPricingRule.mutateAsync(formData);
      onOpenChange(false);
      setFormData({
        name: "",
        type: "occupancy" as const,
        trigger_condition: "occupancy_rate",
        trigger_value: 80,
        trigger_operator: ">=" as const,
        adjustment_type: "percentage" as const,
        adjustment_value: 15,
        max_increase: 50,
        max_decrease: 30,
        room_categories: [],
        priority: 1,
        is_active: true,
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const addRoomCategory = (categoryId: string) => {
    if (!formData.room_categories.includes(categoryId)) {
      setFormData(prev => ({
        ...prev,
        room_categories: [...prev.room_categories, categoryId]
      }));
    }
  };

  const removeRoomCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      room_categories: prev.room_categories.filter(id => id !== categoryId)
    }));
  };

  const getRoomTypeName = (id: string) => {
    const roomType = roomTypes?.find(rt => rt.id === id);
    return roomType?.name || id;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Pricing Rule</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., High Occupancy Pricing"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Rule Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="occupancy">Occupancy-based</SelectItem>
                  <SelectItem value="demand">Demand-based</SelectItem>
                  <SelectItem value="seasonal">Seasonal</SelectItem>
                  <SelectItem value="competitor">Competitor-based</SelectItem>
                  <SelectItem value="event">Event-based</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trigger_condition">Trigger Condition</Label>
              <Select
                value={formData.trigger_condition}
                onValueChange={(value) => setFormData(prev => ({ ...prev, trigger_condition: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="occupancy_rate">Occupancy Rate</SelectItem>
                  <SelectItem value="advance_bookings">Advance Bookings</SelectItem>
                  <SelectItem value="day_of_week">Day of Week</SelectItem>
                  <SelectItem value="season">Season</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger_operator">Operator</Label>
              <Select
                value={formData.trigger_operator}
                onValueChange={(value) => setFormData(prev => ({ ...prev, trigger_operator: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=">">Greater than</SelectItem>
                  <SelectItem value=">=">Greater than or equal</SelectItem>
                  <SelectItem value="<">Less than</SelectItem>
                  <SelectItem value="<=">Less than or equal</SelectItem>
                  <SelectItem value="=">=Equal to</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger_value">Value</Label>
              <Input
                id="trigger_value"
                type="number"
                value={formData.trigger_value}
                onChange={(e) => setFormData(prev => ({ ...prev, trigger_value: parseFloat(e.target.value) || 0 }))}
                placeholder="80"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adjustment_type">Adjustment Type</Label>
              <Select
                value={formData.adjustment_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, adjustment_type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustment_value">Adjustment Value</Label>
              <Input
                id="adjustment_value"
                type="number"
                value={formData.adjustment_value}
                onChange={(e) => setFormData(prev => ({ ...prev, adjustment_value: parseFloat(e.target.value) || 0 }))}
                placeholder="15"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_increase">Max Price Increase (%)</Label>
              <Input
                id="max_increase"
                type="number"
                value={formData.max_increase}
                onChange={(e) => setFormData(prev => ({ ...prev, max_increase: parseFloat(e.target.value) || 0 }))}
                placeholder="50"
                min="0"
                max="100"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_decrease">Max Price Decrease (%)</Label>
              <Input
                id="max_decrease"
                type="number"
                value={formData.max_decrease}
                onChange={(e) => setFormData(prev => ({ ...prev, max_decrease: parseFloat(e.target.value) || 0 }))}
                placeholder="30"
                min="0"
                max="100"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Room Categories</Label>
            <Select onValueChange={addRoomCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select room categories to apply this rule" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes?.map((roomType) => (
                  <SelectItem 
                    key={roomType.id} 
                    value={roomType.id}
                    disabled={formData.room_categories.includes(roomType.id)}
                  >
                    {roomType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {formData.room_categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.room_categories.map((categoryId) => (
                  <Badge key={categoryId} variant="secondary" className="gap-1">
                    {getRoomTypeName(categoryId)}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeRoomCategory(categoryId)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority (1 = highest)</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
              placeholder="1"
              min="1"
              max="10"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={createPricingRule.isPending}>
              {createPricingRule.isPending ? "Creating..." : "Create Rule"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}