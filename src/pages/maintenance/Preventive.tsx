import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { useMaintenanceApi } from '@/hooks/useMaintenance';

export default function PreventiveSchedulePage() {
  const { preventiveTasks, completePreventiveTask, isLoading } = useMaintenanceApi();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'overdue': return 'destructive';
      case 'scheduled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'overdue': return AlertTriangle;
      default: return Clock;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Preventive Maintenance Schedule</h1>
          <p className="text-muted-foreground mt-1">
            Manage scheduled maintenance tasks and prevent equipment failures
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Task
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{preventiveTasks.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {preventiveTasks.filter(t => t.status === 'overdue').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due This Week</p>
                <p className="text-2xl font-bold text-amber-600">
                  {preventiveTasks.filter(t => {
                    const nextDue = new Date(t.nextDue);
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    return nextDue <= nextWeek && t.status !== 'completed';
                  }).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {preventiveTasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {preventiveTasks.map(task => {
                const StatusIcon = getStatusIcon(task.status);
                return (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusIcon className="h-4 w-4" />
                        <Badge variant={getStatusColor(task.status) as any}>
                          {task.status}
                        </Badge>
                        <Badge variant="outline">
                          {task.frequency}
                        </Badge>
                        <Badge variant="outline" className={
                          task.priority === 'high' ? 'border-red-200 text-red-700' :
                          task.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                          'border-green-200 text-green-700'
                        }>
                          {task.priority}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <p className="text-muted-foreground mb-2">{task.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>📍 {task.location}</span>
                        <span>⏱️ {task.estimatedTime} min</span>
                        <span>📅 Due: {new Date(task.nextDue).toLocaleDateString()}</span>
                        {task.lastCompleted && (
                          <span>✅ Last: {new Date(task.lastCompleted).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {task.status !== 'completed' && (
                        <Button 
                          size="sm"
                          onClick={() => completePreventiveTask(task.id)}
                          disabled={isLoading}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Edit Schedule
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}