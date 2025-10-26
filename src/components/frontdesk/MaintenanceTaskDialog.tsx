// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wrench, Clock, User, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Room } from "./RoomGrid";

interface MaintenanceTaskDialogProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'create-workorder' | 'set-oos' | 'mark-available';
  onComplete: (updatedRoom: Room) => void;
}

const MAINTENANCE_TYPES = [
  'Plumbing', 'Electrical', 'HVAC', 'Cleaning', 'Furniture Repair', 
  'Appliance Repair', 'Painting', 'Carpet/Flooring', 'Other'
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
];

export const MaintenanceTaskDialog = ({
  room,
  open,
  onOpenChange,
  action,
  onComplete,
}: MaintenanceTaskDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    taskType: '',
    priority: 'medium',
    description: '',
    estimatedHours: '2',
    assignedTo: '',
    expectedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reason: '', // For OOS
  });

  if (!room) return null;

  const getDialogTitle = () => {
    switch (action) {
      case 'create-workorder': return 'Create Work Order';
      case 'set-oos': return 'Set Out of Service';
      case 'mark-available': return 'Mark Room Available';
      default: return 'Maintenance Task';
    }
  };

  const getDialogDescription = () => {
    switch (action) {
      case 'create-workorder': 
        return `Create maintenance work order for Room ${room.number}`;
      case 'set-oos': 
        return `Set Room ${room.number} as out of service`;
      case 'mark-available': 
        return `Mark Room ${room.number} as available for booking`;
      default: 
        return `Manage maintenance for Room ${room.number}`;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (action === 'create-workorder' || action === 'set-oos') {
      if (!formData.taskType.trim() && action === 'create-workorder') {
        toast({
          title: "Validation Error",
          description: "Task type is required",
          variant: "destructive",
        });
        return;
      }

      if (!formData.description.trim()) {
        toast({
          title: "Validation Error",
          description: action === 'set-oos' ? "Reason is required" : "Description is required",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);

    try {
      // REAL DB OPERATION: Create maintenance task or update room status
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) {
        throw new Error('Tenant ID not found');
      }

      let newStatus = room.status;

      // Create work order/maintenance task if needed
      if (action === 'create-workorder' || action === 'set-oos') {
        const taskData = {
          tenant_id: tenantId,
          room_id: room.id,
          task_type: formData.taskType || 'maintenance',
          title: formData.taskType || 'Maintenance Task',
          description: formData.description || (action === 'set-oos' ? formData.reason : ''),
          priority: formData.priority,
          assigned_to: formData.assignedTo || null,
          status: 'pending',
          created_by: user.id,
        };

        const { error: taskError } = await supabase
          .from('housekeeping_tasks')
          .insert([taskData]);

        if (taskError) throw taskError;

        // Set room status based on action
        if (action === 'set-oos') {
          newStatus = 'oos';
        }
      } else if (action === 'mark-available') {
        newStatus = 'available';
      }

      // Update room status if it changed
      if (newStatus !== room.status) {
        const { error: roomError } = await supabase
          .from('rooms')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', room.id)
          .eq('tenant_id', tenantId);

        if (roomError) throw roomError;
      }
      
      const updatedRoom = {
        ...room,
        status: newStatus as Room['status'],
        alerts: {
          ...room.alerts,
          maintenance: action === 'create-workorder' || action === 'set-oos'
        }
      };

      onComplete(updatedRoom);

      toast({
        title: "Task Completed",
        description: `${getDialogTitle()} for Room ${room.number} has been processed successfully.`,
      });

      // Reset form
      setFormData({
        taskType: '',
        priority: 'medium',
        description: '',
        estimatedHours: '2',
        assignedTo: '',
        expectedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: '',
      });

      onOpenChange(false);
      
      // Navigate back to front desk
      setTimeout(() => {
        navigate('/front-desk');
      }, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process maintenance task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Room Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Room Number:</span>
                <span className="font-medium">{room.number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Room Type:</span>
                <span className="font-medium">{room.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Current Status:</span>
                <span className="font-medium capitalize">{room.status}</span>
              </div>
            </CardContent>
          </Card>

          {/* Task Details */}
          {(action === 'create-workorder' || action === 'set-oos') && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  {action === 'set-oos' ? 'Out of Service Details' : 'Task Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {action === 'create-workorder' && (
                  <>
                    <div>
                      <Label htmlFor="taskType">Task Type *</Label>
                      <Select 
                        value={formData.taskType} 
                        onValueChange={(value) => handleInputChange('taskType', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select maintenance type" />
                        </SelectTrigger>
                        <SelectContent>
                          {MAINTENANCE_TYPES.map((type) => (
                            <SelectItem key={type} value={type.toLowerCase()}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select 
                        value={formData.priority} 
                        onValueChange={(value) => handleInputChange('priority', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <span className={level.color}>{level.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="assignedTo">Assign To</Label>
                      <Input
                        id="assignedTo"
                        value={formData.assignedTo}
                        onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                        placeholder="Technician name or team"
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="estimatedHours">Est. Hours</Label>
                        <Input
                          id="estimatedHours"
                          type="number"
                          value={formData.estimatedHours}
                          onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
                          min="0.5"
                          step="0.5"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="expectedCompletion">Target Date</Label>
                        <Input
                          id="expectedCompletion"
                          type="date"
                          value={formData.expectedCompletion}
                          onChange={(e) => handleInputChange('expectedCompletion', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="description">
                    {action === 'set-oos' ? 'Reason *' : 'Description *'}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={action === 'set-oos' ? "Why is this room going out of service?" : "Describe the maintenance work needed..."}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mark Available Confirmation */}
          {action === 'mark-available' && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Confirm Room Ready</p>
                    <p className="text-sm text-muted-foreground">
                      This will mark Room {room.number} as available for new bookings. 
                      Ensure all maintenance work has been completed and the room is guest-ready.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : getDialogTitle()}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};