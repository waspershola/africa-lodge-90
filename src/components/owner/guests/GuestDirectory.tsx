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
  Users,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import { useGuests } from '@/hooks/useGuests';
import { format } from 'date-fns';

interface GuestDirectoryProps {
  onGuestSelect: (guest: any) => void;
  onNewGuest: () => void;
}

export default function GuestDirectory({ onGuestSelect, onNewGuest }: GuestDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');  
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const { data: guests = [], isLoading, error } = useGuests();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'blacklist': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const filteredGuests = guests
    .filter(guest => {
      const fullName = `${guest.first_name} ${guest.last_name}`;
      const matchesSearch = fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.phone?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all'; // All guests are active in our new schema
      const matchesTier = tierFilter === 'all' || guest.vip_status === tierFilter;
      return matchesSearch && matchesStatus && matchesTier;
    })
    .sort((a, b) => {
      const fullNameA = `${a.first_name} ${a.last_name}`;
      const fullNameB = `${b.first_name} ${b.last_name}`;
      
      switch (sortBy) {
        case 'name': return fullNameA?.localeCompare(fullNameB || '') || 0;
        case 'totalSpent': return (b.total_spent || 0) - (a.total_spent || 0);
        case 'totalStays': return (b.total_stays || 0) - (a.total_stays || 0);
        case 'lastStay': 
          const dateA = a.last_stay_date ? new Date(a.last_stay_date).getTime() : 0;
          const dateB = b.last_stay_date ? new Date(b.last_stay_date).getTime() : 0;
          return dateB - dateA;
        default: return 0;
      }
    });

  if (isLoading) {
    return <div className="text-center py-8">Loading guests...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="luxury-card">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="blacklist">Blacklist</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="totalSpent">Total Spent</SelectItem>
                  <SelectItem value="totalStays">Total Stays</SelectItem>
                  <SelectItem value="lastStay">Last Stay</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                    {`${guest.first_name[0]}${guest.last_name[0]}`.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2 mb-1">
                    {guest.first_name} {guest.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">{guest.email}</div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="default"
                      className="bg-success/10 text-success border-success/20"
                    >
                      Active
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {guest.vip_status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <div className="font-bold">{guest.total_stays || 0}</div>
                  <div className="text-xs text-muted-foreground">Stays</div>
                </div>
                <div>
                  <div className="font-bold">₦{(guest.total_spent || 0).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Spent</div>
                </div>
                <div>
                  <div className="font-bold">{guest.last_stay_date ? format(new Date(guest.last_stay_date), 'MMM yyyy') : 'Never'}</div>
                  <div className="text-xs text-muted-foreground">Last Stay</div>
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