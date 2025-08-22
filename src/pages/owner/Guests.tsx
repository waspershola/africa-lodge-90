import React, { useState } from 'react';
import { Users, Plus, Search, Filter, Star, Calendar, Phone, Mail, MapPin, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import GuestDirectory from '@/components/owner/guests/GuestDirectory';
import GuestProfile from '@/components/owner/guests/GuestProfile';
import NewGuestDialog from '@/components/owner/guests/NewGuestDialog';

export default function GuestsPage() {
  const [view, setView] = useState('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loyaltyFilter, setLoyaltyFilter] = useState('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);

  // Mock guest statistics
  const guestStats = {
    totalGuests: 1247,
    activeGuests: 89,
    vipGuests: 156,
    newThisMonth: 67,
    returningGuests: 234,
    avgStayDuration: 2.8
  };

  const recentGuests = [
    {
      id: 'G001',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+234 801 234 5678',
      status: 'checked-in',
      room: '205',
      checkIn: new Date(),
      loyalty: 'gold',
      avatar: 'JS'
    },
    {
      id: 'G002',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@email.com',
      phone: '+234 802 345 6789',
      status: 'checked-out',
      room: '312',
      checkIn: new Date(Date.now() - 86400000),
      loyalty: 'platinum',
      avatar: 'SW'
    },
    {
      id: 'G003',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+234 803 456 7890',
      status: 'upcoming',
      room: '108',
      checkIn: new Date(Date.now() + 86400000),
      loyalty: 'silver',
      avatar: 'MC'
    }
  ];

  const loyaltyPrograms = [
    { level: 'bronze', name: 'Bronze Member', count: 456, color: 'bg-amber-100 text-amber-800' },
    { level: 'silver', name: 'Silver Member', count: 234, color: 'bg-gray-100 text-gray-800' },
    { level: 'gold', name: 'Gold Member', count: 123, color: 'bg-yellow-100 text-yellow-800' },
    { level: 'platinum', name: 'Platinum Member', count: 67, color: 'bg-purple-100 text-purple-800' }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked-in':
        return <Badge className="bg-green-100 text-green-800">Checked In</Badge>;
      case 'checked-out':
        return <Badge variant="secondary">Checked Out</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLoyaltyBadge = (loyalty: string) => {
    const program = loyaltyPrograms.find(p => p.level === loyalty);
    if (!program) return null;
    
    return <Badge className={program.color}>{program.name}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Guest Management</h1>
          <p className="text-muted-foreground">
            Manage guest profiles, preferences, and loyalty programs
          </p>
        </div>
        
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Guest
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guestStats.totalGuests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Registered in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Guests</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{guestStats.activeGuests}</div>
            <p className="text-xs text-muted-foreground">
              Currently in house
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Guests</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{guestStats.vipGuests}</div>
            <p className="text-xs text-muted-foreground">
              Platinum & Gold members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{guestStats.newThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              First-time visitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returning Guests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{guestStats.returningGuests}</div>
            <p className="text-xs text-muted-foreground">
              Repeat customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Stay</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guestStats.avgStayDuration} nights</div>
            <p className="text-xs text-muted-foreground">
              Average duration
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
                      placeholder="Search guests..."
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
                    <SelectItem value="checked-in">Checked In</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="past-guest">Past Guest</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={loyaltyFilter} onValueChange={setLoyaltyFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Loyalty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="bronze">Bronze</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Button 
                    variant={view === 'directory' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setView('directory')}
                  >
                    Directory
                  </Button>
                  <Button 
                    variant={view === 'analytics' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setView('analytics')}
                  >
                    Analytics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest Content */}
          <Tabs value={view} onValueChange={setView}>
            <TabsContent value="directory">
              <GuestDirectory 
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                loyaltyFilter={loyaltyFilter}
                onGuestSelect={setSelectedGuest}
              />
            </TabsContent>

            <TabsContent value="analytics">
              <div className="space-y-6">
                {/* Loyalty Program Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Loyalty Program Distribution</CardTitle>
                    <CardDescription>
                      Guest distribution across loyalty levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {loyaltyPrograms.map(program => (
                        <Card key={program.level}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className={`inline-flex px-2 py-1 rounded text-sm font-medium ${program.color}`}>
                                  {program.name}
                                </div>
                                <div className="text-2xl font-bold mt-2">{program.count}</div>
                              </div>
                              <Star className="h-8 w-8 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Additional analytics cards can be added here */}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest guest check-ins and activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentGuests.map(guest => (
                <div key={guest.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{guest.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{guest.name}</div>
                    <div className="text-xs text-muted-foreground">Room {guest.room}</div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(guest.status)}
                    <div className="text-xs text-muted-foreground mt-1">
                      {getLoyaltyBadge(guest.loyalty)}
                    </div>
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
                <Star className="h-4 w-4 mr-2" />
                VIP Guest List
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send Newsletter
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Birthday Alerts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <NewGuestDialog 
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
      />

      {selectedGuest && (
        <GuestProfile
          guest={selectedGuest}
          open={!!selectedGuest}
          onOpenChange={() => setSelectedGuest(null)}
        />
      )}
    </div>
  );
}