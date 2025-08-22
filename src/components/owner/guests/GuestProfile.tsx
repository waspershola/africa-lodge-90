import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, Phone, Mail, MapPin, Star, CreditCard, FileText, Heart } from 'lucide-react';
import { format } from 'date-fns';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyLevel: string;
  totalStays: number;
  totalSpent: number;
  lastVisit: Date;
  nextVisit?: Date;
  currentStatus: string;
  preferences: string[];
  vip: boolean;
}

interface GuestProfileProps {
  guest: Guest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GuestProfile({ guest, open, onOpenChange }: GuestProfileProps) {
  if (!guest) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getLoyaltyBadge = (level: string) => {
    const colors = {
      platinum: 'bg-purple-100 text-purple-800',
      gold: 'bg-yellow-100 text-yellow-800',
      silver: 'bg-gray-100 text-gray-800',
      bronze: 'bg-amber-100 text-amber-800'
    };
    
    return (
      <Badge className={colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {level.charAt(0).toUpperCase() + level.slice(1)} Member
      </Badge>
    );
  };

  // Mock stay history
  const stayHistory = [
    {
      id: 'RES001',
      checkIn: new Date(2024, 6, 15),
      checkOut: new Date(2024, 6, 18),
      room: '205',
      roomType: 'Deluxe King',
      amount: 450000,
      status: 'completed'
    },
    {
      id: 'RES002',
      checkIn: new Date(2024, 4, 22),
      checkOut: new Date(2024, 4, 25),
      room: '312',
      roomType: 'Standard Twin',
      amount: 285000,
      status: 'completed'
    },
    {
      id: 'RES003',
      checkIn: new Date(2024, 2, 8),
      checkOut: new Date(2024, 2, 12),
      room: '108',
      roomType: 'Family Suite',
      amount: 680000,
      status: 'completed'
    }
  ];

  // Mock loyalty benefits
  const loyaltyBenefits = [
    'Complimentary room upgrade',
    'Late checkout until 2 PM',
    'Welcome amenity',
    'Priority reservation',
    'Express check-in/out'
  ];

  // Mock notes
  const guestNotes = [
    {
      date: new Date(2024, 6, 15),
      author: 'Front Desk',
      note: 'Guest prefers high floor rooms with city view. Very friendly and appreciative of service.'
    },
    {
      date: new Date(2024, 4, 22),
      author: 'Concierge',
      note: 'Requested restaurant recommendations for vegetarian cuisine. Provided list of nearby options.'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{getInitials(guest.name)}</AvatarFallback>
              </Avatar>
              {guest.vip && (
                <Star className="absolute -top-1 -right-1 h-5 w-5 text-yellow-500 fill-current" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                {guest.name}
                {guest.vip && <Badge className="bg-yellow-100 text-yellow-800">VIP</Badge>}
                {getLoyaltyBadge(guest.loyaltyLevel)}
              </div>
              <div className="text-sm text-muted-foreground font-normal">
                Guest #{guest.id} • Member since 2022
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{guest.email}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{guest.phone}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Lagos, Nigeria</span>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Emergency Contact</h4>
                <div className="text-sm space-y-1">
                  <div>Jane Smith (Spouse)</div>
                  <div className="text-muted-foreground">+234 801 111 2222</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Guest Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">{guest.totalStays}</div>
                  <div className="text-sm text-muted-foreground">Total Stays</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">₦{guest.totalSpent.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Spent</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">2.4</div>
                  <div className="text-sm text-muted-foreground">Avg Stay (nights)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">₦{Math.round(guest.totalSpent / guest.totalStays).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Avg Per Stay</div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Last Visit</span>
                </div>
                <div className="text-sm">{format(guest.lastVisit, 'PPPP')}</div>
              </div>

              {guest.nextVisit && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-blue-600">Next Visit</span>
                  </div>
                  <div className="text-sm">{format(guest.nextVisit, 'PPPP')}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preferences & Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Room Preferences</h4>
                  <div className="flex flex-wrap gap-1">
                    {guest.preferences.map((pref, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {pref}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Dietary Restrictions</h4>
                  <div className="text-sm text-muted-foreground">
                    Vegetarian, No nuts
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Special Occasions</h4>
                  <div className="text-sm text-muted-foreground">
                    Birthday: March 15th<br />
                    Anniversary: June 20th
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loyalty Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Loyalty Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {loyaltyBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Heart className="h-3 w-3 text-green-500" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stay History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Stay History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stayHistory.map((stay) => (
                <div key={stay.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">#{stay.id}</span>
                      <Badge variant="outline" className="text-xs">
                        {stay.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(stay.checkIn, 'MMM dd')} - {format(stay.checkOut, 'MMM dd, yyyy')} • Room {stay.room} ({stay.roomType})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">₦{stay.amount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.ceil((stay.checkOut.getTime() - stay.checkIn.getTime()) / (1000 * 60 * 60 * 24))} nights
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Guest Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Guest Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {guestNotes.map((note, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{note.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(note.date, 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{note.note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button size="sm">Create Reservation</Button>
          <Button variant="outline" size="sm">Edit Profile</Button>
          <Button variant="outline" size="sm">Send Message</Button>
          <Button variant="outline" size="sm">Add Note</Button>
          <Button variant="outline" size="sm">View Invoices</Button>
          {!guest.vip && (
            <Button variant="outline" size="sm">Upgrade to VIP</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}