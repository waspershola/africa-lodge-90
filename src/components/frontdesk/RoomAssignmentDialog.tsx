import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Home, MapPin, Clock, User, AlertTriangle, CheckCircle } from "lucide-react";
import { useHardAssignReservation, useAvailableRoomsForAssignment } from "@/hooks/useAfricanReservationSystem";
import { protectedMutate } from '@/lib/mutation-utils';
import { useToast } from '@/hooks/use-toast';

interface RoomAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: {
    id: string;
    reservation_number: string;
    guest_name: string;
    room_type_id: string;
    check_in_date: string;
    check_out_date: string;
    adults: number;
    children: number;
    status: string;
    room_types?: {
      name: string;
      base_rate: number;
    };
  } | null;
}

export default function RoomAssignmentDialog({
  open,
  onOpenChange,
  reservation
}: RoomAssignmentDialogProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [assignmentReason, setAssignmentReason] = useState("");

  const hardAssign = useHardAssignReservation();

  const { data: availableRooms = [], isLoading: roomsLoading } = useAvailableRoomsForAssignment(
    reservation?.room_type_id || "",
    reservation?.check_in_date || "",
    reservation?.check_out_date || ""
  );

  const { toast } = useToast();

  const handleAssignRoom = async () => {
    if (!reservation || !selectedRoomId) return;

    try {
      // Phase 7.4: Use protected mutation wrapper
      await protectedMutate(
        () => hardAssign.mutateAsync({
          reservation_id: reservation.id,
          room_id: selectedRoomId,
          assigned_by: "front_desk",
          assignment_reason: assignmentReason || `Check-in for ${reservation.guest_name}`
        }),
        'Room Assignment'
      );
      
      toast({
        title: "Room Assigned",
        description: `Room successfully assigned to ${reservation.guest_name}`,
      });
      
      onOpenChange(false);
      setSelectedRoomId("");
      setAssignmentReason("");
    } catch (error) {
      console.error("Room assignment failed:", error);
      // Error already handled by protectedMutate
    }
  };

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Room Assignment - {reservation.reservation_number}
          </DialogTitle>
          <DialogDescription>
            Assign a specific room for check-in (Soft Hold → Hard Assignment)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reservation Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Reservation Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Guest Name</span>
                  <div className="font-medium">{reservation.guest_name}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Room Type</span>
                  <div className="font-medium">{reservation.room_types?.name}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={reservation.status === 'soft_hold' ? 'secondary' : 'default'}>
                    {reservation.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Check-in</span>
                  <div className="font-medium">{new Date(reservation.check_in_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Check-out</span>
                  <div className="font-medium">{new Date(reservation.check_out_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Guests</span>
                  <div className="font-medium">{reservation.adults + reservation.children} ({reservation.adults}A, {reservation.children}C)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Rooms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Available Rooms
                {availableRooms.length > 0 && (
                  <Badge variant="secondary">{availableRooms.length} available</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Select a clean, available room for assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {roomsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : availableRooms.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Available Rooms</h3>
                  <p className="text-muted-foreground">
                    All rooms of type "{reservation.room_types?.name}" are currently occupied or unavailable.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Consider upgrading the guest to another room type or waiting for a room to be cleaned.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="grid gap-3">
                    {availableRooms.map((room) => (
                      <Card 
                        key={room.id}
                        className={`cursor-pointer transition-colors ${
                          selectedRoomId === room.id 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedRoomId(room.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Home className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium text-lg">Room {room.room_number}</div>
                                <div className="text-sm text-muted-foreground">Floor {room.floor}</div>
                              </div>
                            </div>

                            <div className="text-right">
                              <Badge 
                                variant={room.status === 'available' ? 'secondary' : 'outline'}
                                className="mb-2"
                              >
                                {room.status}
                              </Badge>
                              <div className="text-sm text-muted-foreground">
                                Max: {room.room_types?.max_occupancy || 'N/A'} guests
                              </div>
                            </div>

                            {selectedRoomId === room.id && (
                              <CheckCircle className="h-6 w-6 text-primary ml-4" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Assignment Actions */}
          {availableRooms.length > 0 && (
            <>
              <Separator />
              
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Room will be marked as occupied upon assignment</span>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  
                  <Button 
                    onClick={handleAssignRoom}
                    disabled={!selectedRoomId || hardAssign.isPending}
                  >
                    {hardAssign.isPending ? "Assigning..." : "Assign Room"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}