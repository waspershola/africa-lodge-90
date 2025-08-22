import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, MapPin, Star } from 'lucide-react';

interface GuestProfileProps {
  guest: any;
  onClose: () => void;
  onUpdate: (updatedGuest: any) => void;
}

export default function GuestProfile({ guest, onClose, onUpdate }: GuestProfileProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Guest Profile - {guest.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {guest.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {guest.name}
                    {guest.loyaltyTier && <Star className="h-5 w-5 text-yellow-500" />}
                  </h3>
                  <Badge className={getStatusColor(guest.status)}>
                    {guest.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guest Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{guest.totalStays}</div>
                  <div className="text-sm text-muted-foreground">Total Stays</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{guest.totalNights}</div>
                  <div className="text-sm text-muted-foreground">Total Nights</div>
                </div>
                <div>
                  <div className="text-xl font-bold">₦{(guest.totalSpent / 1000).toFixed(0)}K</div>
                  <div className="text-sm text-muted-foreground">Total Spent</div>
                </div>
                <div>
                  <div className="text-xl font-bold">₦{(guest.avgSpendPerStay / 1000).toFixed(0)}K</div>
                  <div className="text-sm text-muted-foreground">Avg Per Stay</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close Profile</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}