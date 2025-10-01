/**
 * Staging Verification Debug Panel
 * UI for running and viewing automated verification tests
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Download,
  RefreshCw
} from 'lucide-react';
import { stagingVerification, type VerificationResult } from '@/utils/staging-verification';
import { useToast } from '@/hooks/use-toast';

const CANARY_TENANT_IDS = [
  '3d1ce4a9-c30e-403d-9ad6-1ae2fd263c04', // Grand Palace Lagos 2
  '5498d8e5-fe6c-4975-83bb-cdd2b1d39638', // azza lingo
  'a6c4eb38-97b7-455a-b0cc-146e8e43563b', // Grand Palace Mx
];

export function StagingVerificationPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<'PASS' | 'FAIL' | 'WARN' | null>(null);
  const { toast } = useToast();

  const runVerification = async () => {
    setIsRunning(true);
    setResults([]);
    setOverallStatus(null);

    try {
      const verificationResults = await stagingVerification.runAllVerifications(CANARY_TENANT_IDS);
      setResults(verificationResults);
      
      const status = stagingVerification.getOverallStatus();
      setOverallStatus(status);

      const report = stagingVerification.generateReport();
      
      toast({
        title: status === 'PASS' ? 'All Checks Passed' : status === 'WARN' ? 'Completed with Warnings' : 'Some Checks Failed',
        description: `${report.summary.passed}/${report.summary.totalTests} tests passed`,
        variant: status === 'FAIL' ? 'destructive' : 'default',
      });
    } catch (error) {
      console.error('[Staging Verification] Error:', error);
      toast({
        title: 'Verification Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const downloadReport = () => {
    const report = stagingVerification.generateReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staging-verification-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Report Downloaded',
      description: 'Verification report saved to your downloads',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'FAIL':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'WARN':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      PASS: 'default',
      FAIL: 'destructive',
      WARN: 'outline',
      SKIP: 'secondary',
    };

    return (
      <Badge variant={variants[status] || 'secondary'} className="gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Staging Verification
            </CardTitle>
            <CardDescription>
              Automated production deployment readiness checks
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {results.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadReport}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            )}
            <Button
              onClick={runVerification}
              disabled={isRunning}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              {isRunning ? 'Running...' : 'Run Verification'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Status */}
        {overallStatus && (
          <Alert variant={overallStatus === 'FAIL' ? 'destructive' : 'default'}>
            <AlertDescription className="flex items-center justify-between">
              <span className="font-medium">
                Overall Status: {getStatusBadge(overallStatus)}
              </span>
              <span className="text-sm">
                {results.filter(r => r.status === 'PASS').length}/{results.length} tests passed
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Test Results */}
        {results.length > 0 && (
          <ScrollArea className="h-[500px] rounded-md border">
            <div className="space-y-3 p-4">
              {results.map((result, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          {result.testName}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {new Date(result.timestamp).toLocaleString()}
                        </CardDescription>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm">{result.message}</p>
                    
                    {result.details && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View Details
                        </summary>
                        <pre className="mt-2 rounded bg-muted p-2 overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Empty State */}
        {!isRunning && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No verification results yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click "Run Verification" to start automated checks
            </p>
          </div>
        )}

        {/* Running State */}
        {isRunning && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="font-medium mb-2">Running Verification Tests...</h3>
            <p className="text-sm text-muted-foreground">
              This may take a few moments
            </p>
          </div>
        )}

        {/* Test Coverage Info */}
        <Alert>
          <AlertDescription className="text-xs">
            <strong>Automated Tests:</strong> Feature Flags, Database Functions, Pagination, 
            Background Jobs, Payment Methods, Audit Logs, Canary Tenants
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}