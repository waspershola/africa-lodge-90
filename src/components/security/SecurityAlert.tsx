import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface SecurityAlertProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
  className?: string;
}

const iconMap = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertTriangle,
  info: Info
};

const colorMap = {
  success: 'border-green-500 text-green-700 bg-green-50',
  warning: 'border-yellow-500 text-yellow-700 bg-yellow-50',
  error: 'border-red-500 text-red-700 bg-red-50',
  info: 'border-blue-500 text-blue-700 bg-blue-50'
};

export function SecurityAlert({ type, title, description, className }: SecurityAlertProps) {
  const Icon = iconMap[type];
  
  return (
    <Alert className={`${colorMap[type]} ${className}`}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        {title}
      </AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}