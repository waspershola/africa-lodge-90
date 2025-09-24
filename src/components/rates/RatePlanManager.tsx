import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, Calendar, DollarSign, TrendingUp, Copy, Edit, Trash2, 
  ToggleLeft, ToggleRight, Package, Settings, Zap
} from "lucide-react";
import { useRatePlans, RatePlan, RatePlanCreate } from "@/hooks/useRatePlans";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function RatePlanManager() {
  const { ratePlans, loading, createRatePlan, updateRatePlan, deleteRatePlan, toggleRatePlan, applyRatePlanBulk, getRoomTypes } = useRatePlans();
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<RatePlan | null>(null);
  const [bulkApplyDialog, setBulkApplyDialog] = useState<{ plan: RatePlan } | null>(null);

  const [formData, setFormData] = useState<RatePlanCreate>({
    name: '',
    type: 'promotional',
    description: '',
    room_type_id: '',
    adjustment_type: 'percentage',
    adjustment: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    min_stay: 1,
    max_stay: 30,
    advance_booking: 0,
    restrictions: [],
    corporate_code: ''
  });

  const [bulkApplyData, setBulkApplyData] = useState({
    selectedRoomTypes: [] as string[],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    loadRoomTypes();
  }, []);

  const loadRoomTypes = async () => {
    const types = await getRoomTypes();
    setRoomTypes(types);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'promotional',
      description: '',
      room_type_id: '',
      adjustment_type: 'percentage',
      adjustment: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      min_stay: 1,
      max_stay: 30,
      advance_booking: 0,
      restrictions: [],
      corporate_code: ''
    });
  };

  const handleCreate = async () => {
    const success = await createRatePlan(formData);
    if (success) {
      toast.success('Rate plan created successfully');
      setShowCreateDialog(false);
      resetForm();
    } else {
      toast.error('Failed to create rate plan');
    }
  };

  const handleEdit = (plan: RatePlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      type: plan.type,
      description: plan.description || '',
      room_type_id: plan.room_type_id || '',
      adjustment_type: plan.adjustment_type,
      adjustment: plan.adjustment,
      start_date: plan.start_date,
      end_date: plan.end_date,
      min_stay: plan.min_stay || 1,
      max_stay: plan.max_stay || 30,
      advance_booking: plan.advance_booking || 0,
      restrictions: plan.restrictions || [],
      corporate_code: plan.corporate_code || ''
    });
    setShowCreateDialog(true);
  };

  const handleUpdate = async () => {
    if (!editingPlan) return;
    
    const success = await updateRatePlan(editingPlan.id, formData);
    if (success) {
      toast.success('Rate plan updated successfully');
      setShowCreateDialog(false);
      setEditingPlan(null);
      resetForm();
    } else {
      toast.error('Failed to update rate plan');
    }
  };

  const handleDelete = async (plan: RatePlan) => {
    if (confirm(`Are you sure you want to delete the rate plan "${plan.name}"?`)) {
      const success = await deleteRatePlan(plan.id);
      if (success) {
        toast.success('Rate plan deleted successfully');
      } else {
        toast.error('Failed to delete rate plan');
      }
    }
  };

  const handleToggle = async (plan: RatePlan) => {
    const success = await toggleRatePlan(plan.id, !plan.is_active);
    if (success) {
      toast.success(`Rate plan ${plan.is_active ? 'deactivated' : 'activated'} successfully`);
    } else {
      toast.error('Failed to update rate plan status');
    }
  };

  const handleBulkApply = async () => {
    if (!bulkApplyDialog?.plan || bulkApplyData.selectedRoomTypes.length === 0) {
      toast.error('Please select at least one room type');
      return;
    }

    const count = await applyRatePlanBulk(
      bulkApplyDialog.plan.id,
      bulkApplyData.selectedRoomTypes,
      bulkApplyData.startDate,
      bulkApplyData.endDate
    );

    if (count > 0) {
      toast.success(`Rate plan applied to ${count} room type(s)`);
      setBulkApplyDialog(null);
      setBulkApplyData({
        selectedRoomTypes: [],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    } else {
      toast.error('Failed to apply rate plan');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'promotional': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'seasonal': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'corporate': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'advance_booking': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'last_minute': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const activePlans = ratePlans.filter(p => p.is_active);
  const inactivePlans = ratePlans.filter(p => !p.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rate Plan Management</h2>
          <p className="text-muted-foreground">
            Create and manage dynamic pricing strategies for your rooms
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rate Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Edit Rate Plan' : 'Create New Rate Plan'}
              </DialogTitle>
              <DialogDescription>
                Configure pricing rules and availability for room types
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Summer Special 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Plan Type</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="advance_booking">Advance Booking</SelectItem>
                      <SelectItem value="last_minute">Last Minute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this rate plan..."
                />
              </div>

              {/* Room Type */}
              <div className="space-y-2">
                <Label>Room Type (Optional)</Label>
                <Select value={formData.room_type_id || ''} onValueChange={(value) => setFormData({ ...formData, room_type_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Apply to all room types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Room Types</SelectItem>
                    {roomTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} (₦{type.base_rate.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Adjustment Type</Label>
                  <Select value={formData.adjustment_type} onValueChange={(value: any) => setFormData({ ...formData, adjustment_type: value })}>
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
                  <Label>Adjustment</Label>
                  <Input
                    type="number"
                    value={formData.adjustment}
                    onChange={(e) => setFormData({ ...formData, adjustment: parseFloat(e.target.value) || 0 })}
                    placeholder={formData.adjustment_type === 'percentage' ? '10' : '5000'}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.adjustment_type === 'percentage' ? 'Percentage change' : 'Amount in ₦'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="p-2 bg-muted rounded text-sm">
                    {formData.adjustment_type === 'percentage' 
                      ? `${formData.adjustment > 0 ? '+' : ''}${formData.adjustment}%`
                      : `${formData.adjustment > 0 ? '+' : ''}₦${formData.adjustment.toLocaleString()}`
                    }
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Restrictions */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_stay">Min Stay (nights)</Label>
                  <Input
                    id="min_stay"
                    type="number"
                    value={formData.min_stay}
                    onChange={(e) => setFormData({ ...formData, min_stay: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_stay">Max Stay (nights)</Label>
                  <Input
                    id="max_stay"
                    type="number"
                    value={formData.max_stay}
                    onChange={(e) => setFormData({ ...formData, max_stay: parseInt(e.target.value) || 30 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advance_booking">Advance Booking (days)</Label>
                  <Input
                    id="advance_booking"
                    type="number"
                    value={formData.advance_booking}
                    onChange={(e) => setFormData({ ...formData, advance_booking: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {formData.type === 'corporate' && (
                <div className="space-y-2">
                  <Label htmlFor="corporate_code">Corporate Code</Label>
                  <Input
                    id="corporate_code"
                    value={formData.corporate_code}
                    onChange={(e) => setFormData({ ...formData, corporate_code: e.target.value })}
                    placeholder="CORP2024"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={editingPlan ? handleUpdate : handleCreate}>
                {editingPlan ? 'Update' : 'Create'} Rate Plan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Plans</p>
                <p className="text-2xl font-bold">{ratePlans.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Plans</p>
                <p className="text-2xl font-bold text-success">{activePlans.length}</p>
              </div>
              <Zap className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Promotional</p>
                <p className="text-2xl font-bold">{ratePlans.filter(p => p.type === 'promotional').length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Corporate</p>
                <p className="text-2xl font-bold">{ratePlans.filter(p => p.type === 'corporate').length}</p>
              </div>
              <Settings className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Rate Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Active Rate Plans</CardTitle>
          <CardDescription>Currently active pricing strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activePlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{plan.name}</h4>
                      <Badge className={getTypeColor(plan.type)}>
                        {plan.type.replace('_', ' ')}
                      </Badge>
                      <Badge variant="secondary">
                        {plan.adjustment_type === 'percentage' 
                          ? `${plan.adjustment > 0 ? '+' : ''}${plan.adjustment}%`
                          : `${plan.adjustment > 0 ? '+' : ''}₦${plan.adjustment.toLocaleString()}`
                        }
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Period:</span> {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Final Rate:</span> ₦{plan.final_rate.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Min Stay:</span> {plan.min_stay} nights
                      </div>
                      <div>
                        <span className="font-medium">Room Type:</span> {plan.room_type_id ? 'Specific' : 'All Types'}
                      </div>
                    </div>

                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkApplyDialog({ plan })}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Apply Bulk
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(plan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(plan)}
                    >
                      <ToggleRight className="h-4 w-4 text-success" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(plan)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}

            {activePlans.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Rate Plans</h3>
                <p className="text-muted-foreground">Create your first rate plan to start dynamic pricing</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Apply Dialog */}
      <Dialog open={!!bulkApplyDialog} onOpenChange={() => setBulkApplyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Rate Plan: {bulkApplyDialog?.plan.name}</DialogTitle>
            <DialogDescription>
              Apply this rate plan to multiple room types for a specific date range
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Room Types</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {roomTypes.map(type => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.id}
                      checked={bulkApplyData.selectedRoomTypes.includes(type.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setBulkApplyData(prev => ({
                            ...prev,
                            selectedRoomTypes: [...prev.selectedRoomTypes, type.id]
                          }));
                        } else {
                          setBulkApplyData(prev => ({
                            ...prev,
                            selectedRoomTypes: prev.selectedRoomTypes.filter(id => id !== type.id)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={type.id} className="flex-1">
                      {type.name} (₦{type.base_rate.toLocaleString()})
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={bulkApplyData.startDate}
                  onChange={(e) => setBulkApplyData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={bulkApplyData.endDate}
                  onChange={(e) => setBulkApplyData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBulkApplyDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleBulkApply}>
              Apply to {bulkApplyData.selectedRoomTypes.length} Room Type(s)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}