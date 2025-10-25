// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Package, CreditCard, Zap, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Addon, AddonType, BillingInterval } from '@/types/billing';

interface AddonFormData {
  name: string;
  description: string;
  addon_type: AddonType;
  price: number;
  is_recurring: boolean;
  billing_interval: BillingInterval;
  sms_credits_bonus: number;
  is_active: boolean;
}

const initialFormData: AddonFormData = {
  name: '',
  description: '',
  addon_type: 'sms_bundle',
  price: 0,
  is_recurring: false,
  billing_interval: 'one_time',
  sms_credits_bonus: 0,
  is_active: true
};

const addonTypeIcons = {
  sms_bundle: CreditCard,
  integration: Zap,
  customization: Settings,
  feature: Package
};

const addonTypeLabels = {
  sms_bundle: 'SMS Bundle',
  integration: 'Integration',
  customization: 'Customization',
  feature: 'Feature'
};

export const AddonCatalogManager: React.FC = () => {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [formData, setFormData] = useState<AddonFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const { toast } = useToast();

  const loadAddons = async () => {
    try {
      const { data, error } = await supabase
        .from('addons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddons((data || []) as Addon[]);
    } catch (err: any) {
      console.error('Error loading addons:', err);
      toast({
        title: "Error",
        description: "Failed to load addons",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadAddons();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        // Update existing addon
        const { error } = await supabase
          .from('addons')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Addon updated successfully",
        });
      } else {
        // Create new addon
        const { error } = await supabase
          .from('addons')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Addon created successfully",
        });
      }

      // Reset form and reload data
      setFormData(initialFormData);
      setEditingId(null);
      setShowForm(false);
      await loadAddons();

    } catch (err: any) {
      console.error('Error saving addon:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to save addon",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (addon: Addon) => {
    setFormData({
      name: addon.name,
      description: addon.description,
      addon_type: addon.addon_type,
      price: addon.price,
      is_recurring: addon.is_recurring,
      billing_interval: addon.billing_interval,
      sms_credits_bonus: addon.sms_credits_bonus,
      is_active: addon.is_active
    });
    setEditingId(addon.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this addon?')) return;

    try {
      const { error } = await supabase
        .from('addons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Addon deleted successfully",
      });

      await loadAddons();
    } catch (err: any) {
      console.error('Error deleting addon:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete addon",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Add-on Catalog</h2>
          <p className="text-muted-foreground">Manage available add-ons for hotel subscriptions</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Add-on
        </Button>
      </div>

      {/* Add-on Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Add-on' : 'Create New Add-on'}</CardTitle>
            <CardDescription>
              Configure add-on details and pricing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="SMS Bundle - 1000 Credits"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addon_type">Type</Label>
                  <Select 
                    value={formData.addon_type} 
                    onValueChange={(value: AddonType) => setFormData({ ...formData, addon_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(addonTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
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
                  placeholder="Describe what this add-on provides..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₦)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="1000"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms_credits">SMS Credits Bonus</Label>
                  <Input
                    id="sms_credits"
                    type="number"
                    value={formData.sms_credits_bonus}
                    onChange={(e) => setFormData({ ...formData, sms_credits_bonus: parseInt(e.target.value) || 0 })}
                    placeholder="1000"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_interval">Billing Interval</Label>
                  <Select 
                    value={formData.billing_interval} 
                    onValueChange={(value: BillingInterval) => setFormData({ ...formData, billing_interval: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One Time</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                  />
                  <Label htmlFor="is_recurring">Recurring</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-gradient-primary">
                  {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add-ons List */}
      <div className="grid gap-4">
        {addons.map((addon) => {
          const IconComponent = addonTypeIcons[addon.addon_type];
          return (
            <Card key={addon.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{addon.name}</h3>
                        <Badge variant={addon.is_active ? "default" : "secondary"}>
                          {addon.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">
                          {addonTypeLabels[addon.addon_type]}
                        </Badge>
                        {addon.is_recurring && (
                          <Badge variant="outline">
                            {addon.billing_interval}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{addon.description}</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="font-medium">₦{addon.price.toLocaleString()}</span>
                        {addon.sms_credits_bonus > 0 && (
                          <span className="text-muted-foreground">
                            +{addon.sms_credits_bonus} SMS credits
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(addon)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(addon.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {addons.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Add-ons</h3>
          <p className="text-muted-foreground mb-4">Create your first add-on to start offering additional services</p>
          <Button onClick={() => setShowForm(true)} className="bg-gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Add-on
          </Button>
        </div>
      )}
    </div>
  );
};