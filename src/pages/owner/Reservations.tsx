import React, { useState } from 'react';
import { Calendar, Plus, Search, Filter, Users, Clock, MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReservationCalendar from '@/components/owner/reservations/ReservationCalendar';
import InteractiveReservationCalendar from '@/components/owner/reservations/InteractiveReservationCalendar';
import ReservationList from '@/components/owner/reservations/ReservationList';
import NewReservationDialog from '@/components/owner/reservations/NewReservationDialog';
import GroupBookingDialog from '@/components/owner/reservations/GroupBookingDialog';
import ReservationDetails from '@/components/owner/reservations/ReservationDetails';
import { useReservations } from '@/hooks/useRooms';

export default function ReservationsPage() {
  const [view, setView] = useState('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const { data: reservations = [], isLoading: loading, error } = useReservations();

  // Calculate stats from API data
  const reservationStats = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    pending: reservations.filter(r => r.status === 'confirmed').length, // No pending status in new schema
    checked_in: reservations.filter(r => r.status === 'checked_in').length,
    checkedOut: reservations.filter(r => r.status === 'checked_out').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
    noShow: 0
  };

  // Today's activity from reservations
  const today = new Date();
  const todayActivity = reservations
    .filter(r => {
      const checkIn = new Date(r.check_in_date);
      const checkOut = new Date(r.check_out_date);
      return (
        (checkIn.toDateString() === today.toDateString()) ||
        (checkOut.toDateString() === today.toDateString())
      );
    })
    .map(r => {
      const checkIn = new Date(r.check_in_date);
      const checkOut = new Date(r.check_out_date);
      
      if (checkIn.toDateString() === today.toDateString()) {
        return {
          time: '14:00',
          type: 'check-in',
          guest: r.guest_name,
          room: r.room_id || 'N/A',
          status: r.status === 'confirmed' ? 'pending' : 'completed'
        };
      }
      if (checkOut.toDateString() === today.toDateString()) {
        return {
          time: '12:00',
          type: 'check-out',
          guest: r.guest_name,
          room: r.room_id || 'N/A',
          status: r.status === 'checked_out' ? 'completed' : 'pending'
        };
      }
    })
    .filter(Boolean);

      if (loading) {
    return <div className="p-6">Loading reservations...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error loading reservations</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>
          <p className="text-muted-foreground">
            Manage hotel bookings and guest reservations
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Reservation
          </Button>
          <Button variant="outline" onClick={() => setShowGroupDialog(true)}>
            <Users className="h-4 w-4 mr-2" />
            Group Booking
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservationStats.total}</div>
            <p className="text-xs text-muted-foreground">
              +12 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reservationStats.confirmed}</div>
            <p className="text-xs text-muted-foreground">
              {((reservationStats.confirmed / reservationStats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{reservationStats.checked_in}</div>
            <p className="text-xs text-muted-foreground">
              Currently in house
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{reservationStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reservations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="checked-in">Checked In</SelectItem>
                    <SelectItem value="checked-out">Checked Out</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Button 
                    variant={view === 'calendar' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setView('calendar')}
                  >
                    Calendar
                  </Button>
                  <Button 
                    variant={view === 'list' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setView('list')}
                  >
                    List
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reservations Content */}
          <Tabs value={view} onValueChange={setView}>
            <TabsContent value="calendar">
          <InteractiveReservationCalendar
            currentDate={new Date()}
            onReservationSelect={setSelectedReservation}
          />
            </TabsContent>

            <TabsContent value="list">
              <ReservationList 
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                onReservationSelect={setSelectedReservation}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Today's Activity Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Activity
              </CardTitle>
              <CardDescription>
                Scheduled check-ins and check-outs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="text-sm font-medium text-muted-foreground min-w-[50px]">
                    {activity.time}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant={activity.type === 'check-in' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {activity.type === 'check-in' ? 'Check-In' : 'Check-Out'}
                      </Badge>
                      <Badge 
                        variant={activity.status === 'completed' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                    <div className="text-sm font-medium">{activity.guest}</div>
                    <div className="text-xs text-muted-foreground">Room {activity.room}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Availability Calendar
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setShowGroupDialog(true)}>
                <Users className="h-4 w-4 mr-2" />
                Group Bookings
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Walk-in Registration
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <NewReservationDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
      />

      <GroupBookingDialog
        open={showGroupDialog}
        onClose={() => setShowGroupDialog(false)}
      />

      {selectedReservation && (
        <ReservationDetails
          reservation={selectedReservation}
          open={!!selectedReservation}
          onOpenChange={() => setSelectedReservation(null)}
        />
      )}
    </div>
  );
}