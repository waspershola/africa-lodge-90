import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search,
  Phone,
  Mail,
  Calendar,
  Star,
  Eye,
  Users
} from 'lucide-react';
import { useGuests } from '@/hooks/useApi';
import { format } from 'date-fns';

interface GuestDirectoryProps {
  onGuestSelect: (guest: any) => void;
  onNewGuest: () => void;
}

export default function GuestDirectory({ onGuestSelect, onNewGuest }: GuestDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: guests = [], isLoading } = useGuests();

  const filteredGuests = guests.filter(guest => 
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-center py-8">Loading guests...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuests.map((guest) => (
          <Card key={guest.id} className="luxury-card cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {guest.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {guest.name}
                    {guest.loyaltyTier && <Star className="h-4 w-4 text-yellow-500" />}
                  </div>
                  <div className="text-sm text-muted-foreground">{guest.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <div className="font-bold">{guest.totalStays}</div>
                  <div className="text-xs text-muted-foreground">Stays</div>
                </div>
                <div>
                  <div className="font-bold">{guest.totalNights}</div>
                  <div className="text-xs text-muted-foreground">Nights</div>
                </div>
                <div>
                  <div className="font-bold">₦{(guest.totalSpent / 1000).toFixed(0)}K</div>
                  <div className="text-xs text-muted-foreground">Spent</div>
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4"
                onClick={() => onGuestSelect(guest)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Profile
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGuests.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <div className="text-lg font-medium text-muted-foreground mb-2">No guests found</div>
            <Button onClick={onNewGuest}>
              <Calendar className="h-4 w-4 mr-2" />
              Add First Guest
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}