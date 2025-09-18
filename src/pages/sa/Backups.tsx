import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Download, 
  Upload, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Play,
  Pause,
  Trash2,
  Eye,
  Plus,
  Search,
  Filter,
  Building2,
  CalendarDays,
  HardDrive,
  Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { DataEmpty } from '@/components/ui/data-empty';
import { useBackupJobs, useCreateBackup, useRestoreBackup, useDeleteBackup, useTenants } from '@/hooks/useApi';
import { formatDistanceToNow } from 'date-fns';

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

interface BackupJob {
  id: string;
  tenantId: string;
  tenantName: string;
  type: 'full' | 'incremental' | 'database' | 'files';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  size: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  errorMessage?: string;
  metadata: {
    triggeredBy: string;
    reason: string;
    includeFiles: boolean;
    includeDatabase: boolean;
    retention: string;
  };
}

export default function Backups() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createBackupOpen, setCreateBackupOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupJob | null>(null);
  const [activeTab, setActiveTab] = useState('backups');

  const { data: backupsData, isLoading, error, refetch } = useBackupJobs();
  const { data: tenantsData } = useTenants();
  const createBackup = useCreateBackup();
  const restoreBackup = useRestoreBackup();
  const deleteBackup = useDeleteBackup();

  if (isLoading) return <LoadingState message="Loading backup jobs..." />;
  if (error) return <ErrorState message="Failed to load backup jobs" onRetry={refetch} />;

  const backups = backupsData?.data || [];
  const tenants = tenantsData?.data || [];

  const filteredBackups = backups.filter((backup: any) => {
    const matchesSearch = backup.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         backup.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || backup.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-blue-100 text-blue-800',
      running: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-success/10 text-success border-success/20',
      failed: 'bg-danger/10 text-danger border-danger/20',
      cancelled: 'bg-muted/10 text-muted-foreground border-muted/20'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-muted/10 text-muted-foreground border-muted/20'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      full: 'bg-primary/10 text-primary border-primary/20',
      incremental: 'bg-accent/10 text-accent border-accent/20',
      database: 'bg-warning/10 text-warning border-warning/20',
      files: 'bg-success/10 text-success border-success/20'
    };
    
    return (
      <Badge className={variants[type as keyof typeof variants] || 'bg-muted/10 text-muted-foreground border-muted/20'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleCreateBackup = async (data: any) => {
    try {
      await createBackup.mutateAsync(data);
      setCreateBackupOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRestore = async (backupId: string, options: any) => {
    try {
      await restoreBackup.mutateAsync({ backupId, ...options });
      setRestoreModalOpen(false);
      setSelectedBackup(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async (backupId: string) => {
    if (confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      try {
        await deleteBackup.mutateAsync(backupId);
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const runningBackups = backups.filter((b: any) => b.status === 'running');
  const completedBackups = backups.filter((b: any) => b.status === 'completed');
  const failedBackups = backups.filter((b: any) => b.status === 'failed');

  return (
    <motion.div 
      className="space-y-6"
      variants={staggerChildren}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={fadeIn}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold display-heading text-gradient mb-1">Backup & Restore</h1>
            <p className="text-muted-foreground">Manage tenant data backups and restoration processes</p>
          </div>
          <Dialog open={createBackupOpen} onOpenChange={setCreateBackupOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-luxury hover:shadow-hover">
                <Plus className="h-4 w-4 mr-2" />
                Create Backup
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Backup</DialogTitle>
                <DialogDescription>
                  Configure backup settings for a tenant
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Tenant</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose tenant..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant: any) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {tenant.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Backup Type</Label>
                  <Select defaultValue="full">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Backup</SelectItem>
                      <SelectItem value="incremental">Incremental</SelectItem>
                      <SelectItem value="database">Database Only</SelectItem>
                      <SelectItem value="files">Files Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reason</Label>
                  <Textarea placeholder="Reason for creating this backup..." />
                </div>
                <div>
                  <Label>Retention Period</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCreateBackupOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleCreateBackup({})}>
                    Start Backup
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="modern-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Backups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{backups.length}</div>
          </CardContent>
        </Card>
        
        <Card className="modern-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Running</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{runningBackups.length}</div>
          </CardContent>
        </Card>
        
        <Card className="modern-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{completedBackups.length}</div>
          </CardContent>
        </Card>
        
        <Card className="modern-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{failedBackups.length}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeIn}>
        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search backups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Backup Jobs Table */}
      <motion.div variants={fadeIn}>
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Backup Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBackups.length === 0 ? (
              <DataEmpty 
                message="No backup jobs found"
                description="Create your first backup to get started"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBackups.map((backup: any) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{backup.tenantName}</div>
                            <div className="text-sm text-muted-foreground">
                              by {backup.metadata.triggeredBy}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(backup.type)}</TableCell>
                      <TableCell>{getStatusBadge(backup.status)}</TableCell>
                      <TableCell>
                        <div className="w-24">
                          <Progress value={backup.progress} className="h-2" />
                          <span className="text-xs text-muted-foreground">{backup.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3 text-muted-foreground" />
                          {formatFileSize(backup.size)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 text-muted-foreground" />
                          {formatDistanceToNow(new Date(backup.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {backup.status === 'completed' && backup.downloadUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(backup.downloadUrl, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {backup.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setRestoreModalOpen(true);
                              }}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(backup.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Restore Modal */}
      <Dialog open={restoreModalOpen} onOpenChange={setRestoreModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-warning" />
              Restore Backup
            </DialogTitle>
            <DialogDescription>
              Restore data from backup. This will create a sandbox environment.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBackup && (
            <div className="space-y-4">
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-warning mb-1">Restore to Sandbox Only</p>
                    <p className="text-muted-foreground">
                      For security, backups can only be restored to sandbox environments. 
                      Production restores require additional approval.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label>Backup Details</Label>
                <div className="mt-2 p-3 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tenant:</span>
                    <span className="text-sm font-medium">{selectedBackup.tenantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Type:</span>
                    {getTypeBadge(selectedBackup.type)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Size:</span>
                    <span className="text-sm font-medium">{formatFileSize(selectedBackup.size)}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Sandbox Name</Label>
                <Input placeholder="sandbox-restore-2024" />
              </div>

              <div>
                <Label>Restore Reason</Label>
                <Textarea placeholder="Reason for restoring this backup..." />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRestoreModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleRestore(selectedBackup.id, {})}
                  className="bg-warning hover:bg-warning/90"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restore to Sandbox
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}