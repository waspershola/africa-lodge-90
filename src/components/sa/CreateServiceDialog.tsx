import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { GlobalService, ServiceStatus } from '@/types/services';
import { toast } from 'sonner';

interface CreateServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateService: (serviceData: Omit<GlobalService, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => Promise<GlobalService>;
}

interface FormData {
  name: string;
  code: string;
  description: string;
  icon: string;
  category: 'core' | 'hospitality' | 'dining' | 'maintenance' | 'guest-experience' | 'analytics';
  status: ServiceStatus;
  multilingual_support: boolean;
}

const categoryOptions = [
  { value: 'core', label: 'Core' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'dining', label: 'Dining' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'guest-experience', label: 'Guest Experience' },
  { value: 'analytics', label: 'Analytics' }
];

const iconSuggestions = [
  'UtensilsCrossed', 'Sparkles', 'Wrench', 'Wifi', 'MenuSquare', 
  'Calendar', 'MessageSquare', 'Bot', 'Car', 'Dumbbell', 
  'Swimming', 'Coffee', 'Phone', 'Shield'
];

export const CreateServiceDialog: React.FC<CreateServiceDialogProps> = ({
  isOpen,
  onClose,
  onCreateService
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffRoles, setStaffRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState('');
  const [apiEndpoints, setApiEndpoints] = useState<string[]>([]);
  const [newEndpoint, setNewEndpoint] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<FormData>({
    defaultValues: {
      status: 'active',
      multilingual_support: true
    }
  });

  const handleClose = () => {
    reset();
    setStaffRoles([]);
    setApiEndpoints([]);
    setNewRole('');
    setNewEndpoint('');
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      const serviceData = {
        ...data,
        requires_staff_role: staffRoles.length > 0 ? staffRoles : undefined,
        api_endpoints: apiEndpoints.length > 0 ? apiEndpoints : undefined
      };

      await onCreateService(serviceData);
      toast.success('Service created successfully');
      handleClose();
    } catch (error) {
      toast.error('Failed to create service');
      console.error('Error creating service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateServiceCode = (name: string) => {
    const code = `SERVICE_${name.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_')}`;
    setValue('code', code);
  };

  const addStaffRole = () => {
    if (newRole.trim() && !staffRoles.includes(newRole.trim())) {
      setStaffRoles([...staffRoles, newRole.trim()]);
      setNewRole('');
    }
  };

  const removeStaffRole = (role: string) => {
    setStaffRoles(staffRoles.filter(r => r !== role));
  };

  const addApiEndpoint = () => {
    if (newEndpoint.trim() && !apiEndpoints.includes(newEndpoint.trim())) {
      setApiEndpoints([...apiEndpoints, newEndpoint.trim()]);
      setNewEndpoint('');
    }
  };

  const removeApiEndpoint = (endpoint: string) => {
    setApiEndpoints(apiEndpoints.filter(e => e !== endpoint));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Service</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Service name is required' })}
                placeholder="e.g., Room Service"
                onChange={(e) => {
                  register('name').onChange(e);
                  generateServiceCode(e.target.value);
                }}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Service Code *</Label>
              <Input
                id="code"
                {...register('code', { required: 'Service code is required' })}
                placeholder="SERVICE_RS"
              />
              {errors.code && (
                <p className="text-sm text-red-600">{errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description', { required: 'Description is required' })}
              placeholder="Brief description of the service"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon Name</Label>
              <Select onValueChange={(value) => setValue('icon', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {iconSuggestions.map((icon) => (
                    <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                {...register('icon')}
                placeholder="Or enter custom icon name"
                className="mt-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select onValueChange={(value) => setValue('category', value as 'core' | 'hospitality' | 'dining' | 'maintenance' | 'guest-experience' | 'analytics')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-600">Category is required</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select onValueChange={(value) => setValue('status', value as ServiceStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="coming-soon">Coming Soon</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Multilingual Support</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={watch('multilingual_support')}
                  onCheckedChange={(checked) => setValue('multilingual_support', checked)}
                />
                <span className="text-sm text-muted-foreground">
                  Enable multilingual support
                </span>
              </div>
            </div>
          </div>

          {/* Staff Roles */}
          <div className="space-y-2">
            <Label>Required Staff Roles</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., restaurant, housekeeping"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addStaffRole();
                    }
                  }}
                />
                <Button type="button" onClick={addStaffRole}>
                  Add
                </Button>
              </div>
              {staffRoles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {staffRoles.map((role) => (
                    <Badge key={role} variant="secondary" className="flex items-center gap-1">
                      {role}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 hover:bg-transparent"
                        onClick={() => removeStaffRole(role)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* API Endpoints */}
          <div className="space-y-2">
            <Label>API Endpoints (Optional)</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., /api/service/endpoint"
                  value={newEndpoint}
                  onChange={(e) => setNewEndpoint(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addApiEndpoint();
                    }
                  }}
                />
                <Button type="button" onClick={addApiEndpoint}>
                  Add
                </Button>
              </div>
              {apiEndpoints.length > 0 && (
                <div className="space-y-1">
                  {apiEndpoints.map((endpoint) => (
                    <div key={endpoint} className="flex items-center justify-between bg-muted p-2 rounded">
                      <code className="text-sm">{endpoint}</code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeApiEndpoint(endpoint)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Service'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};