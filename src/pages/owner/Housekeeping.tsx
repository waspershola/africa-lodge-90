import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarClock,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  TrendingUp
} from 'lucide-react';
import HousekeepingTaskBoard from '@/components/owner/housekeeping/HousekeepingTaskBoard';
import OOSRoomManager from '@/components/owner/housekeeping/OOSRoomManager';
import HousekeepingStats from '@/components/owner/housekeeping/HousekeepingStats';
import StaffAssignments from '@/components/owner/housekeeping/StaffAssignments';
import { useHousekeepingStats, useHousekeepingTasks } from '@/hooks/useApi';

export default function HousekeepingPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data: stats } = useHousekeepingStats();
  const { data: tasks } = useHousekeepingTasks();

  const housekeepingStats = stats || {
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedToday: 0,
    oosRooms: 0,
    averageCompletionTime: 0,
    delayedTasks: 0,
    activeStaff: 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-gradient">
            Housekeeping & Maintenance
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage cleaning tasks, maintenance requests, and out-of-service rooms
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning-foreground" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{housekeepingStats.pendingTasks}</div>
                <div className="text-sm text-muted-foreground">Pending Tasks</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">
                {housekeepingStats.delayedTasks} delayed
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CalendarClock className="h-6 w-6 text-primary" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{housekeepingStats.inProgressTasks}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-success flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>On track</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{housekeepingStats.completedToday}</div>
                <div className="text-sm text-muted-foreground">Completed Today</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">
                {housekeepingStats.averageCompletionTime}min avg
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{housekeepingStats.oosRooms}</div>
                <div className="text-sm text-muted-foreground">OOS Rooms</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">
                {housekeepingStats.activeStaff} staff active
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="tasks">Task Board</TabsTrigger>
          <TabsTrigger value="oos">OOS Rooms</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <HousekeepingStats />
        </TabsContent>

        <TabsContent value="tasks">
          <HousekeepingTaskBoard />
        </TabsContent>

        <TabsContent value="oos">
          <OOSRoomManager />
        </TabsContent>

        <TabsContent value="staff">
          <StaffAssignments />
        </TabsContent>
      </Tabs>
    </div>
  );
}