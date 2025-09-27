import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, Monitor, User, DollarSign, FileText, WifiOff, Wifi, RefreshCw, Shield } from "lucide-react";
import { useStartShift, useEndShift, useActiveShiftSessions, useDevices } from "@/hooks/useShiftSessions";
import { useShiftPDFReport } from "@/hooks/useShiftPDFReport";
import { useShiftNotifications } from "@/hooks/useShiftNotifications";
import { useOfflineShiftSupport } from "@/hooks/useOfflineShiftSupport";
import { ShiftSecurityValidator } from "@/components/shift/ShiftSecurityValidator";
import { useAuth } from "@/components/auth/MultiTenantAuthProvider";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function ShiftTerminal() {
  const [searchParams] = useSearchParams();
  const deviceParam = searchParams.get('device');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedDevice, setSelectedDevice] = useState(deviceParam || "");
  const [cashTotal, setCashTotal] = useState(0);
  const [posTotal, setPosTotal] = useState(0);
  const [handoverNotes, setHandoverNotes] = useState("");
  const [endShiftModalOpen, setEndShiftModalOpen] = useState(false);
  const [selectedShiftToEnd, setSelectedShiftToEnd] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const { data: activeShifts, isLoading: shiftsLoading } = useActiveShiftSessions();
  const { data: devices } = useDevices();
  const startShiftMutation = useStartShift();
  const endShiftMutation = useEndShift();
  const { generateShiftReport } = useShiftPDFReport();
  const { notifyShiftStart, notifyShiftEnd } = useShiftNotifications();
  const { 
    isOnline, 
    pendingActions, 
    hasPendingActions, 
    queueOfflineAction, 
    forcSync 
  } = useOfflineShiftSupport();

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    await startShiftMutation.mutateAsync({
      email,
      password,
      deviceSlug: selectedDevice,
      authorizedBy: user?.id,
    });
    
    // Clear form
    setEmail("");
    setPassword("");
  };

  const handleEndShift = async () => {
    if (!selectedShiftToEnd) return;
    
    const result = await endShiftMutation.mutateAsync({
      shiftSessionId: selectedShiftToEnd,
      cashTotal,
      posTotal,
      handoverNotes,
    });
    
    // Generate PDF report after successful shift end
    if (result?.shift_summary) {
      await generateShiftReport.mutateAsync({
        shift_id: result.shift_summary.shift_id,
        staff_name: result.shift_summary.staff_name || 'Unknown',
        role: result.shift_summary.role,
        start_time: result.shift_summary.start_time,
        end_time: result.shift_summary.end_time,
        duration_hours: result.shift_summary.duration_hours,
        cash_total: result.shift_summary.cash_total,
        pos_total: result.shift_summary.pos_total,
        total_collected: result.shift_summary.total_collected,
        handover_notes: result.shift_summary.handover_notes,
        unresolved_items: result.shift_summary.unresolved_items || []
      });
    }
    
    // Clear form and close modal
    setCashTotal(0);
    setPosTotal(0);
    setHandoverNotes("");
    setEndShiftModalOpen(false);
    setSelectedShiftToEnd(null);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Shift Terminal</h1>
              <p className="text-muted-foreground">
                Start and end staff shifts from this shared terminal
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              {isOnline ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-600">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">Offline</span>
                </div>
              )}
              
              {/* Sync Status */}
              {hasPendingActions && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={forcSync}
                  disabled={!isOnline}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync ({pendingActions.length})
                </Button>
              )}
              
              {selectedDevice && (
                <Badge variant="outline" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Device: {selectedDevice}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Offline Warning */}
        {!isOnline && (
          <Alert className="mb-6">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              You're currently offline. Shift actions will be queued and synced when connection is restored.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="start" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="start">Start Shift</TabsTrigger>
            <TabsTrigger value="active">Active Shifts</TabsTrigger>
            <TabsTrigger value="security">Security Check</TabsTrigger>
          </TabsList>

          {/* Start Shift Tab */}
          <TabsContent value="start" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Start New Shift</CardTitle>
                <CardDescription>
                  Enter your credentials to begin your shift
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStartShift} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="device">Device (Optional)</Label>
                    <Input
                      id="device"
                      value={selectedDevice}
                      onChange={(e) => setSelectedDevice(e.target.value)}
                      placeholder="e.g., FD-01"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={startShiftMutation.isPending}
                  >
                    {startShiftMutation.isPending ? "Starting Shift..." : "Start Shift"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Shifts Tab */}
          <TabsContent value="active" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Shifts</CardTitle>
                <CardDescription>
                  Currently active shift sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {shiftsLoading ? (
                  <div className="text-center py-8">Loading active shifts...</div>
                ) : activeShifts && activeShifts.length > 0 ? (
                  <div className="space-y-4">
                    {activeShifts.map((shift) => (
                      <div key={shift.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">Staff ID: {shift.staff_id}</span>
                              <Badge variant="secondary">{shift.role}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Started {formatDistanceToNow(new Date(shift.start_time))} ago
                              </div>
                              {shift.device_id && (
                                <div className="flex items-center gap-1">
                                  <Monitor className="h-3 w-3" />
                                  Device ID: {shift.device_id}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Dialog open={endShiftModalOpen && selectedShiftToEnd === shift.id} 
                                   onOpenChange={(open) => {
                                     setEndShiftModalOpen(open);
                                     if (!open) setSelectedShiftToEnd(null);
                                   }}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedShiftToEnd(shift.id)}
                                >
                                  End Shift
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>End Shift</DialogTitle>
                                  <DialogDescription>
                                    Complete your shift by entering final totals and notes
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="cashTotal">Cash Total</Label>
                                      <div className="relative">
                                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                          id="cashTotal"
                                          type="number"
                                          step="0.01"
                                          value={cashTotal}
                                          onChange={(e) => setCashTotal(parseFloat(e.target.value) || 0)}
                                          className="pl-10"
                                          placeholder="0.00"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="posTotal">POS Total</Label>
                                      <div className="relative">
                                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                          id="posTotal"
                                          type="number"
                                          step="0.01"
                                          value={posTotal}
                                          onChange={(e) => setPosTotal(parseFloat(e.target.value) || 0)}
                                          className="pl-10"
                                          placeholder="0.00"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="handoverNotes">Handover Notes</Label>
                                    <div className="relative">
                                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                      <Textarea
                                        id="handoverNotes"
                                        value={handoverNotes}
                                        onChange={(e) => setHandoverNotes(e.target.value)}
                                        className="pl-10"
                                        placeholder="Enter any notes for the next shift..."
                                        rows={3}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setEndShiftModalOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={handleEndShift}
                                    disabled={endShiftMutation.isPending}
                                  >
                                    {endShiftMutation.isPending ? "Ending..." : "End Shift"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No active shifts found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Check Tab */}
          <TabsContent value="security" className="space-y-6">
            <ShiftSecurityValidator />
            
            {/* Integration Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Implementation Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">
                    View detailed integration status and system validation
                  </p>
                  <Button variant="outline" asChild>
                    <a href="/shift-integration-status" target="_blank">
                      View Integration Dashboard
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}