import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Phone, MapPin, Star, Calendar, CreditCard, StickyNote, Plus } from 'lucide-react';
import GuestBookingHistory from './GuestBookingHistory';
import GuestNotesManager from './GuestNotesManager';

interface GuestProfileProps {
  guest: any;
  onClose: () => void;
  onUpdate: (updatedGuest: any) => void;
}

export default function GuestProfile({ guest, onClose, onUpdate }: GuestProfileProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'blacklist': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Guest Profile - {guest.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full overflow-hidden">
          {/* Guest Header */}
          <Card className="luxury-card mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {guest.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      {guest.name}
                      {guest.loyaltyTier && <Star className="h-5 w-5 text-warning-foreground" />}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Reservation
                      </Button>
                      <Button variant="outline" size="sm">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Record Payment
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className={getStatusColor(guest.status)} variant="outline">
                      {guest.status.toUpperCase()}
                    </Badge>
                    {guest.loyaltyTier && (
                      <Badge variant="secondary">
                        {guest.loyaltyTier.toUpperCase()} TIER
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{guest.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{guest.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{guest.nationality}</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold">{guest.totalStays}</div>
                  <div className="text-sm text-muted-foreground">Total Stays</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{guest.totalNights}</div>
                  <div className="text-sm text-muted-foreground">Total Nights</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">₦{(guest.totalSpent / 1000).toFixed(0)}K</div>
                  <div className="text-sm text-muted-foreground">Total Spent</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">₦{(guest.avgSpendPerStay / 1000).toFixed(0)}K</div>
                  <div className="text-sm text-muted-foreground">Avg Per Stay</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bookings">Booking History</TabsTrigger>
              <TabsTrigger value="notes">Notes & Preferences</TabsTrigger>
            </TabsList>

            <div className="mt-6 overflow-auto">
              <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="luxury-card">
                    <CardHeader>
                      <CardTitle>Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Member Since</span>
                          <span className="font-medium">Jan 2023</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Stay</span>
                          <span className="font-medium">Jan 15, 2024</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Rating</span>
                          <span className="font-medium flex items-center gap-1">
                            4.8 <Star className="h-4 w-4 text-warning-foreground" />
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Outstanding Balance</span>
                          <span className="font-medium">₦0</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="luxury-card">
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Completed stay in Room 301 (Jan 15-18)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span>Payment received: ₦450,000</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Star className="h-4 w-4 text-muted-foreground" />
                          <span>Upgraded to Silver tier</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="bookings">
                <GuestBookingHistory guestId={guest.id} />
              </TabsContent>

              <TabsContent value="notes">
                <GuestNotesManager guestId={guest.id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex justify-end pt-4 border-t mt-6">
          <Button onClick={onClose}>Close Profile</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}