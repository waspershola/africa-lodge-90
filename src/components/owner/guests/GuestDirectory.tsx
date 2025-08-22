import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Users, Phone, Mail, MapPin, MoreHorizontal, Star } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  currentStatus: 'active' | 'upcoming' | 'past-guest';
  preferences: string[];
  vip: boolean;
}

interface GuestDirectoryProps {
  searchTerm: string;
  statusFilter: string;
  loyaltyFilter: string;
  onGuestSelect: (guest: Guest) => void;
}

export default function GuestDirectory({ 
  searchTerm, 
  statusFilter, 
  loyaltyFilter, 
  onGuestSelect 
}: GuestDirectoryProps) {
  // Mock guest data
  const mockGuests: Guest[] = [
    {
      id: 'G001',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+234 801 234 5678',
      loyaltyLevel: 'gold',
      totalStays: 12,
      totalSpent: 2450000,
      lastVisit: new Date(2024, 6, 15),
      nextVisit: new Date(2024, 8, 20),
      currentStatus: 'upcoming',
      preferences: ['Non-smoking', 'High floor', 'Late checkout'],
      vip: true
    },
    {
      id: 'G002',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@email.com',
      phone: '+234 802 345 6789',
      loyaltyLevel: 'platinum',
      totalStays: 23,
      totalSpent: 4850000,
      lastVisit: new Date(2024, 7, 10),
      currentStatus: 'active',
      preferences: ['Ocean view', 'Extra pillows', 'Room service'],
      vip: true
    },
    {
      id: 'G003',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+234 803 456 7890',
      loyaltyLevel: 'silver',
      totalStays: 7,
      totalSpent: 1280000,
      lastVisit: new Date(2024, 5, 28),
      currentStatus: 'past-guest',
      preferences: ['Gym access', 'Business center'],
      vip: false
    },
    {
      id: 'G004',
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '+234 804 567 8901',
      loyaltyLevel: 'bronze',
      totalStays: 3,
      totalSpent: 450000,
      lastVisit: new Date(2024, 3, 12),
      currentStatus: 'past-guest',
      preferences: ['Quiet room', 'Early checkin'],
      vip: false
    },
    {
      id: 'G005',
      name: 'David Brown',
      email: 'david.brown@email.com',
      phone: '+234 805 678 9012',
      loyaltyLevel: 'gold',
      totalStays: 15,
      totalSpent: 3200000,
      lastVisit: new Date(2024, 7, 5),
      currentStatus: 'past-guest',
      preferences: ['Spa access', 'Airport pickup', 'King bed'],
      vip: true
    }
  ];

  const filteredGuests = mockGuests.filter(guest => {
    const matchesSearch = searchTerm === '' || 
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || guest.currentStatus === statusFilter;
    const matchesLoyalty = loyaltyFilter === 'all' || guest.loyaltyLevel === loyaltyFilter;
    
    return matchesSearch && matchesStatus && matchesLoyalty;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>;
      case 'past-guest':
        return <Badge variant="secondary">Past Guest</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Guest Directory</span>
          <Badge variant="outline">
            {filteredGuests.length} guest{filteredGuests.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredGuests.map(guest => (
            <Card key={guest.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{getInitials(guest.name)}</AvatarFallback>
                    </Avatar>
                    {guest.vip && (
                      <Star className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 
                            className="font-semibold text-lg hover:text-primary cursor-pointer"
                            onClick={() => onGuestSelect(guest)}
                          >
                            {guest.name}
                            {guest.vip && <Star className="inline h-4 w-4 text-yellow-500 ml-1" />}
                          </h3>
                          {getStatusBadge(guest.currentStatus)}
                          {getLoyaltyBadge(guest.loyaltyLevel)}
                        </div>
                        <p className="text-sm text-muted-foreground">#{guest.id}</p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          ₦{guest.totalSpent.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {guest.totalStays} stay{guest.totalStays !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{guest.email}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{guest.phone}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Last visit: {format(guest.lastVisit, 'MMM dd, yyyy')}</span>
                      </div>
                    </div>

                    {guest.preferences.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Preferences:</span>
                        <div className="flex flex-wrap gap-1">
                          {guest.preferences.slice(0, 3).map((pref, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {pref}
                            </Badge>
                          ))}
                          {guest.preferences.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{guest.preferences.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {guest.nextVisit && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <span className="text-blue-600 font-medium">
                          Next visit: {format(guest.nextVisit, 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Guest since {format(new Date(guest.lastVisit.getFullYear() - Math.floor(guest.totalStays / 4), 0, 1), 'yyyy')}</span>
                        <span>•</span>
                        <span>Avg: ₦{Math.round(guest.totalSpent / guest.totalStays).toLocaleString()}/stay</span>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onGuestSelect(guest)}>
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>Edit Guest</DropdownMenuItem>
                          <DropdownMenuItem>Send Message</DropdownMenuItem>
                          <DropdownMenuItem>View History</DropdownMenuItem>
                          <DropdownMenuItem>Create Reservation</DropdownMenuItem>
                          {!guest.vip && (
                            <DropdownMenuItem>Upgrade to VIP</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredGuests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No guests found matching your criteria.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}