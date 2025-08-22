import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Building2, 
  Star, 
  TrendingUp, 
  CreditCard, 
  UserPlus
} from 'lucide-react';
import GuestDirectory from '@/components/owner/guests/GuestDirectory';
import GuestProfile from '@/components/owner/guests/GuestProfile';
import NewGuestDialog from '@/components/owner/guests/NewGuestDialog';
import CorporateAccounts from '@/components/owner/guests/CorporateAccounts';
import { useGuests, useGuestStats } from '@/hooks/useApi';

export default function GuestsPage() {
  const [activeTab, setActiveTab] = useState('directory');
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [showNewGuestDialog, setShowNewGuestDialog] = useState(false);
  const [showGuestProfile, setShowGuestProfile] = useState(false);

  const { data: guestStats } = useGuestStats();

  const handleGuestSelect = (guest: any) => {
    setSelectedGuest(guest);
    setShowGuestProfile(true);
  };

  const stats = guestStats || {
    totalGuests: 0,
    vipGuests: 0,
    corporateAccounts: 0,
    totalRevenue: 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-gradient">
            Guest Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage guest profiles, corporate accounts, and booking history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Export List
          </Button>
          <Button 
            className="bg-gradient-primary" 
            size="sm"
            onClick={() => setShowNewGuestDialog(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Guest
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.totalGuests}</div>
                <div className="text-sm text-muted-foreground">Total Guests</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-1 text-sm text-success">
                <TrendingUp className="h-4 w-4" />
                <span>+12 this month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Star className="h-6 w-6 text-warning-foreground" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.vipGuests}</div>
                <div className="text-sm text-muted-foreground">VIP Guests</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">
                Gold & Silver tiers
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-accent-foreground" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.corporateAccounts}</div>
                <div className="text-sm text-muted-foreground">Corporate Accounts</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">
                Active contracts
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-success" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">₦{(stats.totalRevenue / 1000000).toFixed(1)}M</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground">
                From all guests
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="directory">Guest Directory</TabsTrigger>
          <TabsTrigger value="corporate">Corporate Accounts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="directory">
          <GuestDirectory 
            onGuestSelect={handleGuestSelect}
            onNewGuest={() => setShowNewGuestDialog(true)}
          />
        </TabsContent>

        <TabsContent value="corporate">
          <CorporateAccounts />
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle>Guest Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                <div className="text-lg font-medium mb-2">Analytics Dashboard</div>
                <div className="text-sm">
                  Guest insights, loyalty trends, and revenue analytics coming soon
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showNewGuestDialog && (
        <NewGuestDialog
          onClose={() => setShowNewGuestDialog(false)}
          onGuestCreated={(guest) => {
            setShowNewGuestDialog(false);
            handleGuestSelect(guest);
          }}
        />
      )}

      {showGuestProfile && selectedGuest && (
        <GuestProfile
          guest={selectedGuest}
          onClose={() => setShowGuestProfile(false)}
          onUpdate={(updatedGuest) => {
            setSelectedGuest(updatedGuest);
          }}
        />
      )}
    </div>
  );
}