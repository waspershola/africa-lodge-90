import React from 'react';
import { SystemMonitoring } from '@/components/sa/SystemMonitoring';
import { EdgeFunctionMonitoring } from '@/components/sa/EdgeFunctionMonitoring';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Metrics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Production Monitoring</h1>
        <p className="text-muted-foreground">
          Comprehensive system monitoring and observability dashboard
        </p>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="functions">Edge Functions</TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <SystemMonitoring />
        </TabsContent>

        <TabsContent value="functions">
          <EdgeFunctionMonitoring />
        </TabsContent>
      </Tabs>
    </div>
  );
}

      {/* KPI Cards */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="modern-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{metrics.overview.totalTenants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.overview.activeTenants} active
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Monthly Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{metrics.overview.monthlyActiveUsers.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">
              +{metrics.overview.growthRate}% growth
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ₦{(metrics.overview.totalRevenue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-green-600 mt-1">
              +{metrics.overview.growthRate}% MoM
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Growth Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {metrics.overview.growthRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Monthly</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Tenant Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.trends.tenants}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#D32F2F" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.trends.revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`₦${(value / 1000000).toFixed(1)}M`, 'Revenue']} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#FFD700" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* System Backup Section */}
      <motion.div variants={fadeIn}>
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              System-Wide Backup & Recovery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Backup & Restore Options Grid */}
            <div className="space-y-6">
              {/* Backup Options */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Backup Options
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 text-center">
                      <Database className="h-8 w-8 mx-auto mb-3 text-primary" />
                      <h3 className="font-semibold mb-2">Platform Database</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Complete database backup including schemas, data, and configurations
                      </p>
                      <Button className="w-full" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Backup DB
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-accent/20 hover:border-accent/40 transition-colors">
                    <CardContent className="p-4 text-center">
                      <HardDrive className="h-8 w-8 mx-auto mb-3 text-accent" />
                      <h3 className="font-semibold mb-2">System Configuration</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Application settings, feature flags, and system configurations
                      </p>
                      <Button className="w-full" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Backup Config
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-warning/20 hover:border-warning/40 transition-colors">
                    <CardContent className="p-4 text-center">
                      <Shield className="h-8 w-8 mx-auto mb-3 text-warning" />
                      <h3 className="font-semibold mb-2">Full System Snapshot</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Complete platform snapshot including all tenant data
                      </p>
                      <Button className="w-full bg-gradient-primary shadow-luxury hover:shadow-hover">
                        <Download className="h-4 w-4 mr-2" />
                        Full Backup
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Restore Options */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Restore Options
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-2 border-dashed border-danger/20 hover:border-danger/40 transition-colors">
                    <CardContent className="p-4 text-center">
                      <Database className="h-8 w-8 mx-auto mb-3 text-danger" />
                      <h3 className="font-semibold mb-2">Database Restore</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Restore database from backup with rollback capabilities
                      </p>
                      <Button className="w-full" variant="destructive">
                        <Upload className="h-4 w-4 mr-2" />
                        Restore DB
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-warning/20 hover:border-warning/40 transition-colors">
                    <CardContent className="p-4 text-center">
                      <HardDrive className="h-8 w-8 mx-auto mb-3 text-warning" />
                      <h3 className="font-semibold mb-2">Config Restore</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Restore system settings and feature flags from backup
                      </p>
                      <Button className="w-full bg-warning hover:bg-warning/90 text-warning-foreground">
                        <Upload className="h-4 w-4 mr-2" />
                        Restore Config
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-danger/30 hover:border-danger/50 transition-colors">
                    <CardContent className="p-4 text-center">
                      <Shield className="h-8 w-8 mx-auto mb-3 text-danger" />
                      <h3 className="font-semibold mb-2">Full System Restore</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Complete system restore - requires maintenance mode
                      </p>
                      <Button className="w-full bg-gradient-to-r from-danger to-danger/80 shadow-lg hover:shadow-xl">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Full Restore
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Recent Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Backups */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Backups</h3>
                <div className="space-y-3">
                  {[
                    { type: 'Full System', date: '2024-09-18 02:00', size: '2.4 GB', status: 'completed' },
                    { type: 'Database', date: '2024-09-17 14:30', size: '890 MB', status: 'completed' },
                    { type: 'Configuration', date: '2024-09-17 09:15', size: '12 MB', status: 'completed' },
                  ].map((backup, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                          <Database className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{backup.type}</div>
                          <div className="text-sm text-muted-foreground">{backup.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-success/10 text-success border-success/20">
                          {backup.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{backup.size}</span>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Restores */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Restores</h3>
                <div className="space-y-3">
                  {[
                    { type: 'Configuration', date: '2024-09-16 11:45', status: 'completed', reason: 'Fix feature flags issue' },
                    { type: 'Database', date: '2024-09-15 08:30', status: 'completed', reason: 'Rollback migration error' },
                    { type: 'Full System', date: '2024-09-10 03:15', status: 'completed', reason: 'Major incident recovery' },
                  ].map((restore, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-warning/10 to-danger/10 flex items-center justify-center">
                          <RefreshCw className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          <div className="font-medium">{restore.type} Restore</div>
                          <div className="text-sm text-muted-foreground">{restore.date}</div>
                          <div className="text-xs text-muted-foreground">{restore.reason}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-success/10 text-success border-success/20">
                          {restore.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}