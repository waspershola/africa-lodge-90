import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  RotateCcw,
  DollarSign,
  Users,
  Calendar,
  Video,
  Settings
} from 'lucide-react';
import { usePricingPlans, PricingPlan } from '@/hooks/usePricingPlans';

export function PricingConfigManager() {
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const { plans, loading, refreshPlans } = usePricingPlans();

  const createNewPlan = () => {
    const newPlan: PricingPlan = {
      id: '',
      name: '',
      price: 0,
      currency: 'NGN',
      description: '',
      features: [],
      room_capacity_min: 1,
      room_capacity_max: 25,
      popular: false,
      trial_enabled: true,
      trial_duration_days: 14,
      demo_video_url: '',
      cta_text: 'Start Free Trial',
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setEditingPlan(newPlan);
    setIsCreating(true);
    setHasChanges(true);
  };

  const editPlan = (plan: PricingPlan) => {
    setEditingPlan({ ...plan });
    setIsCreating(false);
    setHasChanges(false);
  };

  const savePlan = async () => {
    if (!editingPlan) return;
    
    try {
      // In production, this will call the API
      console.log('Saving plan:', editingPlan);
      
      setEditingPlan(null);
      setIsCreating(false);
      setHasChanges(false);
      await refreshPlans();
    } catch (error) {
      console.error('Failed to save plan:', error);
    }
  };

  const cancelEdit = () => {
    setEditingPlan(null);
    setIsCreating(false);
    setHasChanges(false);
  };

  const togglePlanStatus = async (planId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'draft' : 'active';
    console.log(`Toggling plan ${planId} from ${currentStatus} to ${newStatus}`);
    await refreshPlans();
  };

  const deletePlan = async (planId: string) => {
    if (confirm('Are you sure you want to delete this pricing plan?')) {
      console.log('Deleting plan:', planId);
      await refreshPlans();
    }
  };

  const updateEditingPlan = (updates: Partial<PricingPlan>) => {
    if (editingPlan) {
      setEditingPlan({ ...editingPlan, ...updates });
      setHasChanges(true);
    }
  };

  const addFeature = () => {
    if (editingPlan) {
      updateEditingPlan({ 
        features: [...editingPlan.features, 'New feature'] 
      });
    }
  };

  const updateFeature = (index: number, value: string) => {
    if (editingPlan) {
      const newFeatures = [...editingPlan.features];
      newFeatures[index] = value;
      updateEditingPlan({ features: newFeatures });
    }
  };

  const removeFeature = (index: number) => {
    if (editingPlan) {
      const newFeatures = editingPlan.features.filter((_, i) => i !== index);
      updateEditingPlan({ features: newFeatures });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pricing Configuration</h2>
          <p className="text-muted-foreground">Manage pricing plans displayed on the homepage</p>
        </div>
        <Button onClick={createNewPlan} className="bg-gradient-primary">
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {/* Plans Overview */}
      <div className="grid gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                      {plan.status}
                    </Badge>
                    {plan.popular && (
                      <Badge variant="outline" className="text-accent border-accent">
                        Most Popular
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-primary mt-1">
                    ₦{plan.price.toLocaleString()}/month
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePlanStatus(plan.id, plan.status)}
                  >
                    {plan.status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editPlan(plan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deletePlan(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {plan.room_capacity_min}-{plan.room_capacity_max === 9999 ? '∞' : plan.room_capacity_max} rooms
                </div>
                {plan.trial_enabled && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {plan.trial_duration_days}-day trial
                  </div>
                )}
                {plan.demo_video_url && (
                  <div className="flex items-center gap-1">
                    <Video className="h-4 w-4" />
                    Demo video
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Create Plan Modal */}
      {editingPlan && (
        <Card className="fixed inset-4 z-50 overflow-auto bg-background shadow-2xl border-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {isCreating ? 'Create New Plan' : `Edit ${editingPlan.name}`}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button 
                  onClick={savePlan}
                  className="bg-gradient-primary"
                  disabled={!hasChanges}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isCreating ? 'Create Plan' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={editingPlan.name}
                  onChange={(e) => updateEditingPlan({ name: e.target.value })}
                  placeholder="e.g., Growth"
                />
              </div>
              <div>
                <Label htmlFor="price">Monthly Price (₦)</Label>
                <Input
                  id="price"
                  type="number"
                  value={editingPlan.price}
                  onChange={(e) => updateEditingPlan({ price: Number(e.target.value) })}
                  placeholder="65000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={editingPlan.description}
                onChange={(e) => updateEditingPlan({ description: e.target.value })}
                placeholder="Ideal for mid-size hotels..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-rooms">Min Rooms</Label>
                <Input
                  id="min-rooms"
                  type="number"
                  value={editingPlan.room_capacity_min}
                  onChange={(e) => updateEditingPlan({ room_capacity_min: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="max-rooms">Max Rooms</Label>
                <Input
                  id="max-rooms"
                  type="number"
                  value={editingPlan.room_capacity_max === 9999 ? '' : editingPlan.room_capacity_max}
                  onChange={(e) => updateEditingPlan({ 
                    room_capacity_max: e.target.value ? Number(e.target.value) : 9999 
                  })}
                  placeholder="Leave empty for unlimited"
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
              <Label htmlFor="demo-video">Demo Video URL (optional)</Label>
              <Input
                id="demo-video"
                value={editingPlan.demo_video_url || ''}
                onChange={(e) => updateEditingPlan({ demo_video_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div>
              <Label htmlFor="cta-text">Call-to-Action Text</Label>
              <Input
                id="cta-text"
                value={editingPlan.cta_text}
                onChange={(e) => updateEditingPlan({ cta_text: e.target.value })}
                placeholder="Start Free Trial"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="popular"
                  checked={editingPlan.popular}
                  onCheckedChange={(checked) => updateEditingPlan({ popular: checked })}
                />
                <Label htmlFor="popular">Mark as most popular</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="trial"
                  checked={editingPlan.trial_enabled}
                  onCheckedChange={(checked) => updateEditingPlan({ trial_enabled: checked })}
                />
                <Label htmlFor="trial">Enable free trial</Label>
              </div>
            </div>

            {editingPlan.trial_enabled && (
              <div>
                <Label htmlFor="trial-days">Trial Duration (days)</Label>
                <Input
                  id="trial-days"
                  type="number"
                  value={editingPlan.trial_duration_days}
                  onChange={(e) => updateEditingPlan({ trial_duration_days: Number(e.target.value) })}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}