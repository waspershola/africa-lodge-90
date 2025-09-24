import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarDays, Users, DollarSign, Loader2 } from "lucide-react";
import { useAvailabilityEngine, AvailableRoom } from "@/hooks/useAvailabilityEngine";
import { motion } from "framer-motion";

interface AvailabilityCalendarProps {
  selectedDates?: {
    checkIn: string;
    checkOut: string;
  };
  onDateChange?: (dates: { checkIn: string; checkOut: string }) => void;
  onRoomSelect?: (room: AvailableRoom) => void;
  roomTypeFilter?: string;
}

export function AvailabilityCalendar({
  selectedDates,
  onDateChange,
  onRoomSelect,
  roomTypeFilter
}: AvailabilityCalendarProps) {
  const { getAvailability, loading, error } = useAvailabilityEngine();
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [dates, setDates] = useState({
    checkIn: selectedDates?.checkIn || today,
    checkOut: selectedDates?.checkOut || tomorrow
  });

  const searchAvailability = useCallback(async () => {
    if (!dates.checkIn || !dates.checkOut) return;
    
    const rooms = await getAvailability(dates.checkIn, dates.checkOut, roomTypeFilter);
    setAvailableRooms(rooms);
  }, [dates.checkIn, dates.checkOut, roomTypeFilter, getAvailability]);

  useEffect(() => {
    searchAvailability();
  }, [searchAvailability]);

  useEffect(() => {
    if (selectedDates) {
      setDates(selectedDates);
    }
  }, [selectedDates]);

  const handleDateChange = (field: 'checkIn' | 'checkOut', value: string) => {
    const newDates = { ...dates, [field]: value };
    setDates(newDates);
    onDateChange?.(newDates);
  };

  const handleRoomSelect = (room: AvailableRoom) => {
    setSelectedRoom(room.room_id);
    onRoomSelect?.(room);
  };

  const availableCount = availableRooms.filter(r => r.is_available).length;
  const unavailableCount = availableRooms.filter(r => !r.is_available).length;

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Select Dates
          </CardTitle>
          <CardDescription>
            Choose your check-in and check-out dates to see availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Check-in Date</label>
              <input
                type="date"
                value={dates.checkIn}
                min={today}
                onChange={(e) => handleDateChange('checkIn', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Check-out Date</label>
              <input
                type="date"
                value={dates.checkOut}
                min={dates.checkIn}
                onChange={(e) => handleDateChange('checkOut', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <Button onClick={searchAvailability} disabled={loading} className="h-10">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Search Rooms
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Availability Stats */}
      {availableRooms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Rooms</p>
                  <p className="text-2xl font-bold text-success">{availableCount}</p>
                </div>
                <div className="h-12 w-12 bg-success/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Occupied Rooms</p>
                  <p className="text-2xl font-bold text-danger">{unavailableCount}</p>
                </div>
                <div className="h-12 w-12 bg-danger/10 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-danger" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Rate</p>
                  <p className="text-2xl font-bold text-primary">
                    ₦{Math.round(availableRooms.reduce((sum, r) => sum + r.available_rate, 0) / availableRooms.length || 0).toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Available Rooms */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Searching for available rooms...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-destructive mb-4">Error loading availability</div>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={searchAvailability} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : availableRooms.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Available Rooms</CardTitle>
            <CardDescription>
              {availableCount} room{availableCount !== 1 ? 's' : ''} available for your selected dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {availableRooms.map((room) => (
                <motion.div
                  key={room.room_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    room.is_available
                      ? selectedRoom === room.room_id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      : 'border-destructive/20 bg-destructive/5 cursor-not-allowed'
                  }`}
                  onClick={() => room.is_available && handleRoomSelect(room)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">Room {room.room_number}</h4>
                        <Badge variant={room.is_available ? "default" : "destructive"}>
                          {room.is_available ? "Available" : "Occupied"}
                        </Badge>
                        {room.available_rate !== room.base_rate && (
                          <Badge variant="secondary">Special Rate</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Type:</span> {room.room_type_name}
                        </div>
                        <div>
                          <span className="font-medium">Capacity:</span> {room.max_occupancy} guests
                        </div>
                        <div>
                          <span className="font-medium">Base Rate:</span> ₦{room.base_rate.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Available Rate:</span> 
                          <span className={room.available_rate < room.base_rate ? "text-success" : "text-foreground"}>
                            {' '}₦{room.available_rate.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {room.is_available && (
                      <Button
                        variant={selectedRoom === room.room_id ? "default" : "outline"}
                        size="sm"
                      >
                        {selectedRoom === room.room_id ? "Selected" : "Select Room"}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No rooms found</h3>
            <p className="text-muted-foreground">
              No rooms are available for the selected dates. Try different dates or contact the hotel directly.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}