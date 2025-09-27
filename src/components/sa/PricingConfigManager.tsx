import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, ArrowUpDown, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PricingPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_annual?: number;
  max_rooms: number;
  max_staff: number;
  features: string[];
  trial_days: number;
  included_sms_credits: number;
  sms_rate_per_credit: number;
  room_capacity_min: number;
  room_capacity_max: number;
  included_addons: IncludedAddon[];
  created_at: string;
  updated_at: string;
}

interface Addon {
  id: string;
  name: string;
  description: string;
  addon_type: string;
  price: number;
  is_recurring: boolean;
  billing_interval: string;
  sms_credits_bonus: number;
  is_active: boolean;
}

interface IncludedAddon {
  addon_id: string;
  addon: Addon;
  quantity: number;
  is_included: boolean;
}

export function PricingConfigManager() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'created_at'>('created_at');

  // Fetch plans and addons from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch plans with their included add-ons
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select(`
          *,
          plan_addons (
            addon_id,
            quantity,
            is_included,
            addons (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (plansError) {
        console.error('Error fetching plans:', plansError);
        toast.error('Failed to fetch pricing plans');
        return;
      }

      // Fetch available add-ons
      const { data: addonsData, error: addonsError } = await supabase
        .from('addons')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (addonsError) {
        console.error('Error fetching add-ons:', addonsError);
        toast.error('Failed to fetch add-ons');
        return;
      }

      setAddons(addonsData || []);

      // Transform plans data
      const transformedPlans = plansData?.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? 
          plan.features.map(f => typeof f === 'string' ? f : String(f)) : 
          typeof plan.features === 'string' ? [plan.features] : [],
        trial_days: plan.trial_days || 14,
        included_sms_credits: plan.included_sms_credits || 0,
        sms_rate_per_credit: plan.sms_rate_per_credit || 0.50,
        room_capacity_min: plan.room_capacity_min || 1,
        room_capacity_max: plan.room_capacity_max || plan.max_rooms,
        price_annual: plan.price_annual || undefined,
        included_addons: plan.plan_addons?.map(pa => ({
          addon_id: pa.addon_id,
          addon: pa.addons,
          quantity: pa.quantity,
          is_included: pa.is_included
        })) || [],
        created_at: plan.created_at || new Date().toISOString(),
        updated_at: plan.updated_at || new Date().toISOString()
      })) || [];

      setPlans(transformedPlans);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingState />;

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price':
        return a.price_monthly - b.price_monthly;
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  const handleCreatePlan = () => {
    setEditingPlan({
      id: '',
      name: '',
      price_monthly: 0,
      price_annual: 0,
      max_rooms: 10,
      max_staff: 5,
      features: [],
      trial_days: 14,
      included_sms_credits: 0,
      sms_rate_per_credit: 0.50,
      room_capacity_min: 1,
      room_capacity_max: 10,
      included_addons: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setIsCreating(true);
  };

  const handleEditPlan = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setIsCreating(false);
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;

    try {
      let planId = editingPlan.id;

      if (isCreating) {
        // Create the plan first
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .insert({
            name: editingPlan.name,
            price_monthly: editingPlan.price_monthly,
            price_annual: editingPlan.price_annual,
            max_rooms: editingPlan.max_rooms,
            max_staff: editingPlan.max_staff,
            features: editingPlan.features,
            trial_days: editingPlan.trial_days,
            included_sms_credits: editingPlan.included_sms_credits,
            sms_rate_per_credit: editingPlan.sms_rate_per_credit,
            room_capacity_min: editingPlan.room_capacity_min,
            room_capacity_max: editingPlan.room_capacity_max
          })
          .select('id')
          .single();

        if (planError) throw planError;
        planId = planData.id;
        toast.success('Plan created successfully');
      } else {
        // Update existing plan
        const { error: planError } = await supabase
          .from('plans')
          .update({
            name: editingPlan.name,
            price_monthly: editingPlan.price_monthly,
            price_annual: editingPlan.price_annual,
            max_rooms: editingPlan.max_rooms,
            max_staff: editingPlan.max_staff,
            features: editingPlan.features,
            trial_days: editingPlan.trial_days,
            included_sms_credits: editingPlan.included_sms_credits,
            sms_rate_per_credit: editingPlan.sms_rate_per_credit,
            room_capacity_min: editingPlan.room_capacity_min,
            room_capacity_max: editingPlan.room_capacity_max,
            updated_at: new Date().toISOString()
          })
          .eq('id', planId);

        if (planError) throw planError;

        // Delete existing plan_addons for this plan
        await supabase
          .from('plan_addons')
          .delete()
          .eq('plan_id', planId);

        toast.success('Plan updated successfully');
      }

      // Insert the included add-ons
      if (editingPlan.included_addons.length > 0) {
        const planAddonsToInsert = editingPlan.included_addons
          .filter(addon => addon.is_included)
          .map(addon => ({
            plan_id: planId,
            addon_id: addon.addon_id,
            quantity: addon.quantity,
            is_included: true
          }));

        if (planAddonsToInsert.length > 0) {
          const { error: addonsError } = await supabase
            .from('plan_addons')
            .insert(planAddonsToInsert);

          if (addonsError) throw addonsError;
        }
      }

      setEditingPlan(null);
      setIsCreating(false);
      fetchData();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save plan');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      toast.success('Plan deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const addFeature = () => {
    if (editingPlan) {
      setEditingPlan({
        ...editingPlan,
        features: [...editingPlan.features, 'New feature']
      });
    }
  };

  const updateFeature = (index: number, value: string) => {
    if (editingPlan) {
      const newFeatures = [...editingPlan.features];
      newFeatures[index] = value;
      setEditingPlan({ ...editingPlan, features: newFeatures });
    }
  };

  const removeFeature = (index: number) => {
    if (editingPlan) {
      const newFeatures = editingPlan.features.filter((_, i) => i !== index);
      setEditingPlan({ ...editingPlan, features: newFeatures });
    }
  };

  const handleAddonToggle = (addon: Addon, checked: boolean) => {
    if (!editingPlan) return;

    const existingAddonIndex = editingPlan.included_addons.findIndex(
      ia => ia.addon_id === addon.id
    );

    let newIncludedAddons = [...editingPlan.included_addons];

    if (checked) {
      if (existingAddonIndex === -1) {
        newIncludedAddons.push({
          addon_id: addon.id,
          addon,
          quantity: 1,
          is_included: true
        });
      } else {
        newIncludedAddons[existingAddonIndex].is_included = true;
      }
    } else {
      if (existingAddonIndex !== -1) {
        newIncludedAddons = newIncludedAddons.filter(ia => ia.addon_id !== addon.id);
      }
    }

    setEditingPlan({ ...editingPlan, included_addons: newIncludedAddons });
  };

  const handleAddonQuantityChange = (addonId: string, quantity: number) => {
    if (!editingPlan) return;

    const newIncludedAddons = editingPlan.included_addons.map(addon => 
      addon.addon_id === addonId 
        ? { ...addon, quantity: Math.max(1, quantity) }
        : addon
    );

    setEditingPlan({ ...editingPlan, included_addons: newIncludedAddons });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pricing Configuration</h1>
          <p className="text-muted-foreground">Manage subscription plans and pricing tiers</p>
        </div>
        <Button onClick={handleCreatePlan} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex space-x-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search plans..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[150px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Created Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="price">Price</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlans?.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    Up to {plan.max_rooms} rooms • {plan.max_staff} staff members
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">
                    ₦{plan.price_monthly.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                  {plan.price_annual && (
                    <div className="text-sm text-muted-foreground">
                      ₦{plan.price_annual.toLocaleString()}/year
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Features:</p>
                  <div className="flex flex-wrap gap-1">
                    {plan.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                {plan.included_addons && plan.included_addons.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Included Add-ons:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {plan.included_addons.map((includedAddon, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {includedAddon.addon.name} {includedAddon.quantity > 1 && `(${includedAddon.quantity}x)`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  {plan.trial_days} day trial • {plan.included_sms_credits} SMS credits • Created {new Date(plan.created_at).toLocaleDateString()}
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditPlan(plan)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeletePlan(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Create Plan Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Create New Plan' : 'Edit Plan'}
            </DialogTitle>
            <DialogDescription>
              Configure pricing and features for this subscription plan
            </DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    placeholder="e.g., Starter, Professional"
                  />
                </div>
                <div>
                  <Label htmlFor="trial_days">Trial Days</Label>
                  <Input
                    id="trial_days"
                    type="number"
                    value={editingPlan.trial_days}
                    onChange={(e) => setEditingPlan({ ...editingPlan, trial_days: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_monthly">Monthly Price (₦)</Label>
                  <Input
                    id="price_monthly"
                    type="number"
                    step="0.01"
                    value={editingPlan.price_monthly}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price_monthly: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="price_annual">Annual Price (₦)</Label>
                  <Input
                    id="price_annual"
                    type="number"
                    step="0.01"
                    value={editingPlan.price_annual || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price_annual: parseFloat(e.target.value) || undefined })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_rooms">Maximum Rooms</Label>
                  <Input
                    id="max_rooms"
                    type="number"
                    value={editingPlan.max_rooms}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_rooms: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_staff">Maximum Staff</Label>
                  <Input
                    id="max_staff"
                    type="number"
                    value={editingPlan.max_staff}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_staff: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="room_capacity_min">Room Capacity Min</Label>
                  <Input
                    id="room_capacity_min"
                    type="number"
                    value={editingPlan.room_capacity_min}
                    onChange={(e) => setEditingPlan({ ...editingPlan, room_capacity_min: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label htmlFor="room_capacity_max">Room Capacity Max</Label>
                  <Input
                    id="room_capacity_max"
                    type="number"
                    value={editingPlan.room_capacity_max}
                    onChange={(e) => setEditingPlan({ ...editingPlan, room_capacity_max: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="included_sms_credits">Included SMS Credits</Label>
                  <Input
                    id="included_sms_credits"
                    type="number"
                    value={editingPlan.included_sms_credits}
                    onChange={(e) => setEditingPlan({ ...editingPlan, included_sms_credits: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="sms_rate_per_credit">SMS Rate per Credit (₦)</Label>
                  <Input
                    id="sms_rate_per_credit"
                    type="number"
                    step="0.01"
                    value={editingPlan.sms_rate_per_credit}
                    onChange={(e) => setEditingPlan({ ...editingPlan, sms_rate_per_credit: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label>Features</Label>
                <div className="space-y-2">
                  {editingPlan.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Feature description"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeFeature(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addFeature}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Feature
                  </Button>
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Included Add-ons
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select add-ons that will be automatically activated for hotels subscribing to this plan
                </p>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {addons.map((addon) => {
                    const includedAddon = editingPlan.included_addons.find(ia => ia.addon_id === addon.id);
                    const isSelected = includedAddon?.is_included || false;
                    
                    return (
                      <div key={addon.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleAddonToggle(addon, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{addon.name}</p>
                            <Badge variant="outline" className="text-xs">
                              {addon.addon_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{addon.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-medium">₦{addon.price.toLocaleString()}</span>
                            {addon.sms_credits_bonus > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                +{addon.sms_credits_bonus} SMS credits
                              </Badge>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`quantity-${addon.id}`} className="text-sm">Qty:</Label>
                            <Input
                              id={`quantity-${addon.id}`}
                              type="number"
                              min="1"
                              value={includedAddon?.quantity || 1}
                              onChange={(e) => handleAddonQuantityChange(addon.id, parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingPlan(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePlan}>
                  {isCreating ? 'Create Plan' : 'Update Plan'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}