import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Mail, UserX } from 'lucide-react';

interface StaffInvitationStatusBadgeProps {
  status: 'active' | 'invited' | 'pending' | 'expired' | 'suspended';
  forceReset?: boolean;
  tempExpires?: string;
  className?: string;
}

export function StaffInvitationStatusBadge({ 
  status, 
  forceReset, 
  tempExpires, 
  className 
}: StaffInvitationStatusBadgeProps) {
  
  const isExpired = tempExpires && new Date(tempExpires) <= new Date();
  const isPending = forceReset && tempExpires && !isExpired;
  
  // Override status based on reset state
  let effectiveStatus = status;
  if (isPending) {
    effectiveStatus = 'pending';
  } else if (isExpired && forceReset) {
    effectiveStatus = 'expired';
  }

  const getStatusConfig = () => {
    switch (effectiveStatus) {
      case 'active':
        return {
          variant: 'default' as const,
          className: 'bg-success/10 text-success border-success/20',
          icon: CheckCircle,
          label: 'Active'
        };
      case 'pending':
        return {
          variant: 'outline' as const,
          className: 'bg-warning/10 text-warning border-warning/20',
          icon: Clock,
          label: 'Pending Setup'
        };
      case 'expired':
        return {
          variant: 'outline' as const,
          className: 'bg-danger/10 text-danger border-danger/20',
          icon: AlertCircle,
          label: 'Expired'
        };
      case 'invited':
        return {
          variant: 'outline' as const,
          className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
          icon: Mail,
          label: 'Invited'
        };
      case 'suspended':
        return {
          variant: 'outline' as const,
          className: 'bg-muted text-muted-foreground border-muted',
          icon: UserX,
          label: 'Suspended'
        };
      default:
        return {
          variant: 'outline' as const,
          className: 'bg-muted text-muted-foreground border-muted',
          icon: AlertCircle,
          label: 'Unknown'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className || ''}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}