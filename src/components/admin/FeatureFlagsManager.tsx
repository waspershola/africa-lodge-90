import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAllFeatureFlags, useUpsertFeatureFlag } from '@/hooks/useFeatureFlags';
import { toast } from 'sonner';
import { Flag, Plus, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const CRITICAL_FLAGS = [
  { name: 'ff/paginated_reservations', description: 'Enable pagination for reservations, rooms, and payments' },
  { name: 'ff/atomic_checkin_v2', description: 'Enhanced atomic check-in operations with improved error handling' },
  { name: 'ff/background_jobs_enabled', description: 'Enable background cron jobs for automated tasks' },
  { name: 'ff/sentry_enabled', description: 'Enable Sentry error tracking and monitoring' },
];

export function FeatureFlagsManager() {
  const { data: flags, isLoading } = useAllFeatureFlags();
  const upsertFlag = useUpsertFeatureFlag();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<any>(null);

  const handleToggle = async (flagName: string, currentValue: boolean) => {
    try {
      await upsertFlag.mutateAsync({
        flag_name: flagName,
        is_enabled: !currentValue,
      });
      toast.success(`Feature flag ${!currentValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update feature flag');
      console.error(error);
    }
  };

  const handleCreateFlag = async (flagData: any) => {
    try {
      await upsertFlag.mutateAsync(flagData);
      toast.success('Feature flag created successfully');
      setDialogOpen(false);
      setEditingFlag(null);
    } catch (error) {
      toast.error('Failed to create feature flag');
      console.error(error);
    }
  };

  const initializeCriticalFlags = async () => {
    for (const flag of CRITICAL_FLAGS) {
      const exists = flags?.find(f => f.flag_name === flag.name);
      if (!exists) {
        try {
          await upsertFlag.mutateAsync({
            flag_name: flag.name,
            description: flag.description,
            is_enabled: false,
            config: {},
            target_tenants: null,
            target_plans: null,
          });
        } catch (error) {
          console.error(`Failed to initialize ${flag.name}:`, error);
        }
      }
    }
    toast.success('Critical feature flags initialized');
  };

  if (isLoading) {
    return <div>Loading feature flags...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Feature Flags</h2>
          <p className="text-muted-foreground">Manage feature rollouts and toggles</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={initializeCriticalFlags} variant="outline">
            <Flag className="h-4 w-4 mr-2" />
            Initialize Critical Flags
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Flag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Feature Flag</DialogTitle>
                <DialogDescription>
                  Create a new feature flag for controlled rollouts
                </DialogDescription>
              </DialogHeader>
              <FlagForm onSubmit={handleCreateFlag} onCancel={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {flags?.map((flag) => (
          <Card key={flag.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium">{flag.flag_name}</CardTitle>
                {flag.description && (
                  <CardDescription>{flag.description}</CardDescription>
                )}
              </div>
              <Switch
                checked={flag.is_enabled}
                onCheckedChange={() => handleToggle(flag.flag_name, flag.is_enabled)}
              />
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm text-muted-foreground">
                {flag.target_tenants && flag.target_tenants.length > 0 && (
                  <div>Target Tenants: {flag.target_tenants.length}</div>
                )}
                {flag.target_plans && flag.target_plans.length > 0 && (
                  <div>Target Plans: {flag.target_plans.length}</div>
                )}
                {!flag.target_tenants && !flag.target_plans && (
                  <div>All Tenants</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {flags?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Flag className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No feature flags configured</p>
              <Button onClick={initializeCriticalFlags} variant="outline" className="mt-4">
                Initialize Critical Flags
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function FlagForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    flag_name: '',
    description: '',
    is_enabled: false,
    config: '{}',
    target_tenants: '',
    target_plans: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      flag_name: formData.flag_name,
      description: formData.description || null,
      is_enabled: formData.is_enabled,
      config: JSON.parse(formData.config || '{}'),
      target_tenants: formData.target_tenants ? formData.target_tenants.split(',').map(t => t.trim()) : null,
      target_plans: formData.target_plans ? formData.target_plans.split(',').map(p => p.trim()) : null,
    };
    
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="flag_name">Flag Name</Label>
        <Input
          id="flag_name"
          value={formData.flag_name}
          onChange={(e) => setFormData({ ...formData, flag_name: e.target.value })}
          placeholder="ff/my_feature"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="What does this flag control?"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_enabled"
          checked={formData.is_enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
        />
        <Label htmlFor="is_enabled">Enable immediately</Label>
      </div>

      <div>
        <Label htmlFor="target_tenants">Target Tenants (comma-separated IDs, leave empty for all)</Label>
        <Input
          id="target_tenants"
          value={formData.target_tenants}
          onChange={(e) => setFormData({ ...formData, target_tenants: e.target.value })}
          placeholder="tenant-id-1, tenant-id-2"
        />
      </div>

      <div>
        <Label htmlFor="target_plans">Target Plans (comma-separated IDs, leave empty for all)</Label>
        <Input
          id="target_plans"
          value={formData.target_plans}
          onChange={(e) => setFormData({ ...formData, target_plans: e.target.value })}
          placeholder="plan-id-1, plan-id-2"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Create Flag
        </Button>
      </div>
    </form>
  );
}
