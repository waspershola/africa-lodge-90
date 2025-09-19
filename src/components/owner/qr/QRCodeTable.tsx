import React from 'react';
import { Eye, Edit, FileDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { QRCodeData } from '@/pages/owner/QRManager';

interface QRCodeTableProps {
  qrCodes: QRCodeData[];
  onView: (qr: QRCodeData) => void;
  onEdit: (qr: QRCodeData) => void;
}

export const QRCodeTable = ({ qrCodes, onView, onEdit }: QRCodeTableProps) => {
  const handleExport = (qr: QRCodeData) => {
    // Export individual QR code
    console.log('Exporting QR:', qr.id);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>QR ID</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Services Enabled</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pending Requests</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qrCodes.map((qr) => (
              <TableRow key={qr.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{qr.id}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {qr.scope}
                  </Badge>
                </TableCell>
                <TableCell>{qr.assignedTo}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {qr.servicesEnabled.slice(0, 3).map((service) => (
                      <Badge key={service} variant="secondary" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                    {qr.servicesEnabled.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{qr.servicesEnabled.length - 3} more
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={qr.status === 'Active' ? 'default' : 'secondary'}>
                    {qr.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {qr.pendingRequests > 0 ? (
                    <Badge variant="destructive">{qr.pendingRequests}</Badge>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(qr)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(qr)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Services
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(qr)}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export QR
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};