import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Settings, TestTube2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface SMSProvider {
  id: string;
  name: string;
  provider_type: string;
  api_key?: string;
  api_secret?: string;
  sender_id?: string;
  base_url?: string;
  is_enabled: boolean;
  is_default: boolean;
  priority: number;
  cost_per_sms: number;
  delivery_rate: number;
  health_status: string;
  last_health_check?: string;
}

export function ProviderSettings() {
  const [providers, setProviders] = useState<SMSProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<SMSProvider | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [testNumber, setTestNumber] = useState("");
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_providers')
        .select('*')
        .order('priority');

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error("Failed to load SMS providers");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProvider = async (provider: Partial<SMSProvider>) => {
    try {
      if (editingProvider?.id) {
        // Update existing provider
        const { error } = await supabase
          .from('sms_providers')
          .update(provider)
          .eq('id', editingProvider.id);

        if (error) throw error;
        toast.success("Provider updated successfully");
      } else {
        // Create new provider
        const { error } = await supabase
          .from('sms_providers')
          .insert(provider);

        if (error) throw error;
        toast.success("Provider created successfully");
      }

      fetchProviders();
      setIsDialogOpen(false);
      setEditingProvider(null);
    } catch (error) {
      console.error('Error saving provider:', error);
      toast.error("Failed to save provider");
    }
  };

  const testProvider = async (providerId: string) => {
    if (!testNumber) {
      toast.error("Please enter a test phone number");
      return;
    }

    setTesting(providerId);
    try {
      const { error } = await supabase.functions.invoke('sms-router', {
        body: {
          to: testNumber,
          message: "Test message from LuxuryHotelSaaS SMS system",
          tenant_id: "test",
          event_type: "test"
        }
      });

      if (error) throw error;
      toast.success("Test SMS sent successfully");
    } catch (error) {
      console.error('Error testing provider:', error);
      toast.error("Failed to send test SMS");
    } finally {
      setTesting(null);
    }
  };

  const toggleProvider = async (providerId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('sms_providers')
        .update({ is_enabled: enabled })
        .eq('id', providerId);

      if (error) throw error;
      
      fetchProviders();
      toast.success(`Provider ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error toggling provider:', error);
      toast.error("Failed to update provider status");
    }
  };

  const setDefaultProvider = async (providerId: string) => {
    try {
      // First, remove default from all providers
      await supabase
        .from('sms_providers')
        .update({ is_default: false });

      // Then set the selected provider as default
      const { error } = await supabase
        .from('sms_providers')
        .update({ is_default: true })
        .eq('id', providerId);

      if (error) throw error;
      
      fetchProviders();
      toast.success("Default provider updated successfully");
    } catch (error) {
      console.error('Error setting default provider:', error);
      toast.error("Failed to set default provider");
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading providers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SMS Provider Settings</h2>
          <p className="text-muted-foreground">
            Configure and manage SMS providers for the platform
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProvider(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingProvider ? 'Edit Provider' : 'Add New Provider'}
              </DialogTitle>
              <DialogDescription>
                Configure SMS provider settings and credentials
              </DialogDescription>
            </DialogHeader>
            <ProviderForm 
              provider={editingProvider} 
              onSave={handleSaveProvider}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Test SMS Section */}
      <Card>
        <CardHeader>
          <CardTitle>Test SMS</CardTitle>
          <CardDescription>
            Send a test SMS to verify provider functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="testNumber">Test Phone Number</Label>
              <Input
                id="testNumber"
                placeholder="+234801234567"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => testProvider('test')}
                disabled={!testNumber || testing !== null}
              >
                <TestTube2 className="w-4 h-4 mr-2" />
                {testing ? 'Sending...' : 'Test SMS'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Providers List */}
      <div className="grid gap-4">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{provider.name}</h3>
                      {provider.is_default && (
                        <Badge>Default</Badge>
                      )}
                      {getHealthIcon(provider.health_status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {provider.provider_type} • Priority: {provider.priority} • 
                      Rate: {provider.delivery_rate}% • 
                      Cost: ₦{provider.cost_per_sms}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={provider.is_enabled}
                    onCheckedChange={(checked) => toggleProvider(provider.id, checked)}
                  />
                  
                  {!provider.is_default && provider.is_enabled && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setDefaultProvider(provider.id)}
                    >
                      Set Default
                    </Button>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingProvider(provider);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProviderForm({ 
  provider, 
  onSave, 
  onCancel 
}: { 
  provider: SMSProvider | null;
  onSave: (provider: Partial<SMSProvider>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: provider?.name || '',
    provider_type: provider?.provider_type || 'termii',
    api_key: provider?.api_key || '',
    api_secret: provider?.api_secret || '',
    sender_id: provider?.sender_id || '',
    priority: provider?.priority || 1,
    cost_per_sms: provider?.cost_per_sms || 0,
    is_enabled: provider?.is_enabled ?? true
  });

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="name">Provider Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Termii Nigeria"
        />
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="provider_type">Provider Type</Label>
        <Select 
          value={formData.provider_type} 
          onValueChange={(value) => setFormData({ ...formData, provider_type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="termii">Termii</SelectItem>
            <SelectItem value="africastalking">Africa's Talking</SelectItem>
            <SelectItem value="twilio">Twilio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="api_key">API Key</Label>
        <Input
          id="api_key"
          type="password"
          value={formData.api_key}
          onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
        />
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="sender_id">Sender ID</Label>
        <Input
          id="sender_id"
          value={formData.sender_id}
          onChange={(e) => setFormData({ ...formData, sender_id: e.target.value })}
          placeholder="HOTEL"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Input
            id="priority"
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            min="1"
          />
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="cost_per_sms">Cost per SMS (₦)</Label>
          <Input
            id="cost_per_sms"
            type="number"
            step="0.01"
            value={formData.cost_per_sms}
            onChange={(e) => setFormData({ ...formData, cost_per_sms: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_enabled"
          checked={formData.is_enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
        />
        <Label htmlFor="is_enabled">Enable provider</Label>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(formData)}>
          Save Provider
        </Button>
      </DialogFooter>
    </div>
  );
}