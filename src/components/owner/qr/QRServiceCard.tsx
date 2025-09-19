import React from 'react';
import { Eye, FileText, Printer, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface QRService {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  scope: 'GLOBAL' | 'PER_ROOM';
  requestCount: number;
  description: string;
  color: string;
}

interface QRServiceCardProps {
  service: QRService;
  onToggle: () => void;
  onEdit: () => void;
  onViewAll: () => void;
  onPrintExport: () => void;
}

export const QRServiceCard = ({ 
  service, 
  onToggle, 
  onEdit, 
  onViewAll, 
  onPrintExport 
}: QRServiceCardProps) => {
  return (
    <Card className={`transition-all hover:shadow-md ${service.active ? '' : 'opacity-60'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg text-2xl ${service.color}`}>
              {service.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{service.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{service.description}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                Edit Service
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewAll}>
                <Eye className="h-4 w-4 mr-2" />
                View All Codes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPrintExport}>
                <Printer className="h-4 w-4 mr-2" />
                Print/Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={service.active ? "default" : "secondary"}>
              {service.active ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline">
              {service.scope === 'GLOBAL' ? 'Global' : 'Per Room'}
            </Badge>
          </div>
          <Switch
            checked={service.active}
            onCheckedChange={onToggle}
          />
        </div>

        {service.requestCount > 0 && (
          <div className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Pending Requests</span>
            <Badge variant="destructive">{service.requestCount}</Badge>
          </div>
        )}

        <div className="flex items-center justify-center py-6 border-2 border-dashed border-muted rounded-lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted-foreground/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <div className="w-12 h-12 bg-foreground rounded-sm opacity-20"></div>
            </div>
            <p className="text-xs text-muted-foreground">QR Preview</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onViewAll} className="flex-1">
            <FileText className="h-4 w-4 mr-1" />
            View All
          </Button>
          <Button variant="outline" size="sm" onClick={onPrintExport} className="flex-1">
            <Printer className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};