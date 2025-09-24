import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Users, TrendingUp, Star, Calendar, DollarSign, 
  Filter, Download, Eye, MessageCircle, Heart, Award
} from "lucide-react";
import { useGuestAnalytics, GuestAnalytics } from "@/hooks/useGuestAnalytics";
import { motion } from "framer-motion";

interface GuestAnalyticsDashboardProps {
  onGuestSelect?: (guest: GuestAnalytics) => void;
}

export function GuestAnalyticsDashboard({ onGuestSelect }: GuestAnalyticsDashboardProps) {
  const { analytics, loading, pagination, loadGuestAnalytics, getTierMetrics } = useGuestAnalytics();
  const [filters, setFilters] = useState({
    searchTerm: '',
    tier: '',
    repeatGuest: undefined as boolean | undefined,
    minStays: 0,
    minSpending: 0
  });

  const metrics = getTierMetrics();

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadGuestAnalytics(newFilters, 1, 20, true);
  };

  const handleLoadMore = () => {
    loadGuestAnalytics(filters, pagination.page + 1, pagination.limit, false);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'VIP': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'Gold': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'Silver': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default: return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'VIP': return <Award className="h-4 w-4" />;
      case 'Gold': return <Star className="h-4 w-4" />;
      case 'Silver': return <Heart className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Guest Analytics</h2>
          <p className="text-muted-foreground">
            Analyze guest behavior, preferences, and lifetime value
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Send Campaign
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Guests</p>
                <p className="text-2xl font-bold">{metrics.totalGuests}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Repeat Guests</p>
                <p className="text-2xl font-bold">{metrics.repeatGuestRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Lifetime Value</p>
                <p className="text-2xl font-bold">₦{Math.round(metrics.averageLifetimeValue).toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₦{Math.round(metrics.totalRevenue).toLocaleString()}</p>
              </div>
              <Award className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Guest Tiers</CardTitle>
          <CardDescription>Distribution of guests by tier level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(metrics.tierCounts).map(([tier, count]) => (
              <div key={tier} className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {getTierIcon(tier)}
                </div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm text-muted-foreground">{tier} Guests</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search guests..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filters.tier} onValueChange={(value) => handleFilterChange('tier', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Tiers</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Standard">Standard</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.repeatGuest?.toString() || ''} 
              onValueChange={(value) => handleFilterChange('repeatGuest', value === '' ? undefined : value === 'true')}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Guests" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Guests</SelectItem>
                <SelectItem value="true">Repeat Guests</SelectItem>
                <SelectItem value="false">New Guests</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Min Stays"
              value={filters.minStays || ''}
              onChange={(e) => handleFilterChange('minStays', parseInt(e.target.value) || 0)}
            />

            <Input
              type="number"
              placeholder="Min Spending (₦)"
              value={filters.minSpending || ''}
              onChange={(e) => handleFilterChange('minSpending', parseInt(e.target.value) || 0)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Guest List */}
      <Card>
        <CardHeader>
          <CardTitle>Guest Directory</CardTitle>
          <CardDescription>
            {analytics.length} of {pagination.total} guests shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.map((guest, index) => (
              <motion.div
                key={guest.guest_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onGuestSelect?.(guest)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{guest.guest_name}</h4>
                      <Badge className={getTierColor(guest.guest_tier)}>
                        {getTierIcon(guest.guest_tier)}
                        <span className="ml-1">{guest.guest_tier}</span>
                      </Badge>
                      {guest.is_repeat_guest && (
                        <Badge variant="secondary">
                          <Heart className="h-3 w-3 mr-1" />
                          Repeat Guest
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Stays:</span> {guest.total_stays}
                      </div>
                      <div>
                        <span className="font-medium">Total Spent:</span> ₦{guest.total_spent.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Lifetime Value:</span> ₦{Math.round(guest.lifetime_value).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Avg Stay:</span> {guest.avg_stay_length.toFixed(1)} nights
                      </div>
                      <div>
                        <span className="font-medium">Preferred:</span> {guest.preferred_room_type}
                      </div>
                    </div>

                    {guest.last_stay_date && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Last stay: {new Date(guest.last_stay_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                </div>
              </motion.div>
            ))}

            {pagination.hasMore && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load More Guests"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}