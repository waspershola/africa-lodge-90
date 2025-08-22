import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  AlertTriangle, 
  Shield, 
  Power,
  Clock,
  Building2,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useEmergencyMode, useToggleEmergencyMode, useTenants } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function Emergency() {
  const { toast } = useToast();

  const { data: emergencyData, isLoading: emergencyLoading, error: emergencyError, refetch: refetchEmergency } = useEmergencyMode();
  const { data: tenantsData, isLoading: tenantsLoading, error: tenantsError } = useTenants();
  const toggleEmergencyMode = useToggleEmergencyMode();

  if (emergencyLoading || tenantsLoading) return <LoadingState message="Loading emergency controls..." />;
  if (emergencyError || tenantsError) return <ErrorState message="Failed to load emergency data" onRetry={refetchEmergency} />;

  const emergency = emergencyData?.data;
  const tenants = tenantsData?.data || [];

  const handleToggleGlobalEmergency = async () => {
    try {
      await toggleEmergencyMode.mutateAsync({ type: 'global', enabled: !emergency?.globalMode });
      toast({ 
        title: emergency?.globalMode ? "Global emergency mode disabled" : "Global emergency mode enabled",
        variant: emergency?.globalMode ? "default" : "destructive"
      });
    } catch (error) {
      toast({ title: "Failed to toggle emergency mode", variant: "destructive" });
    }
  };

  const handleToggleTenantEmergency = async (tenantId: string, enabled: boolean) => {
    try {
      await toggleEmergencyMode.mutateAsync({ type: 'tenant', tenantId, enabled });
      toast({ 
        title: `Emergency mode ${enabled ? 'enabled' : 'disabled'} for hotel`,
        variant: enabled ? "destructive" : "default"
      });
    } catch (error) {
      toast({ title: "Failed to toggle tenant emergency mode", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-success';
      case 'emergency': return 'text-danger';
      case 'maintenance': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-success/10 text-success border-success/20';
      case 'emergency': return 'bg-danger/10 text-danger border-danger/20';
      case 'maintenance': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      initial="initial"
      animate="animate"
      variants={{
        animate: { transition: { staggerChildren: 0.1 } }
      }}
    >
      {/* Header */}
      <motion.div variants={fadeIn}>
        <h1 className="text-3xl font-bold display-heading text-gradient">Emergency Control Center</h1>
        <p className="text-muted-foreground mt-2">Manage platform-wide and tenant-specific emergency modes</p>
      </motion.div>

      {/* Global Emergency Status */}
      <motion.div variants={fadeIn}>
        {emergency?.globalMode && (
          <Alert className="border-danger bg-danger/5">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <AlertDescription className="text-danger font-medium">
              Global Emergency Mode is currently ACTIVE. All hotels are operating in emergency mode.
            </AlertDescription>
          </Alert>
        )}
      </motion.div>

      {/* Control Panel */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Emergency Control */}
        <Card className={`modern-card ${emergency?.globalMode ? 'border-danger bg-danger/5' : 'border-success bg-success/5'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className={`h-5 w-5 ${emergency?.globalMode ? 'text-danger' : 'text-success'}`} />
              Global Emergency Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="global-emergency" className="font-medium">
                Emergency Mode
              </Label>
              <Switch
                id="global-emergency"
                checked={emergency?.globalMode || false}
                onCheckedChange={handleToggleGlobalEmergency}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge className={emergency?.globalMode ? 'bg-danger/10 text-danger border-danger/20' : 'bg-success/10 text-success border-success/20'}>
                  {emergency?.globalMode ? 'EMERGENCY' : 'NORMAL'}
                </Badge>
              </div>
              
              {emergency?.lastToggled && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Last Changed:</span>
                  <span>{new Date(emergency.lastToggled).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="pt-2 text-xs text-muted-foreground">
              When enabled, all hotels will be forced into emergency mode regardless of individual settings.
            </div>
          </CardContent>
        </Card>

        {/* System Stats */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total Hotels</span>
                </div>
                <span className="font-semibold">{tenants.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-danger" />
                  <span className="text-sm">Emergency Mode</span>
                </div>
                <span className="font-semibold text-danger">
                  {tenants.filter((t: any) => t.emergencyMode || emergency?.globalMode).length}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">Normal Operation</span>
                </div>
                <span className="font-semibold text-success">
                  {tenants.filter((t: any) => !t.emergencyMode && !emergency?.globalMode).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant={emergency?.globalMode ? "destructive" : "default"}
              className="w-full gap-2"
              onClick={handleToggleGlobalEmergency}
            >
              <Power className="h-4 w-4" />
              {emergency?.globalMode ? 'Disable Global Emergency' : 'Enable Global Emergency'}
            </Button>
            
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tenant Emergency Controls */}
      <motion.div variants={fadeIn}>
        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Hotel Emergency Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Emergency Mode</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant: any) => {
                  const isEmergency = tenant.emergencyMode || emergency?.globalMode;
                  const status = emergency?.globalMode ? 'emergency' : (tenant.emergencyMode ? 'emergency' : 'normal');
                  
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-muted-foreground">{tenant.slug}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {tenant.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(status)}>
                          {status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={tenant.emergencyMode || false}
                          onCheckedChange={(checked) => handleToggleTenantEmergency(tenant.id, checked)}
                          disabled={emergency?.globalMode}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {tenant.lastUpdated ? new Date(tenant.lastUpdated).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleTenantEmergency(tenant.id, !tenant.emergencyMode)}
                          disabled={emergency?.globalMode}
                          className={isEmergency ? "text-success hover:text-success" : "text-danger hover:text-danger"}
                        >
                          {isEmergency ? 'Disable' : 'Enable'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}