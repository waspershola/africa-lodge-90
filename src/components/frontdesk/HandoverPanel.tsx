import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  AlertCircle, 
  CheckCircle,
  MessageSquare,
  User,
  Calendar,
  ArrowRight,
  ExternalLink,
  FileText,
  Monitor,
  AlertTriangle
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useShiftSessions, useActiveShiftSessions } from "@/hooks/useShiftSessions";
import { useQRRealtime } from "@/hooks/useQRRealtime";
import { useStaffData } from "@/hooks/useStaffData";
import { useShiftPDFReport } from "@/hooks/useShiftPDFReport";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/MultiTenantAuthProvider";

export const HandoverPanel = () => {
  const { tenant } = useAuth();
  const { data: activeShifts, isLoading: shiftsLoading } = useActiveShiftSessions();
  const { data: allShifts } = useShiftSessions();
  const { orders } = useQRRealtime();
  const { generateDailyShiftsReport } = useShiftPDFReport();
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  // Fetch staff names for all shifts
  const { data: staffMap } = useQuery({
    queryKey: ['staff-names', tenant?.tenant_id],
    queryFn: async () => {
      const allStaffIds = [
        ...(activeShifts?.map(s => s.staff_id) || []),
        ...(allShifts?.map(s => s.staff_id) || [])
      ];
      const uniqueStaffIds = [...new Set(allStaffIds)];
      
      if (uniqueStaffIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .in('id', uniqueStaffIds);
      
      if (error) throw error;
      
      return data.reduce((acc, user) => {
        acc[user.id] = user.name;
        return acc;
      }, {} as Record<string, string>);
    },
    enabled: !!tenant?.tenant_id && ((activeShifts?.length || 0) > 0 || (allShifts?.length || 0) > 0),
  });

  // Get current shift information with staff names
  const currentShifts = (activeShifts || []).map(shift => ({
    ...shift,
    staff_name: staffMap?.[shift.staff_id] || 'Unknown Staff'
  }));

  // Get pending QR orders that need attention
  const pendingOrders = orders?.filter(order => 
    order.status === 'pending' || order.status === 'assigned'
  ).slice(0, 5) || [];

  // Get recent handover notes from completed shifts with staff names
  const recentHandovers = (allShifts?.filter(shift => 
    shift.status === 'completed' && shift.handover_notes
  ).slice(0, 3) || []).map(shift => ({
    ...shift,
    staff_name: staffMap?.[shift.staff_id] || 'Unknown Staff'
  }));

  // Get urgent housekeeping tasks (placeholder)
  const urgentTasks: any[] = [];

  // Get unresolved items from all active shifts
  const allUnresolvedItems = currentShifts.reduce((items, shift) => {
    return items.concat(shift.unresolved_items || []);
  }, [] as string[]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Shift Handover</h2>
          <p className="text-muted-foreground">
            Current shift status and handover information
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.open('/shift-terminal', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Shift Terminal
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const completedShifts = allShifts?.filter(s => s.status === 'completed').slice(0, 10) || [];
              const summaryData = completedShifts.map(shift => ({
                shift_id: shift.id,
                staff_name: staffMap?.[shift.staff_id] || 'Unknown Staff',
                role: shift.role || 'Staff',
                start_time: shift.start_time,
                end_time: shift.end_time || new Date().toISOString(),
                duration_hours: shift.end_time ? 
                  (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / (1000 * 60 * 60) : 0,
                cash_total: shift.cash_total || 0,
                pos_total: shift.pos_total || 0,
                total_collected: (shift.cash_total || 0) + (shift.pos_total || 0),
                handover_notes: shift.handover_notes,
                unresolved_items: shift.unresolved_items || [],
                device_slug: shift.device_id,
              }));
              generateDailyShiftsReport.mutate(summaryData);
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Daily Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="handovers">Recent Handovers</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Active Shifts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Active Shifts
                  {currentShifts.length > 0 && (
                    <Badge variant="secondary">{currentShifts.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shiftsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading shift data...</div>
                ) : currentShifts.length > 0 ? (
                  <div className="space-y-3">
                     {currentShifts.map((shift) => (
                      <div key={shift.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{shift.staff_name}</div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{shift.role}</Badge>
                            {shift.device_id && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Monitor className="h-3 w-3" />
                                {shift.device_id}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Started {formatDistanceToNow(new Date(shift.start_time), { addSuffix: true })}
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Active
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No active shifts</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending QR Requests */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Pending QR Requests
                  {pendingOrders.length > 0 && (
                    <Badge variant="destructive">{pendingOrders.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingOrders.length > 0 ? (
                  <div className="space-y-3">
                    {pendingOrders.map((order) => (
                      <div key={order.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium capitalize">
                            {order.service_type.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Room {order.room_id} • Priority {order.priority}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                          </div>
                        </div>
                        <Badge 
                          variant={order.status === 'pending' ? 'destructive' : 'secondary'}
                        >
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No pending requests</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Urgent Housekeeping Tasks */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Urgent Tasks
                  {urgentTasks.length > 0 && (
                    <Badge variant="destructive">{urgentTasks.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {urgentTasks.length > 0 ? (
                  <div className="space-y-3">
                    {urgentTasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {task.room_id && `Room ${task.room_id} • `}
                            {task.task_type}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {task.assigned_at 
                              ? `Assigned ${formatDistanceToNow(new Date(task.assigned_at), { addSuffix: true })}`
                              : 'Not assigned'
                            }
                          </div>
                        </div>
                        <Badge variant="destructive">
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No urgent tasks</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Unresolved Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Unresolved Items
                  {allUnresolvedItems.length > 0 && (
                    <Badge variant="destructive">{allUnresolvedItems.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allUnresolvedItems.length > 0 ? (
                  <div className="space-y-2">
                    {allUnresolvedItems.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-destructive/5 rounded">
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                    {allUnresolvedItems.length > 5 && (
                      <div className="text-xs text-muted-foreground">
                        ... and {allUnresolvedItems.length - 5} more items
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50 text-green-500" />
                    <p>All items resolved</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="handovers" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Recent Shift Handovers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentHandovers.length > 0 ? (
                <div className="space-y-4">
                  {recentHandovers.map((shift) => (
                    <Card key={shift.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{shift.staff_name}</span>
                              <Badge variant="outline" className="ml-2">{shift.role}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {shift.end_time && format(new Date(shift.end_time), 'MMM d, HH:mm')}
                            </div>
                          </div>

                          {shift.handover_notes && (
                            <div className="bg-muted p-3 rounded-lg">
                              <div className="text-sm font-medium mb-1">Handover Notes:</div>
                              <div className="text-sm">{shift.handover_notes}</div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Cash Total:</span>
                              <span className="ml-2 font-medium">${shift.cash_total?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">POS Total:</span>
                              <span className="ml-2 font-medium">${shift.pos_total?.toFixed(2) || '0.00'}</span>
                            </div>
                          </div>

                          {shift.unresolved_items?.length > 0 && (
                            <div className="border-l-4 border-l-destructive pl-3">
                              <div className="text-sm font-medium text-destructive mb-1">
                                Unresolved Items ({shift.unresolved_items.length}):
                              </div>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {shift.unresolved_items.slice(0, 3).map((item, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <span className="text-destructive">•</span>
                                    {item}
                                  </li>
                                ))}
                                {shift.unresolved_items.length > 3 && (
                                  <li className="text-xs">... and {shift.unresolved_items.length - 3} more</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent handovers found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shift Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/shift-terminal" target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Shift Terminal
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    const completedShifts = allShifts?.filter(s => s.status === 'completed').slice(0, 10) || [];
                    const summaryData = completedShifts.map(shift => ({
                      shift_id: shift.id,
                      staff_name: shift.staff_id,
                      role: shift.role || 'Staff',
                      start_time: shift.start_time,
                      end_time: shift.end_time || new Date().toISOString(),
                      duration_hours: shift.end_time ? 
                        (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / (1000 * 60 * 60) : 0,
                      cash_total: shift.cash_total || 0,
                      pos_total: shift.pos_total || 0,
                      total_collected: (shift.cash_total || 0) + (shift.pos_total || 0),
                      handover_notes: shift.handover_notes,
                      unresolved_items: shift.unresolved_items || [],
                      device_slug: shift.device_id,
                    }));
                    generateDailyShiftsReport.mutate(summaryData);
                  }}
                  disabled={generateDailyShiftsReport.isPending}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Daily Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Shift Schedule
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Communication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Staff Message
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Staff Directory
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
