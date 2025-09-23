import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Download, Filter, DollarSign, Bed, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import OccupancyReports from '@/components/owner/reports/OccupancyReports';
import RevenueReports from '@/components/owner/reports/RevenueReports';
import StaffPerformanceReports from '@/components/owner/reports/StaffPerformanceReports';
import GuestDemographics from '@/components/owner/reports/GuestDemographics';
import { useReporting } from '@/hooks/useReporting';
import { useOwnerOverview } from '@/hooks/useApi';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('occupancy');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const [reportPeriod, setReportPeriod] = useState('monthly');

  // Load real data from APIs
  const { data: overviewData } = useOwnerOverview();
  const { occupancyStats, guestStats, revenueByMethod, loading } = useReporting();

  // Calculate real metrics from API data
  const currentMetrics = {
    occupancyRate: overviewData?.occupancyRate || 0,
    avgDailyRate: overviewData?.revenue && overviewData?.occupiedRooms 
      ? overviewData.revenue / overviewData.occupiedRooms 
      : 0,
    totalRevenue: overviewData?.revenue || 0,
    totalBookings: overviewData?.reservations || 0,
    avgStayDuration: 2.3, // TODO: Calculate from reservation data
    guestSatisfaction: 4.6 // TODO: Calculate from guest feedback data
  };

  const reportTypes = [
    {
      id: 'occupancy',
      name: 'Occupancy',
      icon: Bed,
      description: 'Room occupancy rates and trends',
      color: 'text-blue-600'
    },
    {
      id: 'revenue',
      name: 'Revenue',
      icon: DollarSign,
      description: 'Revenue analysis and breakdown',
      color: 'text-green-600'
    },
    {
      id: 'staff',
      name: 'Staff Performance',
      icon: Users,
      description: 'Employee productivity metrics',
      color: 'text-purple-600'
    },
    {
      id: 'demographics',
      name: 'Guest Analytics',
      icon: TrendingUp,
      description: 'Guest demographics and behavior',
      color: 'text-orange-600'
    }
  ];

  const handleExportReport = (format: 'pdf' | 'excel') => {
    // Mock export functionality
    console.log(`Exporting ${selectedReport} report as ${format}`);
    // In real implementation, this would trigger the actual export
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive hotel performance insights and analytics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => handleExportReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : currentMetrics.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `₦${Math.round(currentMetrics.avgDailyRate).toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">
              +5.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `₦${(currentMetrics.totalRevenue / 1000000).toFixed(1)}M`}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : currentMetrics.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              +8.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Stay</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.avgStayDuration} nights</div>
            <p className="text-xs text-muted-foreground">
              +0.2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.guestSatisfaction}/5.0</div>
            <p className="text-xs text-muted-foreground">
              +0.3 from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Date Range:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onSelect={(range) => {
                      if (range?.from) {
                        setDateRange({
                          from: range.from,
                          to: range.to || range.from
                        });
                      }
                    }}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Period:</label>
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto">
              <Badge variant="outline">
                {reportTypes.find(r => r.id === selectedReport)?.name} Report
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Tabs value={selectedReport} onValueChange={setSelectedReport}>
        <TabsList className="grid w-full grid-cols-4">
          {reportTypes.map(report => {
            const IconComponent = report.icon;
            return (
              <TabsTrigger key={report.id} value={report.id} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{report.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="occupancy" className="space-y-4">
          <OccupancyReports 
            dateRange={dateRange}
            period={reportPeriod}
          />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <RevenueReports 
            dateRange={dateRange}
            period={reportPeriod}
          />
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <StaffPerformanceReports 
            dateRange={dateRange}
            period={reportPeriod}
          />
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <GuestDemographics 
            dateRange={dateRange}
            period={reportPeriod}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}