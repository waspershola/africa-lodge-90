import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  Calendar, 
  BedDouble, 
  Users, 
  FileText,
  Eye,
  Edit,
  CheckCircle
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, Record<string, boolean>>;
  staffCount: number;
  isSystem: boolean;
  createdDate: string;
}

interface PermissionsMatrixProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  onPermissionsUpdate: (updatedRole: Role) => void;
}

const modules = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'View hotel overview and key metrics',
    icon: BarChart3
  },
  {
    id: 'reservations',
    name: 'Reservations',
    description: 'Manage bookings and guest check-ins',
    icon: Calendar
  },
  {
    id: 'rooms',
    name: 'Rooms & Rates',
    description: 'Room management and pricing control',
    icon: BedDouble
  },
  {
    id: 'staff',
    name: 'Staff Management',
    description: 'Manage staff and role assignments',
    icon: Users
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Access business reports and data',
    icon: FileText
  }
];

const permissions = [
  {
    id: 'view',
    name: 'View',
    description: 'Can view and read data',
    icon: Eye
  },
  {
    id: 'edit',
    name: 'Edit',
    description: 'Can modify and update data',
    icon: Edit
  },
  {
    id: 'approve',
    name: 'Approve',
    description: 'Can approve changes and transactions',
    icon: CheckCircle
  }
];

export default function PermissionsMatrix({ open, onOpenChange, role, onPermissionsUpdate }: PermissionsMatrixProps) {
  const [permissions_state, setPermissions] = useState(role.permissions);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePermissionChange = (moduleId: string, permissionId: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [permissionId]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedRole = {
        ...role,
        permissions: permissions_state
      };
      
      onPermissionsUpdate(updatedRole);
      
      toast({
        title: "Permissions updated",
        description: `Permissions for ${role.name} have been updated successfully.`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalGranted = () => {
    let granted = 0;
    Object.values(permissions_state).forEach(modulePerms => {
      Object.values(modulePerms).forEach(hasPermission => {
        if (hasPermission) granted++;
      });
    });
    return granted;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Permissions Matrix - {role.name}</span>
            <Badge variant={role.isSystem ? "secondary" : "outline"}>
              {role.isSystem ? "System Role" : "Custom Role"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Configure what this role can do in each module. {getTotalGranted()}/{modules.length * permissions.length} permissions granted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Permissions Header */}
          <div className="grid grid-cols-4 gap-4">
            <div className="font-medium">Module</div>
            {permissions.map((permission) => (
              <div key={permission.id} className="text-center">
                <div className="flex flex-col items-center space-y-1">
                  <permission.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{permission.name}</span>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Permissions Grid */}
          <div className="space-y-4">
            {modules.map((module) => (
              <div key={module.id} className="grid grid-cols-4 gap-4 items-center py-3 border border-border/50 rounded-lg px-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <module.icon className="h-4 w-4 text-primary" />
                    <span className="font-medium">{module.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
                
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex flex-col items-center space-y-2">
                    <Switch
                      checked={permissions_state[module.id]?.[permission.id] || false}
                      onCheckedChange={(value) => handlePermissionChange(module.id, permission.id, value)}
                      disabled={role.isSystem}
                    />
                    <Label className="text-xs text-muted-foreground text-center">
                      {permission.description}
                    </Label>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {role.isSystem && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                This is a system role with predefined permissions that cannot be modified.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || role.isSystem}
          >
            {isLoading ? "Saving..." : "Save Permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}