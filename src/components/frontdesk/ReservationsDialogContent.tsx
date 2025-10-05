import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InteractiveReservationCalendar from "@/components/owner/reservations/InteractiveReservationCalendar";
import ReservationList from "@/components/owner/reservations/ReservationList";

export function ReservationsDialogContent() {
  const [view, setView] = useState("calendar");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  const handleReservationSelect = (reservation: any) => {
    setSelectedReservation(reservation);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by guest name, room, or booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="checked_in">Checked In</SelectItem>
            <SelectItem value="checked_out">Checked Out</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs for Calendar and List Views */}
      <Tabs value={view} onValueChange={setView} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <InteractiveReservationCalendar
            currentDate={new Date()}
            onReservationSelect={handleReservationSelect}
            selectedReservation={selectedReservation}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <ReservationList
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            onReservationSelect={handleReservationSelect}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
