/**
 * Shift Handover Panel Component
 * 
 * Provides comprehensive shift transition functionality with handover notes,
 * task transfer, and seamless staff communication.
 */

import React, { useState } from 'react';
import { useShiftHandover } from '@/hooks/useShiftHandover';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare,
  Calendar,
  ArrowRight,
  ClipboardList,
  MapPin
} from 'lucide-react';

export function ShiftHandoverPanel() {
  const { toast } = useToast();
  const {
    currentShift,
    upcomingShifts,
    handoverData,
    startShift,
    completeHandover,
    updateHandoverNotes,
    collectHandoverData,
    isStartingShift,
    isCompletingHandover
  } = useShiftHandover();

  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [selectedNextStaff, setSelectedNextStaff] = useState('');
  const [handoverNotes, setHandoverNotes] = useState(handoverData.general_notes);

  const handleStartShift = (shiftId: string) => {
    startShift(shiftId);
  };

  const handleCompleteHandover = () => {
    if (!currentShift || !selectedNextStaff) {
      toast({
        title: "Error",
        description: "Please select the next staff member",
        variant: "destructive"
      });
      return;
    }

    completeHandover({
      shiftId: currentShift.id,
      handoverTo: selectedNextStaff,
      notes: handoverNotes
    });

    setShowHandoverDialog(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getShiftTypeLabel = (type: string) => {
    const labels = {
      morning: 'Morning Shift',
      afternoon: 'Afternoon Shift', 
      night: 'Night Shift',
      full_day: 'Full Day Shift'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (!currentShift && (!upcomingShifts || upcomingShifts.length === 0)) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No shifts scheduled</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Shift Status */}
      {currentShift ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Shift
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{getShiftTypeLabel(currentShift.shift_type)}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(currentShift.start_time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })} - {new Date(currentShift.end_time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {handoverData.pending_tasks.length}
                </p>
                <p className="text-sm text-muted-foreground">Pending Tasks</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {handoverData.guest_requests.length}
                </p>
                <p className="text-sm text-muted-foreground">Guest Requests</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {handoverData.maintenance_alerts.length}
                </p>
                <p className="text-sm text-muted-foreground">Maintenance Alerts</p>
              </div>
            </div>

            <Button 
              onClick={() => setShowHandoverDialog(true)}
              className="w-full"
              disabled={isCompletingHandover}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Complete Shift Handover
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Upcoming Shifts */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Shifts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingShifts?.slice(0, 3).map((shift) => (
              <div key={shift.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{getShiftTypeLabel(shift.shift_type)}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(shift.start_time).toLocaleDateString()} at{' '}
                    {new Date(shift.start_time).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {shift.status}
                  </Badge>
                  {shift.status === 'scheduled' && (
                    <Button 
                      size="sm"
                      onClick={() => handleStartShift(shift.id)}
                      disabled={isStartingShift}
                    >
                      Start Shift
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Handover Dialog */}
      <Dialog open={showHandoverDialog} onOpenChange={setShowHandoverDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Shift Handover</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Shift Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">
                        {currentShift && (
                          `${Math.round(
                            (new Date().getTime() - new Date(currentShift.start_time).getTime()) / 
                            (1000 * 60 * 60)
                          )} hours`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tasks Completed:</span>
                      <span className="font-medium text-green-600">
                        {handoverData.pending_tasks.filter(t => t.status === 'in_progress').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Requests Handled:</span>
                      <span className="font-medium text-blue-600">
                        {handoverData.guest_requests.length}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Next Staff Member</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedNextStaff} onValueChange={setSelectedNextStaff}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select next staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {upcomingShifts?.map((shift) => (
                          <SelectItem key={shift.user_id} value={shift.user_id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Staff Member - {shift.user_id.substring(0, 8)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Pending Tasks ({handoverData.pending_tasks.length})
                </h3>
                {handoverData.pending_tasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No pending tasks</p>
                ) : (
                  handoverData.pending_tasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{task.description}</p>
                            {task.room_id && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Room {task.room_id}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <Badge variant="outline">
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Active Guest Requests ({handoverData.guest_requests.length})
                </h3>
                {handoverData.guest_requests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No active requests</p>
                ) : (
                  handoverData.guest_requests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium capitalize">
                              {request.service_type.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Room {request.room_number}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(
                              request.priority > 2 ? 'high' : 
                              request.priority > 1 ? 'medium' : 'low'
                            )}>
                              Priority {request.priority}
                            </Badge>
                            <Badge variant="outline">
                              {request.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Handover Notes
                </label>
                <Textarea
                  value={handoverNotes}
                  onChange={(e) => {
                    setHandoverNotes(e.target.value);
                    updateHandoverNotes(e.target.value);
                  }}
                  placeholder="Add important notes for the next shift..."
                  rows={8}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Include any important information, special instructions, or ongoing issues.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowHandoverDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCompleteHandover}
              disabled={!selectedNextStaff || isCompletingHandover}
            >
              {isCompletingHandover ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Handover
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}