import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Copy } from "lucide-react";
import { useCreateRoom } from "@/hooks/useRooms";
import { useToast } from "@/hooks/use-toast";
import { useRoomLimits } from "@/hooks/useRoomLimits";
import { useMultiTenantAuth } from "@/hooks/useMultiTenantAuth";

interface BulkRoomData {
  room_number: string;
  room_type_id: string;
  floor: number;
  notes?: string;
}

interface BulkRoomCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  roomTypes: Array<{ id: string; name: string }>;
  currentRoomCount: number;
}

export default function BulkRoomCreator({ isOpen, onClose, roomTypes, currentRoomCount }: BulkRoomCreatorProps) {
  const [rooms, setRooms] = useState<BulkRoomData[]>([
    { room_number: "", room_type_id: "", floor: 1 }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { tenant } = useMultiTenantAuth();
  const createRoom = useCreateRoom();
  const { toast } = useToast();
  const roomLimits = useRoomLimits(tenant?.plan_id || '');

  const addRoom = () => {
    if (rooms.length + currentRoomCount >= roomLimits.maxRooms) {
      toast({
        title: "Room Limit Exceeded",
        description: `Your plan allows a maximum of ${roomLimits.maxRooms} rooms.`,
        variant: "destructive"
      });
      return;
    }
    
    setRooms([...rooms, { room_number: "", room_type_id: "", floor: 1 }]);
  };

  const removeRoom = (index: number) => {
    if (rooms.length > 1) {
      setRooms(rooms.filter((_, i) => i !== index));
    }
  };

  const updateRoom = (index: number, field: keyof BulkRoomData, value: string | number) => {
    const updatedRooms = [...rooms];
    updatedRooms[index] = { ...updatedRooms[index], [field]: value };
    setRooms(updatedRooms);
  };

  const generateSequentialRooms = () => {
    const startNumber = prompt("Enter starting room number (e.g., 101):");
    const count = prompt("How many rooms to generate?");
    const selectedFloor = prompt("Floor number:");
    const selectedRoomType = roomTypes[0]?.id;

    if (!startNumber || !count || !selectedFloor || !selectedRoomType) return;

    const numStart = parseInt(startNumber);
    const numCount = parseInt(count);
    const floor = parseInt(selectedFloor);

    if (numCount + currentRoomCount > roomLimits.maxRooms) {
      toast({
        title: "Room Limit Exceeded",
        description: `This would exceed your plan limit of ${roomLimits.maxRooms} rooms.`,
        variant: "destructive"
      });
      return;
    }

    const newRooms: BulkRoomData[] = [];
    for (let i = 0; i < numCount; i++) {
      newRooms.push({
        room_number: (numStart + i).toString(),
        room_type_id: selectedRoomType,
        floor: floor,
        notes: "Generated room"
      });
    }

    setRooms(newRooms);
  };

  const duplicateRoom = (index: number) => {
    if (rooms.length + currentRoomCount >= roomLimits.maxRooms) {
      toast({
        title: "Room Limit Exceeded",
        description: `Your plan allows a maximum of ${roomLimits.maxRooms} rooms.`,
        variant: "destructive"
      });
      return;
    }

    const roomToDuplicate = { ...rooms[index] };
    roomToDuplicate.room_number = roomToDuplicate.room_number + "_copy";
    setRooms([...rooms, roomToDuplicate]);
  };

  const handleBulkCreate = async () => {
    // Validate all rooms
    const invalidRooms = rooms.filter(room => 
      !room.room_number.trim() || !room.room_type_id || !room.floor
    );

    if (invalidRooms.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields for all rooms",
        variant: "destructive"
      });
      return;
    }

    if (rooms.length + currentRoomCount > roomLimits.maxRooms) {
      toast({
        title: "Room Limit Exceeded",
        description: `This would exceed your plan limit of ${roomLimits.maxRooms} rooms.`,
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Create rooms sequentially to avoid conflicts
      for (const room of rooms) {
        await createRoom.mutateAsync({
          room_number: room.room_number.trim(),
          room_type_id: room.room_type_id,
          floor: room.floor,
          status: 'available',
          notes: room.notes || ''
        });
      }

      toast({
        title: "Success",
        description: `Successfully created ${rooms.length} rooms`,
      });

      // Reset form and close
      setRooms([{ room_number: "", room_type_id: "", floor: 1 }]);
      onClose();
    } catch (error) {
      console.error("Error creating rooms:", error);
      toast({
        title: "Error",
        description: "Failed to create some rooms. Please check for duplicate room numbers.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Room Creator</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={generateSequentialRooms}
                  className="flex-1"
                >
                  Generate Sequential Rooms
                </Button>
                <Button 
                  variant="outline" 
                  onClick={addRoom}
                  className="flex-1"
                  disabled={rooms.length + currentRoomCount >= roomLimits.maxRooms}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Single Room
                </Button>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Rooms to create: {rooms.length}</span>
                <Badge variant="outline">
                  Total: {currentRoomCount + rooms.length} / {roomLimits.maxRooms === 9999 ? '∞' : roomLimits.maxRooms}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Room List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Rooms to Create</h3>
            
            {rooms.map((room, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Room Number *</Label>
                      <Input
                        value={room.room_number}
                        onChange={(e) => updateRoom(index, 'room_number', e.target.value)}
                        placeholder="e.g., 101"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Room Type *</Label>
                      <Select
                        value={room.room_type_id}
                        onValueChange={(value) => updateRoom(index, 'room_type_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Floor *</Label>
                      <Input
                        type="number"
                        value={room.floor}
                        onChange={(e) => updateRoom(index, 'floor', parseInt(e.target.value) || 1)}
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Actions</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateRoom(index)}
                          disabled={rooms.length + currentRoomCount >= roomLimits.maxRooms}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRoom(index)}
                          disabled={rooms.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label>Notes</Label>
                    <Input
                      value={room.notes || ""}
                      onChange={(e) => updateRoom(index, 'notes', e.target.value)}
                      placeholder="Optional notes..."
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <Button 
              onClick={handleBulkCreate}
              disabled={isGenerating || rooms.length === 0}
              className="flex-1"
            >
              {isGenerating ? `Creating ${rooms.length} rooms...` : `Create ${rooms.length} Room${rooms.length !== 1 ? 's' : ''}`}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}