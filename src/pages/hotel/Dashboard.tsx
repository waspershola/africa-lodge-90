import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Users, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTenant } from '@/hooks/useApi';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function HotelDashboard() {
  const { tenantId } = useParams();
  const { data: tenantData, isLoading } = useTenant();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading hotel dashboard...</p>
        </div>
      </div>
    );
  }

  const tenant = tenantData;

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Hotel Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested hotel dashboard could not be found.</p>
          <Button asChild>
            <Link to="/sa/tenants">Return to Tenants</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Mock tenant data for demo purposes
  const mockTenant = {
    name: 'Demo Hotel',
    city: 'Lagos',
    status: 'active',
    totalRooms: 50,
    plan: 'Growth',
    offlineWindowHours: 24,
    slug: 'demo-hotel',
    contactEmail: 'contact@hotel.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/sa/tenants">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Super Admin
                </Link>
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold display-heading text-gradient">{mockTenant.name}</h1>
                  <p className="text-sm text-muted-foreground">{mockTenant.city}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <span className="mr-1">👑</span>
                Impersonating as Super Admin
              </Badge>
              <Badge variant={mockTenant.status === 'active' ? 'default' : 'secondary'}>
                {mockTenant.status}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div 
          className="space-y-8"
          initial="initial"
          animate="animate"
          variants={{
            animate: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {/* Welcome Message */}
          <motion.div variants={fadeIn}>
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 border border-primary/20">
              <h2 className="text-2xl font-bold mb-2">Welcome to {mockTenant.name} Dashboard</h2>
              <p className="text-muted-foreground">
                You are currently impersonating this hotel's dashboard as a Super Admin. 
                This is a simulation of what the hotel owner would see.
              </p>
            </div>
          </motion.div>

          {/* Stats Overview */}
          <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="modern-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Total Rooms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{mockTenant.totalRooms}</div>
                <p className="text-xs text-muted-foreground mt-1">Hotel capacity</p>
              </CardContent>
            </Card>

            <Card className="modern-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{mockTenant.plan}</div>
                <p className="text-xs text-muted-foreground mt-1">Subscription</p>
              </CardContent>
            </Card>

            <Card className="modern-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Offline Window
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{mockTenant.offlineWindowHours}h</div>
                <p className="text-xs text-muted-foreground mt-1">Allowed offline time</p>
              </CardContent>
            </Card>

            <Card className="modern-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent capitalize">{mockTenant.status}</div>
                <p className="text-xs text-muted-foreground mt-1">Account status</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Hotel Information */}
          <motion.div variants={fadeIn}>
            <Card className="modern-card">
              <CardHeader>
                <CardTitle>Hotel Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hotel Name:</span>
                      <span className="font-medium">{mockTenant.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">URL Slug:</span>
                      <span className="font-medium">{mockTenant.slug}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{mockTenant.city}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact Email:</span>
                      <span className="font-medium">{mockTenant.contactEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium">{new Date(mockTenant.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="font-medium">{new Date(mockTenant.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Simulation Notice */}
          <motion.div variants={fadeIn}>
            <Card className="modern-card border-amber-200 bg-amber-50/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🚧</div>
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-2">Demo Mode</h3>
                    <p className="text-amber-700 text-sm">
                      This is a simulated hotel dashboard for troubleshooting purposes. 
                      In a real implementation, this would show actual hotel operations data,
                      reservations, staff management, and all hotel-specific features based on their subscription plan.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}