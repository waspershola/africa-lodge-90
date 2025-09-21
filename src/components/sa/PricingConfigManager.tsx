import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, ArrowUpDown } from 'lucide-react';
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
  created_at: string;
  updated_at: string;
}

export function PricingConfigManager() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'created_at'>('created_at');

  // Fetch plans from Supabase
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching plans:', error);
        toast.error('Failed to fetch pricing plans');
        return;
      }

      // Transform the data to ensure features is always a string array
      const transformedData = (data as any || [])?.map((plan: any) => ({
        ...plan,
        features: Array.isArray(plan.features) ? 
          plan.features.map((f: any) => typeof f === 'string' ? f : String(f)) : 
          typeof plan.features === 'string' ? [plan.features] : [],
        trial_days: plan.trial_days || 14,
        price_annual: plan.price_annual || undefined,
        created_at: plan.created_at || new Date().toISOString(),
        updated_at: plan.updated_at || new Date().toISOString()
      })) || [];

      setPlans(transformedData);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to fetch pricing plans');
    } finally {
      setLoading(false);
    }
  };

  // Load plans on component mount
  useEffect(() => {
    fetchPlans();
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
      if (isCreating) {
        const { error } = await supabase
          .from('plans')
          .insert({
            name: editingPlan.name,
            price_monthly: editingPlan.price_monthly,
            price_annual: editingPlan.price_annual,
            max_rooms: editingPlan.max_rooms,
            max_staff: editingPlan.max_staff,
            features: editingPlan.features,
            trial_days: editingPlan.trial_days
          } as any);

        if (error) throw error;
        toast.success('Plan created successfully');
      } else {
        const { error } = await supabase
          .from('plans')
          .update({
            name: editingPlan.name,
            price_monthly: editingPlan.price_monthly,
            price_annual: editingPlan.price_annual,
            max_rooms: editingPlan.max_rooms,
            max_staff: editingPlan.max_staff,
            features: editingPlan.features,
            trial_days: editingPlan.trial_days,
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', editingPlan.id as any);

        if (error) throw error;
        toast.success('Plan updated successfully');
      }

      setEditingPlan(null);
      setIsCreating(false);
      fetchPlans();
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
      .eq('id', planId as any);

      if (error) throw error;
      toast.success('Plan deleted successfully');
      fetchPlans();
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

                <div className="text-sm text-muted-foreground">
                  {plan.trial_days} day trial • Created {new Date(plan.created_at).toLocaleDateString()}
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