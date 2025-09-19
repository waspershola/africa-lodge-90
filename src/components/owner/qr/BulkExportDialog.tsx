import React, { useState } from 'react';
import { Download, FileImage, Printer, CheckSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import type { QRCodeData } from '@/pages/owner/QRManager';

interface BulkExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodes: QRCodeData[];
  onExport: (selectedIds: string[], format: string, size: number) => void;
}

export const BulkExportDialog = ({ open, onOpenChange, qrCodes, onExport }: BulkExportDialogProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState('PNG');
  const [exportSize, setExportSize] = useState(256);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleSelectAll = () => {
    if (selectedIds.length === qrCodes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(qrCodes.map(qr => qr.id));
    }
  };

  const handleSelectQR = (qrId: string) => {
    setSelectedIds(prev => 
      prev.includes(qrId) 
        ? prev.filter(id => id !== qrId)
        : [...prev, qrId]
    );
  };

  const handleExport = async () => {
    if (selectedIds.length === 0) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    // Simulate export progress
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          onExport(selectedIds, exportFormat, exportSize);
          onOpenChange(false);
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  const selectedCount = selectedIds.length;
  const totalCount = qrCodes.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Bulk Export QR Codes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PNG">PNG (Raster)</SelectItem>
                      <SelectItem value="SVG">SVG (Vector)</SelectItem>
                      <SelectItem value="PDF">PDF (Print Ready)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select value={exportSize.toString()} onValueChange={(value) => setExportSize(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="128">128x128px (Small)</SelectItem>
                      <SelectItem value="256">256x256px (Medium)</SelectItem>
                      <SelectItem value="512">512x512px (Large)</SelectItem>
                      <SelectItem value="1024">1024x1024px (Print)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Select QR Codes to Export</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {selectedCount} of {totalCount} selected
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSelectAll}
                    className="flex items-center gap-1"
                  >
                    <CheckSquare className="h-4 w-4" />
                    {selectedIds.length === qrCodes.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {qrCodes.map((qr) => (
                  <div key={qr.id} className="flex items-center space-x-3 p-2 border rounded hover:bg-muted/50">
                    <Checkbox
                      checked={selectedIds.includes(qr.id)}
                      onCheckedChange={() => handleSelectQR(qr.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{qr.id}</span>
                        <Badge variant="outline" className="text-xs">{qr.scope}</Badge>
                        <Badge variant={qr.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                          {qr.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {qr.assignedTo} • {qr.servicesEnabled.length} services
                      </div>
                    </div>
                    {qr.pendingRequests > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {qr.pendingRequests} pending
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Progress */}
          {isExporting && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Generating QR codes...</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={selectedIds.length === 0 || isExporting}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileImage className="h-4 w-4" />
                  Export {selectedCount} QR Code{selectedCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};