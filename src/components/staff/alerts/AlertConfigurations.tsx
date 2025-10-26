import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings, Plus, Edit, Trash2, AlertTriangle } from "lucide-react";

interface AlertConfig {
  id: string;
  alert_type: string;
  alert_name: string;
  description?: string;
  priority: string;
  channels: string[];
  trigger_conditions: any;
  is_active: boolean;
  created_at: string;
}

const alertTypes = [
  { value: 'maintenance', label: 'Maintenance Alert' },
  { value: 'housekeeping', label: 'Housekeeping Alert' },
  { value: 'guest_issue', label: 'Guest Issue' },
  { value: 'system', label: 'System Alert' },
  { value: 'security', label: 'Security Alert' },
  { value: 'emergency', label: 'Emergency Alert' },
  { value: 'inventory', label: 'Inventory Alert' },
  { value: 'staff_schedule', label: 'Staff Schedule Alert' }
];

const priorityLevels = [
  { value: 'low', label: 'Low Priority', color: 'text-green-600' },
  { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
  { value: 'high', label: 'High Priority', color: 'text-red-600' },
  { value: 'critical', label: 'Critical', color: 'text-red-800' }
];

const notificationChannels = [
  { id: 'sms', label: 'SMS', description: 'Send SMS notifications' },
  { id: 'email', label: 'Email', description: 'Send email notifications' },
  { id: 'in_app', label: 'In-App', description: 'Show in-app notifications' },
  { id: 'push', label: 'Push', description: 'Send push notifications' }
];

export function AlertConfigurations() {
  const [configs, setConfigs] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<AlertConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const { data, error } = await supabase
        .from('staff_alert_configs')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching alert configurations:', error);
      toast({
        title: "Error",
        description: "Failed to load alert configurations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (formData: FormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const channels = formData.getAll('channels') as string[];
      const configData = {
        tenant_id: userData.tenant_id,
        alert_type: formData.get('alert_type') as string,
        alert_name: formData.get('alert_name') as string,
        description: formData.get('description') as string,
        priority: formData.get('priority') as string,
        channels,
        trigger_conditions: {},
        is_active: true,
        created_by: user.id
      };

      if (editingConfig?.id) {
        const { error } = await supabase
          .from('staff_alert_configs')
          .update(configData)
          .eq('id', editingConfig.id);

        if (error) throw error;
        toast({ title: "Success", description: "Alert configuration updated" });
      } else {
        const { error } = await supabase
          .from('staff_alert_configs')
          .insert([configData]);

        if (error) throw error;
        toast({ title: "Success", description: "Alert configuration created" });
      }

      setDialogOpen(false);
      setEditingConfig(null);
      fetchConfigurations();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfig = async (id: string) => {
    try {
      const { error } = await supabase
        .from('staff_alert_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Configuration deleted" });
      fetchConfigurations();
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast({
        title: "Error",
        description: "Failed to delete configuration",
        variant: "destructive",
      });
    }
  };

  const toggleConfigStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('staff_alert_configs')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast({ 
        title: "Success", 
        description: `Configuration ${!currentStatus ? 'activated' : 'deactivated'}` 
      });
      fetchConfigurations();
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center">Loading alert configurations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Alert Configurations</h2>
          <p className="text-muted-foreground">Configure automated staff alerts and notifications</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingConfig(null)}>
              <Plus className="mr-2 h-4 w-4" />
              New Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Edit Configuration' : 'Create Configuration'}
              </DialogTitle>
              <DialogDescription>
                Configure automated alerts for staff notifications
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleSaveConfig(formData);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alert_name">Alert Name</Label>
                  <Input
                    id="alert_name"
                    name="alert_name"
                    defaultValue={editingConfig?.alert_name || ''}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert_type">Alert Type</Label>
                  <Select name="alert_type" defaultValue={editingConfig?.alert_type || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select alert type" />
                    </SelectTrigger>
                    <SelectContent>
                      {alertTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
                  name="description"
                  placeholder="Describe when this alert should be triggered"
                  defaultValue={editingConfig?.description || ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select name="priority" defaultValue={editingConfig?.priority || 'medium'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <span className={level.color}>{level.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notification Channels</Label>
                <div className="grid grid-cols-2 gap-3">
                  {notificationChannels.map((channel) => (
                    <div key={channel.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`channel-${channel.id}`}
                        name="channels"
                        value={channel.id}
                        defaultChecked={editingConfig?.channels?.includes(channel.id)}
                        className="rounded border-gray-300"
                      />
                      <Label 
                        htmlFor={`channel-${channel.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {channel.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingConfig ? 'Update' : 'Create'} Configuration
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {configs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No configurations yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first alert configuration to start automated staff notifications
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Configuration
              </Button>
            </CardContent>
          </Card>
        ) : (
          configs.map((config) => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {config.alert_name}
                      <Badge variant={config.is_active ? 'default' : 'secondary'}>
                        {config.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className={
                          config.priority === 'critical' || config.priority === 'high' 
                            ? 'border-red-200 text-red-700' 
                            : config.priority === 'medium'
                            ? 'border-yellow-200 text-yellow-700'
                            : 'border-green-200 text-green-700'
                        }
                      >
                        {priorityLevels.find(p => p.value === config.priority)?.label || config.priority}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {alertTypes.find(t => t.value === config.alert_type)?.label || config.alert_type}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleConfigStatus(config.id, config.is_active)}
                    >
                      {config.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingConfig(config);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteConfig(config.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {config.description && (
                    <div>
                      <Label className="text-sm font-medium">Description:</Label>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Notification Channels:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {config.channels?.map((channel, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {notificationChannels.find(c => c.id === channel)?.label || channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}