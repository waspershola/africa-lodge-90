import { FileX, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface DataEmptyProps {
  message?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<any>;
  className?: string;
}

export function DataEmpty({ 
  message = "No data found", 
  description,
  action,
  icon: Icon = FileX,
  className = "" 
}: DataEmptyProps) {
  return (
    <Card className={`modern-card ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{message}</h3>
        {description && (
          <p className="text-muted-foreground text-center mb-4 max-w-sm">
            {description}
          </p>
        )}
        {action && (
          <div className="mt-2">
            {action}
          </div>
        )}
      </CardContent>
    </Card>
  );
}