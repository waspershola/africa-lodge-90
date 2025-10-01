import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Flag, RefreshCw } from 'lucide-react';
import { useAllFeatureFlags, useUpsertFeatureFlag } from '@/hooks/useFeatureFlags';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FlagConfig {
  name: string;
  flag_name: string;
  description: string;
  week: number;
  impact: 'low' | 'medium' | 'high';
  benefits: string[];
  risks: string[];
}

const FLAGS_CONFIG: FlagConfig[] = [
  {
    name: 'Background Jobs',
    flag_name: 'ff/background_jobs_enabled',
    description: 'Enables automated background tasks like auto-checkout',
    week: 1,
    impact: 'medium',
    benefits: [
      'Automated checkout processing',
      'Reduced manual workload',
      'Consistent task execution'
    ],
    risks: [
      'Monitor for false positives',
      'Check logs for errors'
    ]
  },
  {
    name: 'Paginated Reservations',
    flag_name: 'ff/paginated_reservations',
    description: 'Implements pagination for large reservation lists',
    week: 2,
    impact: 'low',
    benefits: [
      'Faster page loads',
      'Better performance at scale',
      'Improved user experience'
    ],
    risks: [
      'Minimal - UI enhancement only'
    ]
  },
  {
    name: 'Sentry Monitoring',
    flag_name: 'ff/sentry_enabled',
    description: 'Enables error tracking and performance monitoring',
    week: 3,
    impact: 'low',
    benefits: [
      'Real-time error tracking',
      'Performance insights',
      'Proactive issue detection'
    ],
    risks: [
      'Requires DSN configuration',
      'Additional data transmission'
    ]
  },
  {
    name: 'Atomic Check-in v2',
    flag_name: 'ff/atomic_checkin_v2',
    description: 'Enhanced check-in process with atomic operations',
    week: 4,
    impact: 'high',
    benefits: [
      'Prevents data inconsistencies',
      'Improved reliability',
      'Better error handling'
    ],
    risks: [
      'Core business logic change',
      'Test thoroughly before enabling'
    ]
  }
];

export default function FeatureFlags() {
  const { data: flags, isLoading, refetch } = useAllFeatureFlags();
  const upsertFlag = useUpsertFeatureFlag();
  const { toast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    flag: FlagConfig | null;
    currentState: boolean;
    newState: boolean;
  }>({ open: false, flag: null, currentState: false, newState: false });

  const handleToggle = (flag: FlagConfig, currentState: boolean) => {
    setConfirmDialog({
      open: true,
      flag,
      currentState,
      newState: !currentState
    });
  };

  const confirmToggle = async () => {
    if (!confirmDialog.flag) return;

    try {
      await upsertFlag.mutateAsync({
        flag_name: confirmDialog.flag.flag_name,
        is_enabled: confirmDialog.newState,
        description: confirmDialog.flag.description,
        config: {}
      });

      toast({
        title: confirmDialog.newState ? 'Feature Enabled' : 'Feature Disabled',
        description: `${confirmDialog.flag.name} has been ${confirmDialog.newState ? 'enabled' : 'disabled'}`,
      });

      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update feature flag',
        variant: 'destructive'
      });
    } finally {
      setConfirmDialog({ open: false, flag: null, currentState: false, newState: false });
    }
  };

  const getImpactVariant = (impact: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (impact) {
      case 'low': return 'secondary';
      case 'medium': return 'default';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  const getWeekVariant = (week: number): "default" | "secondary" | "destructive" | "outline" => {
    const weekMap: Record<number, "default" | "secondary" | "destructive" | "outline"> = {
      1: 'default',
      2: 'secondary',
      3: 'outline',
      4: 'destructive'
    };
    return weekMap[week] || 'default';
  };

  const getFlagState = (flagName: string) => {
    const flag = flags?.find(f => f.flag_name === flagName);
    return flag?.is_enabled || false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flag className="h-8 w-8" />
            Production Deployment
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage feature flags for staged rollout
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Staged Rollout Plan:</strong> Enable features week by week, monitoring performance and errors at each stage.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {FLAGS_CONFIG.map((flagConfig) => {
          const isEnabled = getFlagState(flagConfig.flag_name);
          
          return (
            <Card key={flagConfig.flag_name} className={isEnabled ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{flagConfig.name}</CardTitle>
                      <Badge variant={getWeekVariant(flagConfig.week)}>
                        Week {flagConfig.week}
                      </Badge>
                      <Badge variant={getImpactVariant(flagConfig.impact)}>
                        {flagConfig.impact} impact
                      </Badge>
                      {isEnabled && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{flagConfig.description}</CardDescription>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => handleToggle(flagConfig, isEnabled)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-green-600">Benefits:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                    {flagConfig.benefits.map((benefit, idx) => (
                      <li key={idx}>{benefit}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-amber-600">Monitor For:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                    {flagConfig.risks.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog({ ...confirmDialog, open })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.newState ? 'Enable' : 'Disable'} {confirmDialog.flag?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.newState ? (
                <>
                  This will activate <strong>{confirmDialog.flag?.name}</strong> for your production environment.
                  Make sure you've reviewed the monitoring strategy and are prepared to track its performance.
                </>
              ) : (
                <>
                  This will deactivate <strong>{confirmDialog.flag?.name}</strong> immediately.
                  Any features dependent on this flag will be disabled.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggle}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
