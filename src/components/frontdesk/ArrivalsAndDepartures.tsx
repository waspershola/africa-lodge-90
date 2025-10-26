// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTodayArrivals, useTodayDepartures, useCheckIn, useCheckOut } from "@/hooks/data/useReservationsData";
import { format } from "date-fns";
import { Calendar, User, Phone, Mail, MapPin, Clock, LogIn, LogOut, WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { connectionManager, ConnectionStatus } from "@/lib/connection-manager";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ArrivalsAndDepartures() {
  const { data: arrivals, isLoading: arrivalsLoading, isFetching: arrivalsFetching } = useTodayArrivals();
  const { data: departures, isLoading: departuresLoading, isFetching: departuresFetching } = useTodayDepartures();
  const { mutate: checkIn, isPending: isCheckingIn } = useCheckIn();
  const { mutate: checkOut, isPending: isCheckingOut } = useCheckOut();
  
  // PHASE H.10: Connection status monitoring
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  
  useEffect(() => {
    const unsubscribe = connectionManager.onStatusChange((status) => {
      setConnectionStatus(status);
    });
    return unsubscribe;
  }, []);
  
  const isReconnecting = connectionStatus === 'reconnecting' || connectionStatus === 'degraded';
  const isFetching = arrivalsFetching || departuresFetching;

  if (arrivalsLoading || departuresLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Today's Activity
          {isFetching && <Skeleton className="h-4 w-20" />}
        </CardTitle>
        <CardDescription>
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* PHASE H.10: Reconnection alert */}
        {isReconnecting && (
          <Alert className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Reconnecting to server... Please wait.
            </AlertDescription>
          </Alert>
        )}
        <Tabs defaultValue="arrivals" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="arrivals">
              Arrivals ({arrivals?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="departures">
              Departures ({departures?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="arrivals" className="space-y-4 mt-4">
            {arrivals?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No arrivals scheduled for today
              </p>
            ) : (
              arrivals?.map((reservation: any) => (
                <Card key={reservation.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {reservation.guest?.first_name} {reservation.guest?.last_name}
                          </span>
                          {reservation.guest?.vip_status && (
                            <Badge variant="secondary">VIP</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Room {reservation.room?.room_number || "TBA"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {reservation.guest?.phone || "N/A"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {reservation.guest?.email || "N/A"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {reservation.room?.room_type?.name}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={reservation.status === 'confirmed' ? 'secondary' : 'default'}>
                            {reservation.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Res #: {reservation.reservation_number}
                          </span>
                        </div>
                      </div>

                      {reservation.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => checkIn(reservation.id)}
                          disabled={isCheckingIn || isReconnecting}
                        >
                          <LogIn className="h-4 w-4 mr-1" />
                          Check In
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="departures" className="space-y-4 mt-4">
            {departures?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No departures scheduled for today
              </p>
            ) : (
              departures?.map((reservation: any) => (
                <Card key={reservation.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {reservation.guest?.first_name} {reservation.guest?.last_name}
                          </span>
                          {reservation.guest?.vip_status && (
                            <Badge variant="secondary">VIP</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Room {reservation.room?.room_number}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {reservation.guest?.phone || "N/A"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {reservation.guest?.email || "N/A"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Nights: {Math.ceil(
                              (new Date(reservation.check_out_date).getTime() - 
                               new Date(reservation.check_in_date).getTime()) / 
                              (1000 * 60 * 60 * 24)
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={reservation.status === 'checked_in' ? 'default' : 'secondary'}>
                            {reservation.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Total: ₦{reservation.total_amount?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>

                      {reservation.status === 'checked_in' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => checkOut(reservation.id)}
                          disabled={isCheckingOut || isReconnecting}
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          Check Out
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
