import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Flag, 
  Toggle, 
  Percent, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useFeatureFlags, useUpdateFeatureFlag, useCreateFeatureFlag, useTenants } from '@/hooks/useApi';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  environment: 'development' | 'staging' | 'production';
  tenantOverrides: { [tenantId: string]: boolean };
  createdAt: string;
  updatedAt: string;
}

export default function FeatureFlags() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);

  const { data: flagsData, isLoading, error, refetch } = useFeatureFlags();
  const { data: tenantsData } = useTenants();
  const updateFlag = useUpdateFeatureFlag();
  const createFlag = useCreateFeatureFlag();

  if (isLoading) return <LoadingState message="Loading feature flags..." />;
  if (error) return <ErrorState message="Failed to load feature flags" onRetry={refetch} />;

  const flags = flagsData?.data || [];
  const tenants = tenantsData?.data || [];

  const filteredFlags = flags.filter(flag => {
    const matchesSearch = flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flag.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEnvironment = selectedEnvironment === 'all' || flag.environment === selectedEnvironment;
    return matchesSearch && matchesEnvironment;
  });

  const handleToggleFlag = async (flagId: string, enabled: boolean) => {
    await updateFlag.mutateAsync({
      id: flagId,
      data: { enabled }
    });
  };

  const handleRolloutChange = async (flagId: string, percentage: number) => {
    await updateFlag.mutateAsync({
      id: flagId,
      data: { rolloutPercentage: percentage }
    });
  };

  const getStatusBadge = (flag: FeatureFlag) => {
    if (!flag.enabled) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    
    if (flag.rolloutPercentage === 100) {
      return <Badge className="bg-success/10 text-success border-success/20">Fully Enabled</Badge>;
    }
    
    return <Badge className="bg-warning/10 text-warning border-warning/20">{flag.rolloutPercentage}% Rollout</Badge>;
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'production': return 'bg-danger/10 text-danger border-danger/20';
      case 'staging': return 'bg-warning/10 text-warning border-warning/20';
      case 'development': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={{
        animate: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      {/* Header */}
      <motion.div variants={fadeIn}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold display-heading text-gradient mb-1">Feature Flags</h1>
            <p className="text-muted-foreground">Manage feature rollouts and tenant-specific overrides</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-luxury hover:shadow-hover">
                <Plus className="h-4 w-4 mr-2" />
                Create Flag
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Feature Flag</DialogTitle>
                <DialogDescription>
                  Create a new feature flag for controlled rollouts
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Flag Name</Label>
                  <Input placeholder="New Booking Flow" />
                </div>
                <div>
                  <Label>Flag Key</Label>
                  <Input placeholder="new_booking_flow" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea placeholder="Description of what this flag controls..." />
                </div>
                <div>
                  <Label>Environment</Label>
                  <Select defaultValue="development">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button>Create Flag</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeIn}>
        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search flags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Environments</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="modern-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{flags.length}</div>
          </CardContent>
        </Card>
        
        <Card className="modern-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {flags.filter(f => f.enabled).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="modern-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Full Rollout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {flags.filter(f => f.enabled && f.rolloutPercentage === 100).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="modern-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">With Overrides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {flags.filter(f => Object.keys(f.tenantOverrides || {}).length > 0).length}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Feature Flags Grid */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredFlags.map((flag) => (
          <Card key={flag.id} className="modern-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <Flag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{flag.name}</CardTitle>
                    <p className="text-sm text-muted-foreground font-mono">{flag.key}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(flag)}
                  <Badge className={getEnvironmentColor(flag.environment)}>
                    {flag.environment}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{flag.description}</p>
              
              {/* Toggle Control */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Toggle className="h-4 w-4" />
                  <span className="font-medium">Enabled</span>
                </div>
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={(enabled) => handleToggleFlag(flag.id, enabled)}
                />
              </div>

              {/* Rollout Percentage */}
              {flag.enabled && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      <span className="font-medium">Rollout Percentage</span>
                    </div>
                    <span className="text-sm font-mono">{flag.rolloutPercentage}%</span>
                  </div>
                  <Slider
                    value={[flag.rolloutPercentage]}
                    onValueChange={([value]) => handleRolloutChange(flag.id, value)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}

              {/* Tenant Overrides */}
              {Object.keys(flag.tenantOverrides || {}).length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium text-sm">Tenant Overrides</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(flag.tenantOverrides || {}).map(([tenantId, enabled]) => {
                      const tenant = tenants.find(t => t.id === tenantId);
                      return (
                        <Badge
                          key={tenantId}
                          variant={enabled ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {tenant?.name || tenantId}: {enabled ? 'ON' : 'OFF'}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Warning for Production */}
              {flag.environment === 'production' && flag.enabled && (
                <div className="flex items-center gap-2 p-2 bg-warning/10 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm text-warning">Production flag - changes affect live users</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {filteredFlags.length === 0 && (
        <motion.div variants={fadeIn}>
          <Card className="modern-card">
            <CardContent className="p-8 text-center">
              <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Feature Flags Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? `No flags match "${searchTerm}"` : 'Create your first feature flag to get started'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Feature Flag
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}