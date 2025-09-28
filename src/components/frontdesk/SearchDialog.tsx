import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, User, BedDouble, Phone, Mail, Loader2 } from "lucide-react";
import { useGuestSearch } from "@/hooks/useGuestSearch";
import { useRooms } from "@/hooks/useRooms";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchDialog = ({ open, onOpenChange }: SearchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: guestResults, isLoading: loadingGuests } = useGuestSearch(searchQuery);
  const { data: roomData, isLoading: loadingRooms } = useRooms();

  // Combine guest and room results
  const results = searchQuery.length > 2 ? [
    // Guest results
    ...(guestResults || []).map(guest => ({
      id: `guest-${guest.id}`,
      type: "guest" as const,
      name: guest.name,
      room: guest.current_room,
      phone: guest.phone,
      email: guest.email,
      status: guest.reservation_status || (guest.current_room ? "checked-in" : "none"),
      guest_id: guest.id
    })),
    // Room results
    ...(roomData?.rooms || [])
      .filter(room => 
        room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.room_type?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.current_reservation?.guest_name && 
         room.current_reservation.guest_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .map(room => ({
        id: `room-${room.id}`,
        type: "room" as const,
        number: room.room_number,
        guest: room.current_reservation?.guest_name,
        type_name: room.room_type?.name,
        status: room.status,
        room_id: room.id
      }))
  ] : [];

  const isLoading = loadingGuests || loadingRooms;

  const handleResultClick = (result: any) => {
    console.log("Selected result:", result);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Guest/Room
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by guest name, room number, phone, or email..."
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading && searchQuery.length > 2 && (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Searching...
              </div>
            )}
            
            {!isLoading && results.length === 0 && searchQuery.length > 2 && (
              <div className="text-center py-8 text-muted-foreground">
                No results found for "{searchQuery}"
              </div>
            )}
            
            {results.map((result) => (
              <div 
                key={result.id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {result.type === "guest" ? (
                        <User className="h-5 w-5 text-primary" />
                      ) : (
                        <BedDouble className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    
                    <div>
                      <div className="font-medium">
                        {result.type === "guest" ? result.name : `Room ${result.number}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.type === "guest" ? (
                          <div className="flex items-center gap-2">
                            <span>Room {result.room}</span>
                            {result.phone && (
                              <>
                                <span>•</span>
                                <Phone className="h-3 w-3" />
                                <span>{result.phone}</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <div>
                            {result.guest} • {result.type_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={
                      result.status === "checked-in" || result.status === "occupied" ? "default" :
                      result.status === "reserved" ? "secondary" : "outline"
                    }
                  >
                    {result.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};