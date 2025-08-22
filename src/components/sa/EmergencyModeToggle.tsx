import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Power, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToggleEmergencyMode, usePolicies } from '@/hooks/useApi';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

export default function EmergencyModeToggle() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reason, setReason] = useState('');

  const { data: policiesData, isLoading, error, refetch } = usePolicies();
  const toggleEmergencyMode = useToggleEmergencyMode();

  if (isLoading) return <LoadingState message="Loading emergency settings..." />;
  if (error) return <ErrorState message="Failed to load emergency settings" onRetry={refetch} />;

  const emergencyMode = policiesData?.data?.emergencyMode;
  const isEmergencyActive = emergencyMode?.enabled;

  const handleToggle = async () => {
    if (isEmergencyActive) {
      // Deactivate immediately
      await toggleEmergencyMode.mutateAsync({ 
        type: 'global', 
        enabled: false 
      });
    } else {
      // Activate with reason
      if (!reason.trim()) return;
      await toggleEmergencyMode.mutateAsync({ 
        type: 'global',
        enabled: true
      });
      setReason('');
      setIsDialogOpen(false);
    }
  };

  return (
    <Card className={`modern-card transition-all duration-300 ${
      isEmergencyActive 
        ? 'border-danger bg-danger/5 shadow-lg shadow-danger/20' 
        : 'border-border'
    }`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className={`h-5 w-5 ${isEmergencyActive ? 'text-danger' : 'text-muted-foreground'}`} />
          Emergency Mode Control
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                isEmergencyActive ? 'bg-danger animate-pulse' : 'bg-muted'
              }`} />
              <span className="font-medium">
                {isEmergencyActive ? 'Emergency Mode Active' : 'Normal Operations'}
              </span>
            </div>
            <Badge variant={isEmergencyActive ? 'destructive' : 'secondary'}>
              {isEmergencyActive ? 'OFFLINE' : 'ONLINE'}
            </Badge>
          </div>

          <AnimatePresence>
            {isEmergencyActive && emergencyMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-danger/10 border border-danger/20"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-danger mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-danger mb-1">
                      All hotels are currently offline
                    </div>
                    {emergencyMode.reason && (
                      <div className="text-muted-foreground mb-2">
                        Reason: {emergencyMode.reason}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Activated: {new Date(emergencyMode.activatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            {isEmergencyActive ? (
              <Button
                onClick={handleToggle}
                disabled={toggleEmergencyMode.isPending}
                className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
              >
                <Power className="h-4 w-4 mr-2" />
                {toggleEmergencyMode.isPending ? 'Restoring...' : 'Restore Operations'}
              </Button>
            ) : (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="flex-1">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Activate Emergency Mode
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-danger">
                      <AlertTriangle className="h-5 w-5" />
                      Activate Emergency Mode
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-danger/10 border border-danger/20">
                      <p className="text-sm text-danger font-medium mb-1">
                        ⚠️ This will immediately take ALL hotels offline
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Use only for critical system maintenance or security issues
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Reason (Required)</label>
                      <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter reason for emergency mode activation..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleToggle}
                        disabled={!reason.trim() || toggleEmergencyMode.isPending}
                        variant="destructive"
                        className="flex-1"
                      >
                        {toggleEmergencyMode.isPending ? 'Activating...' : 'Confirm Activation'}
                      </Button>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}