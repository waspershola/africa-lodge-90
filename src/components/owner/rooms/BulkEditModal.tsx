import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Edit3, 
  DollarSign, 
  Calendar, 
  BedDouble,
  CheckCircle,
  X,
  Settings,
  Users,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";

interface Room {
  id: string;
  number: string;
  type: string;
  floor: number;
  status: 'available' | 'occupied' | 'maintenance' | 'dirty';
  rate: number;
  maxOccupancy: number;
}

interface BulkEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRooms: Room[];
  onSave: (updates: any) => void;
}

interface BulkUpdates {
  status?: string;
  rate?: number;
  rateAdjustment?: {
    type: 'fixed' | 'percentage';
    value: number;
  };
  type?: string;
  maxOccupancy?: number;
  applyToFields: string[];
}

const roomStatuses = [
  { value: 'available', label: 'Available', color: 'bg-green-100 text-green-800' },
  { value: 'occupied', label: 'Occupied', color: 'bg-blue-100 text-blue-800' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'dirty', label: 'Dirty', color: 'bg-red-100 text-red-800' }
];

const roomTypes = [
  'Standard', 'Deluxe', 'Suite', 'Presidential'
];

export default function BulkEditModal({ open, onOpenChange, selectedRooms, onSave }: BulkEditModalProps) {
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState("basic");
  
  const [bulkUpdates, setBulkUpdates] = useState<BulkUpdates>({
    applyToFields: []
  });

  const handleFieldToggle = (field: string) => {
    setBulkUpdates(prev => ({
      ...prev,
      applyToFields: prev.applyToFields.includes(field)
        ? prev.applyToFields.filter(f => f !== field)
        : [...prev.applyToFields, field]
    }));
  };

  const calculateNewRate = (currentRate: number) => {
    if (!bulkUpdates.rateAdjustment) return currentRate;
    
    if (bulkUpdates.rateAdjustment.type === 'fixed') {
      return bulkUpdates.rate || currentRate;
    } else {
      return currentRate * (1 + bulkUpdates.rateAdjustment.value / 100);
    }
  };

  const handleSave = () => {
    if (bulkUpdates.applyToFields.length === 0) {
      toast({
        title: "No Changes Selected",
        description: "Please select at least one field to update",
        variant: "destructive"
      });
      return;
    }

    const updates: any = {};
    
    bulkUpdates.applyToFields.forEach(field => {
      switch (field) {
        case 'status':
          if (bulkUpdates.status) updates.status = bulkUpdates.status;
          break;
        case 'rate':
          if (bulkUpdates.rateAdjustment?.type === 'fixed' && bulkUpdates.rate) {
            updates.rate = bulkUpdates.rate;
          } else if (bulkUpdates.rateAdjustment?.type === 'percentage') {
            updates.rateAdjustment = bulkUpdates.rateAdjustment;
          }
          break;
        case 'type':
          if (bulkUpdates.type) updates.type = bulkUpdates.type;
          break;
        case 'maxOccupancy':
          if (bulkUpdates.maxOccupancy) updates.maxOccupancy = bulkUpdates.maxOccupancy;
          break;
      }
    });

    onSave(updates);
    onOpenChange(false);
    
    toast({
      title: "Bulk Update Completed",
      description: `Successfully updated ${selectedRooms.length} rooms`
    });
  };

  const getPreviewData = () => {
    return selectedRooms.map(room => ({
      ...room,
      newStatus: bulkUpdates.applyToFields.includes('status') ? bulkUpdates.status : room.status,
      newRate: bulkUpdates.applyToFields.includes('rate') ? calculateNewRate(room.rate) : room.rate,
      newType: bulkUpdates.applyToFields.includes('type') ? bulkUpdates.type : room.type,
      newMaxOccupancy: bulkUpdates.applyToFields.includes('maxOccupancy') ? bulkUpdates.maxOccupancy : room.maxOccupancy
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Bulk Edit Rooms ({selectedRooms.length} selected)
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Changes</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Room Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Update */}
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="status-checkbox"
                    checked={bulkUpdates.applyToFields.includes('status')}
                    onCheckedChange={() => handleFieldToggle('status')}
                  />
                  <div className="flex-1">
                    <Label htmlFor="status-select">Update Status</Label>
                    <Select 
                      value={bulkUpdates.status || ''} 
                      onValueChange={(value) => setBulkUpdates(prev => ({ ...prev, status: value }))}
                      disabled={!bulkUpdates.applyToFields.includes('status')}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomStatuses.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${status.color.replace('text-', 'bg-').replace('100', '500')}`} />
                              {status.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Room Type Update */}
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="type-checkbox"
                    checked={bulkUpdates.applyToFields.includes('type')}
                    onCheckedChange={() => handleFieldToggle('type')}
                  />
                  <div className="flex-1">
                    <Label htmlFor="type-select">Update Room Type</Label>
                    <Select 
                      value={bulkUpdates.type || ''} 
                      onValueChange={(value) => setBulkUpdates(prev => ({ ...prev, type: value }))}
                      disabled={!bulkUpdates.applyToFields.includes('type')}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Max Occupancy Update */}
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="occupancy-checkbox"
                    checked={bulkUpdates.applyToFields.includes('maxOccupancy')}
                    onCheckedChange={() => handleFieldToggle('maxOccupancy')}
                  />
                  <div className="flex-1">
                    <Label htmlFor="occupancy-input">Update Max Occupancy</Label>
                    <Input
                      id="occupancy-input"
                      type="number"
                      min="1"
                      max="10"
                      value={bulkUpdates.maxOccupancy || ''}
                      onChange={(e) => setBulkUpdates(prev => ({ ...prev, maxOccupancy: parseInt(e.target.value) }))}
                      disabled={!bulkUpdates.applyToFields.includes('maxOccupancy')}
                      className="mt-1"
                      placeholder="Number of guests"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="rate-checkbox"
                    checked={bulkUpdates.applyToFields.includes('rate')}
                    onCheckedChange={() => handleFieldToggle('rate')}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-4">
                    <Label>Update Room Rates</Label>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="fixed-rate"
                          name="rateType"
                          checked={bulkUpdates.rateAdjustment?.type === 'fixed'}
                          onChange={() => setBulkUpdates(prev => ({ 
                            ...prev, 
                            rateAdjustment: { type: 'fixed', value: 0 } 
                          }))}
                          disabled={!bulkUpdates.applyToFields.includes('rate')}
                        />
                        <Label htmlFor="fixed-rate">Set Fixed Rate</Label>
                      </div>
                      
                      {bulkUpdates.rateAdjustment?.type === 'fixed' && (
                        <Input
                          type="number"
                          value={bulkUpdates.rate || ''}
                          onChange={(e) => setBulkUpdates(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                          disabled={!bulkUpdates.applyToFields.includes('rate')}
                          placeholder="Enter fixed rate"
                        />
                      )}

                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="percentage-rate"
                          name="rateType"
                          checked={bulkUpdates.rateAdjustment?.type === 'percentage'}
                          onChange={() => setBulkUpdates(prev => ({ 
                            ...prev, 
                            rateAdjustment: { type: 'percentage', value: 0 } 
                          }))}
                          disabled={!bulkUpdates.applyToFields.includes('rate')}
                        />
                        <Label htmlFor="percentage-rate">Percentage Adjustment</Label>
                      </div>
                      
                      {bulkUpdates.rateAdjustment?.type === 'percentage' && (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={bulkUpdates.rateAdjustment.value || ''}
                            onChange={(e) => setBulkUpdates(prev => ({ 
                              ...prev, 
                              rateAdjustment: { 
                                type: 'percentage', 
                                value: parseFloat(e.target.value) 
                              } 
                            }))}
                            disabled={!bulkUpdates.applyToFields.includes('rate')}
                            placeholder="0"
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      )}
                    </div>

                    {bulkUpdates.rateAdjustment && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-2">Rate Preview:</p>
                        <div className="text-sm space-y-1">
                          {selectedRooms.slice(0, 3).map(room => (
                            <div key={room.id} className="flex justify-between">
                              <span>Room {room.number}:</span>
                              <span>
                                {formatPrice(room.rate)} → {formatPrice(calculateNewRate(room.rate))}
                              </span>
                            </div>
                          ))}
                          {selectedRooms.length > 3 && (
                            <p className="text-muted-foreground">...and {selectedRooms.length - 3} more rooms</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Preview Changes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bulkUpdates.applyToFields.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No changes selected. Please go back and select fields to update.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 max-h-64 overflow-y-auto">
                      {getPreviewData().map(room => (
                        <div key={room.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <BedDouble className="h-4 w-4" />
                              <span className="font-medium">Room {room.number}</span>
                            </div>
                            <Badge variant="outline">
                              {bulkUpdates.applyToFields.length} changes
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {bulkUpdates.applyToFields.includes('status') && (
                              <div>
                                <span className="text-muted-foreground">Status: </span>
                                <span className="text-red-600">{room.status}</span>
                                <span className="mx-2">→</span>
                                <span className="text-green-600">{room.newStatus}</span>
                              </div>
                            )}
                            
                            {bulkUpdates.applyToFields.includes('rate') && (
                              <div>
                                <span className="text-muted-foreground">Rate: </span>
                                <span className="text-red-600">{formatPrice(room.rate)}</span>
                                <span className="mx-2">→</span>
                                <span className="text-green-600">{formatPrice(room.newRate)}</span>
                              </div>
                            )}
                            
                            {bulkUpdates.applyToFields.includes('type') && (
                              <div>
                                <span className="text-muted-foreground">Type: </span>
                                <span className="text-red-600">{room.type}</span>
                                <span className="mx-2">→</span>
                                <span className="text-green-600">{room.newType}</span>
                              </div>
                            )}
                            
                            {bulkUpdates.applyToFields.includes('maxOccupancy') && (
                              <div>
                                <span className="text-muted-foreground">Max Guests: </span>
                                <span className="text-red-600">{room.maxOccupancy}</span>
                                <span className="mx-2">→</span>
                                <span className="text-green-600">{room.newMaxOccupancy}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={bulkUpdates.applyToFields.length === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Apply Changes ({selectedRooms.length} rooms)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}