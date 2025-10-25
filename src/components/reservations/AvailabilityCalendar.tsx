// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoomAvailability } from "@/hooks/data/useReservationsData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { CalendarIcon, Bed, Users } from "lucide-react";

export function AvailabilityCalendar() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [checkOutDate, setCheckOutDate] = useState<Date>(addDays(new Date(), 1));
  const [selectedRoomType, setSelectedRoomType] = useState<string>("all");

  // Fetch room types
  const { data: roomTypes } = useQuery({
    queryKey: ['room-types', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  // Get availability for selected dates
  const availability = useRoomAvailability(
    selectedDate,
    checkOutDate,
    selectedRoomType !== "all" ? selectedRoomType : undefined
  );

  // Get reservations for the month to show on calendar
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const { data: monthReservations } = useQuery({
    queryKey: ['month-reservations', tenantId, format(monthStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');
      const { data, error } = await supabase
        .from('reservations')
        .select('check_in_date, check_out_date, status')
        .eq('tenant_id', tenantId)
        .gte('check_in_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('check_in_date', format(monthEnd, 'yyyy-MM-dd'))
        .in('status', ['confirmed', 'checked_in']);
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  // Count reservations per day
  const reservationCounts = monthReservations?.reduce((acc, res) => {
    const days = eachDayOfInterval({
      start: new Date(res.check_in_date),
      end: new Date(res.check_out_date),
    });
    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      acc[key] = (acc[key] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Room Availability Calendar
          </CardTitle>
          <CardDescription>
            Check room availability for your selected dates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Room Type</label>
            <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
              <SelectTrigger>
                <SelectValue placeholder="All room types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Room Types</SelectItem>
                {roomTypes?.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>
                    {rt.name} ({rt.total_count} rooms)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Check-in</label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
                modifiers={{
                  booked: (date) => {
                    const key = format(date, 'yyyy-MM-dd');
                    const count = reservationCounts[key] || 0;
                    return count > 0;
                  }
                }}
                modifiersClassNames={{
                  booked: "bg-primary/10 text-primary font-semibold"
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Check-out</label>
              <Calendar
                mode="single"
                selected={checkOutDate}
                onSelect={(date) => date && setCheckOutDate(date)}
                disabled={(date) => date <= selectedDate}
                className="rounded-md border"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {format(selectedDate, "MMM d")} - {format(checkOutDate, "MMM d, yyyy")}
              <span className="block">
                {Math.ceil((checkOutDate.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24))} night(s)
              </span>
            </div>
            <Badge variant={availability.data?.length ? "default" : "destructive"}>
              {availability.isLoading ? "Checking..." : `${availability.data?.length || 0} Available`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Rooms</CardTitle>
          <CardDescription>
            Rooms available for selected dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availability.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Checking availability...
            </div>
          ) : availability.data?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No rooms available for selected dates
            </div>
          ) : (
            <div className="space-y-3">
              {availability.data?.map((room: any) => (
                <Card key={room.room_id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Bed className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">Room {room.room_number}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {room.room_type_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-3 w-3" />
                          <span>Max {room.max_occupancy} guests</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          ₦{room.available_rate?.toLocaleString() || room.base_rate?.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">per night</div>
                        <Button size="sm" className="mt-2">
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
