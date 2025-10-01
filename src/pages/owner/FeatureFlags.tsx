/**
 * Feature Flags Admin Page
 * Allows OWNER/SUPER_ADMIN to toggle feature flags for production deployment
 */

import { useState } from 'react';
import { useAllFeatureFlags, useUpsertFeatureFlag } from '@/hooks/useFeatureFlags';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Flag, Info, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Feature flag metadata with deployment information
const FEATURE_FLAG_INFO = {
  'ff/background_jobs_enabled': {
    title: 'Background Jobs',
    category: 'Week 1 - Operations',
    description: 'Enable automated background jobs (auto-checkout, revenue refresh, trial expiry, SMS monitoring)',
    impact: 'MEDIUM' as const,
    benefits: ['Automated checkout of overdue reservations', 'Daily revenue view updates', 'Trial expiry monitoring', 'SMS credit alerts'],
    risks: ['Unexpected automated actions', 'Email/SMS notifications to guests'],
    deploymentWeek: 1,
  },
  'ff/paginated_reservations': {
    title: 'Query Pagination',
    category: 'Week 2 - Performance',
    description: 'Enable pagination for large data queries (reservations, rooms, payments)',
    impact: 'LOW' as const,
    benefits: ['40-60% faster query performance', 'Reduced memory usage', 'Better response under load'],
    risks: ['UI changes in list views', 'Pagination controls visible'],
    deploymentWeek: 2,
  },
  'ff/sentry_enabled': {
    title: 'Sentry Error Tracking',
    category: 'Week 3 - Monitoring',
    description: 'Enable Sentry for error tracking, performance monitoring, and session replay',
    impact: 'LOW' as const,
    benefits: ['Real-time error alerts', 'Performance insights', 'Session replay for debugging'],
    risks: ['Requires Sentry DSN configuration', 'Data sent to external service'],
    deploymentWeek: 3,
  },
  'ff/atomic_checkin_v2': {
    title: 'Enhanced Atomic Operations',
    category: 'Week 4 - Reliability',
    description: 'Enable enhanced check-in/checkout with advisory locks and race condition prevention',
    impact: 'MEDIUM' as const,
    benefits: ['Zero race conditions', 'Enhanced error handling', 'Better concurrent operation safety'],
    risks: ['Changes core reservation flow', 'Requires thorough testing'],
    deploymentWeek: 4,
  },
};

type FlagName = keyof typeof FEATURE_FLAG_INFO;

export default function FeatureFlagsPage() {
  const { data: flags, isLoading, refetch } = useAllFeatureFlags();
  const upsertFlag = useUpsertFeatureFlag();
  const { toast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    flagName: string;
    currentState: boolean;
    newState: boolean;
  } | null>(null);

  const handleToggle = async (flagName: string, currentState: boolean) => {
    // Show confirmation dialog
    setConfirmDialog({
      open: true,
      flagName,
      currentState,
      newState: !currentState,
    });
  };

  const confirmToggle = async () => {
    if (!confirmDialog) return;

    try {
      await upsertFlag.mutateAsync({
        flag_name: confirmDialog.flagName,
        is_enabled: confirmDialog.newState,
      });

      toast({
        title: confirmDialog.newState ? 'Feature Enabled' : 'Feature Disabled',
        description: `${confirmDialog.flagName} has been ${confirmDialog.newState ? 'enabled' : 'disabled'}`,
      });

      setConfirmDialog(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update feature flag',
        variant: 'destructive',
      });
    }
  };

  const getImpactColor = (impact: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (impact) {
      case 'HIGH':
        return 'destructive';
      case 'MEDIUM':
        return 'outline';
      case 'LOW':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getDeploymentWeekColor = (week: number): "default" | "destructive" | "outline" | "secondary" => {
    const colors: ("default" | "destructive" | "outline" | "secondary")[] = ['default', 'secondary', 'outline', 'destructive'];
    return colors[week - 1] || 'default';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const productionFlags = flags?.filter(flag => 
    Object.keys(FEATURE_FLAG_INFO).includes(flag.flag_name)
  ) || [];

  const otherFlags = flags?.filter(flag => 
    !Object.keys(FEATURE_FLAG_INFO).includes(flag.flag_name)
  ) || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Flag className="h-8 w-8" />
              Feature Flags
            </h1>
            <p className="text-muted-foreground">
              Manage production deployment feature flags
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Deployment Guide */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Safe Production Deployment Strategy</AlertTitle>
        <AlertDescription>
          Enable features in weekly stages with monitoring between each phase. All changes are instantly reversible.
        </AlertDescription>
      </Alert>

      {/* Production Flags */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Production Deployment Flags</h2>
        
        {productionFlags.length === 0 ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Feature Flags Found</AlertTitle>
            <AlertDescription>
              Feature flags need to be initialized in the database. Contact support.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {productionFlags.map((flag) => {
              const info = FEATURE_FLAG_INFO[flag.flag_name as FlagName];
              if (!info) return null;

              return (
                <Card key={flag.id} className={flag.is_enabled ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {info.title}
                          <Badge variant={getDeploymentWeekColor(info.deploymentWeek)}>
                            Week {info.deploymentWeek}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{info.category}</CardDescription>
                      </div>
                      <Switch
                        checked={flag.is_enabled}
                        onCheckedChange={() => handleToggle(flag.flag_name, flag.is_enabled)}
                        disabled={upsertFlag.isPending}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={getImpactColor(info.impact)}>
                        {info.impact} Impact
                      </Badge>
                      {flag.is_enabled && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="font-medium text-green-600">Benefits:</p>
                        <ul className="list-disc list-inside text-muted-foreground">
                          {info.benefits.map((benefit, i) => (
                            <li key={i}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-orange-600">Considerations:</p>
                        <ul className="list-disc list-inside text-muted-foreground">
                          {info.risks.map((risk, i) => (
                            <li key={i}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      <code className="bg-muted px-2 py-1 rounded">{flag.flag_name}</code>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Other Flags */}
      {otherFlags.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Other Feature Flags</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {otherFlags.map((flag) => (
              <Card key={flag.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{flag.flag_name}</CardTitle>
                    <Switch
                      checked={flag.is_enabled}
                      onCheckedChange={() => handleToggle(flag.flag_name, flag.is_enabled)}
                      disabled={upsertFlag.isPending}
                    />
                  </div>
                </CardHeader>
                {flag.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{flag.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog?.open || false} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.newState ? 'Enable' : 'Disable'} Feature Flag?
            </DialogTitle>
            <DialogDescription>
              You are about to {confirmDialog?.newState ? 'enable' : 'disable'} <code className="bg-muted px-2 py-1 rounded">{confirmDialog?.flagName}</code>
            </DialogDescription>
          </DialogHeader>
          
          {confirmDialog && FEATURE_FLAG_INFO[confirmDialog.flagName as FlagName] && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {confirmDialog.newState ? (
                  <>
                    <p className="font-medium mb-2">This will activate:</p>
                    <ul className="list-disc list-inside text-sm">
                      {FEATURE_FLAG_INFO[confirmDialog.flagName as FlagName].benefits.map((benefit, i) => (
                        <li key={i}>{benefit}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>This will immediately disable this feature across the system. Changes take effect instantly.</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmToggle} 
              disabled={upsertFlag.isPending}
              variant={confirmDialog?.newState ? 'default' : 'destructive'}
            >
              {upsertFlag.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm {confirmDialog?.newState ? 'Enable' : 'Disable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
