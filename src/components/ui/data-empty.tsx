import { AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DataEmptyProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function DataEmpty({ 
  title, 
  description, 
  icon: Icon = AlertCircle,
  action 
}: DataEmptyProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
        {action && (
          <Button onClick={action.onClick} className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}