// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  Users, 
  Star, 
  Calendar, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  UserCheck
} from "lucide-react";
import { useGuests } from "@/hooks/useGuests";
import { useCurrency } from "@/hooks/useCurrency";

export default function GuestAnalytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const { data: guests = [] } = useGuests();
  const { formatPrice } = useCurrency();

  // Calculate analytics from real guest data
  const analytics = {
    totalGuests: guests.length,
    newGuestsThisMonth: guests.filter(guest => {
      const createdDate = new Date(guest.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdDate >= thirtyDaysAgo;
    }).length,
    totalRevenue: guests.reduce((sum, guest) => sum + (guest.total_spent || 0), 0),
    averageSpentPerGuest: guests.length > 0 ? guests.reduce((sum, guest) => sum + (guest.total_spent || 0), 0) / guests.length : 0,
    repeatGuests: guests.filter(guest => (guest.total_stays || 0) > 1).length,
    vipGuests: guests.filter(guest => guest.vip_status !== 'regular').length,
    topSpenders: guests
      .filter(guest => guest.total_spent > 0)
      .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
      .slice(0, 5),
    loyaltyDistribution: {
      regular: guests.filter(g => g.vip_status === 'regular').length,
      silver: guests.filter(g => g.vip_status === 'silver').length,
      gold: guests.filter(g => g.vip_status === 'gold').length,
      vip: guests.filter(g => g.vip_status === 'vip').length,
    }
  };

  const retentionRate = analytics.totalGuests > 0 ? (analytics.repeatGuests / analytics.totalGuests) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Guest Analytics</h2>
          <p className="text-muted-foreground">Insights into guest behavior and revenue trends</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Guests</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{analytics.newGuestsThisMonth}</p>
                  <Badge variant="secondary" className="text-green-600">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +12%
                  </Badge>
                </div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Guest Retention</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{retentionRate.toFixed(1)}%</p>
                  <Badge variant="secondary" className="text-green-600">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +5%
                  </Badge>
                </div>
              </div>
              <Repeat className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Revenue/Guest</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{formatPrice(analytics.averageSpentPerGuest)}</p>
                  <Badge variant="secondary" className="text-red-600">
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                    -2%
                  </Badge>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">VIP Guests</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{analytics.vipGuests}</p>
                  <Badge variant="secondary" className="text-green-600">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +8%
                  </Badge>
                </div>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spenders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Spending Guests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topSpenders.length > 0 ? (
                analytics.topSpenders.map((guest, index) => (
                  <div key={guest.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{guest.first_name} {guest.last_name}</p>
                        <p className="text-sm text-muted-foreground">{guest.total_stays || 0} stays</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(guest.total_spent || 0)}</p>
                      <Badge variant="outline" className="text-xs">
                        {guest.vip_status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4" />
                  <p>No revenue data available yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Loyalty Tier Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">Regular</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{analytics.loyaltyDistribution.regular}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({analytics.totalGuests > 0 ? ((analytics.loyaltyDistribution.regular / analytics.totalGuests) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-950/20">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                  <span className="font-medium">Silver</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{analytics.loyaltyDistribution.silver}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({analytics.totalGuests > 0 ? ((analytics.loyaltyDistribution.silver / analytics.totalGuests) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium">Gold</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{analytics.loyaltyDistribution.gold}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({analytics.totalGuests > 0 ? ((analytics.loyaltyDistribution.gold / analytics.totalGuests) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                  <span className="font-medium">VIP</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{analytics.loyaltyDistribution.vip}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({analytics.totalGuests > 0 ? ((analytics.loyaltyDistribution.vip / analytics.totalGuests) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{formatPrice(analytics.totalRevenue)}</div>
              <div className="text-muted-foreground">Total Guest Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{analytics.repeatGuests}</div>
              <div className="text-muted-foreground">Repeat Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {analytics.totalGuests > 0 ? (guests.reduce((sum, guest) => sum + (guest.total_stays || 0), 0) / analytics.totalGuests).toFixed(1) : 0}
              </div>
              <div className="text-muted-foreground">Avg Stays per Guest</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}