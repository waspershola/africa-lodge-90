import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Database,
  Zap,
  Shield,
  Headphones,
  FileText,
  Activity
} from 'lucide-react';
import { useShiftIntegrationStatus } from '@/hooks/useShiftIntegrationStatus';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'in_progress':
      return <Clock className="h-4 w-4 text-blue-600" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge variant="secondary" className="bg-green-50 text-green-700">Complete</Badge>;
    case 'in_progress':
      return <Badge variant="outline" className="border-blue-200 text-blue-700">In Progress</Badge>;
    default:
      return <Badge variant="outline" className="text-gray-500">Not Started</Badge>;
  }
};

const getPhaseIcon = (phase: string) => {
  if (phase.includes('Database')) return <Database className="h-5 w-5" />;
  if (phase.includes('System Integration')) return <Zap className="h-5 w-5" />;
  if (phase.includes('Testing')) return <Shield className="h-5 w-5" />;
  if (phase.includes('Connect')) return <Activity className="h-5 w-5" />;
  if (phase.includes('Frontend')) return <FileText className="h-5 w-5" />;
  return <CheckCircle className="h-5 w-5" />;
};

export const ShiftIntegrationDashboard = () => {
  const { user, tenant } = useAuth();
  const { 
    integrationStatus, 
    overallProgress, 
    completedItems, 
    totalItems, 
    isComplete 
  } = useShiftIntegrationStatus();

  if (!user || !tenant) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please log in to view shift integration status.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Shift Terminal Integration Status
            </span>
            <div className="flex items-center gap-2">
              {isComplete ? (
                <Badge variant="secondary" className="bg-green-50 text-green-700">
                  🎉 Complete
                </Badge>
              ) : (
                <Badge variant="outline">
                  {overallProgress}% Complete
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{completedItems}/{totalItems} items complete</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {isComplete && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                🎉 Shift terminal integration is complete! All phases have been successfully implemented 
                with full integration into your existing infrastructure. The system is ready for production use.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/shift-terminal" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Shift Terminal
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/front-desk">
                <Activity className="h-4 w-4 mr-2" />
                Front Desk Dashboard
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Phase Details */}
      <div className="grid gap-4">
        {integrationStatus.map((phase, phaseIndex) => (
          <Card key={phaseIndex} className={phase.completed ? 'border-green-200' : 'border-gray-200'}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {getPhaseIcon(phase.phase)}
                  {phase.phase}
                </span>
                {phase.completed ? (
                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                    ✅ Complete
                  </Badge>
                ) : (
                  <Badge variant="outline">In Progress</Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{phase.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {phase.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-grow space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Features Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Key Features Delivered
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Real-time shift notifications with audio alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Offline-first operations with automatic sync</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Comprehensive security validation system</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">PDF shift reports with branded templates</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Intelligent QR request routing to active staff</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Cash reconciliation with billing integration</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Multi-tenant isolation with full audit trails</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Seamless integration with existing infrastructure</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};