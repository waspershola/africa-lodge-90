import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Clock, Building2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { usePolicies, useUpdatePolicy } from '@/hooks/useApi';

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

export default function Policies() {
  const [editingTenant, setEditingTenant] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(24);

  const { data: policiesData, isLoading, error, refetch } = usePolicies();
  const updatePolicy = useUpdatePolicy();

  if (isLoading) return <LoadingState message="Loading policies..." />;
  if (error) return <ErrorState message="Failed to load policies" onRetry={refetch} />;

  const policies = policiesData?.data;
  if (!policies) return <ErrorState message="No policy data available" />;

  const handleEdit = (tenantId: string, currentHours: number) => {
    setEditingTenant(tenantId);
    setEditValue(currentHours);
  };

  const handleSave = async (tenantId: string) => {
    try {
      await updatePolicy.mutateAsync({
        id: tenantId,
        tenantId,
        offlineWindowHours: editValue,
      });
      setEditingTenant(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCancel = () => {
    setEditingTenant(null);
  };

  const getStatusColor = (hours: number) => {
    if (hours < 18) return 'text-orange-600';
    if (hours > 36) return 'text-red-600';
    return 'text-green-600';
  };

  const getStatusText = (hours: number) => {
    if (hours < 18) return 'Short Window';
    if (hours > 36) return 'Extended Window';
    return 'Standard Window';
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={staggerChildren}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={fadeIn}>
        <div>
          <h1 className="text-2xl font-bold display-heading text-gradient mb-1">Policies</h1>
          <p className="text-muted-foreground">Manage offline window configurations for each hotel</p>
        </div>
      </motion.div>

      {/* Global Settings */}
      <motion.div variants={fadeIn}>
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Global Offline Window Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Default Window</Label>
                <div className="text-2xl font-bold text-primary mt-1">
                  {policies.defaultOfflineWindow} hours
                </div>
              </div>
              <div>
                <Label>Minimum Allowed</Label>
                <div className="text-2xl font-bold text-orange-600 mt-1">
                  {policies.minOfflineWindow} hours
                </div>
              </div>
              <div>
                <Label>Maximum Allowed</Label>
                <div className="text-2xl font-bold text-red-600 mt-1">
                  {policies.maxOfflineWindow} hours
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <strong>Offline Window:</strong> The maximum time a hotel can operate without internet connectivity 
                  before requiring synchronization with the server. This affects front desk operations, 
                  payment processing, and data consistency.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tenant Overrides */}
      <motion.div variants={fadeIn}>
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Tenant-Specific Overrides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Current Window</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {policies.tenantOverrides?.map((override) => {
                   const isEditing = editingTenant === override.tenant_id;
                   
                   return (
                     <TableRow key={override.tenant_id}>
                       <TableCell>
                         <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                             <Building2 className="h-4 w-4 text-primary" />
                           </div>
                           <span className="font-medium">{override.hotel_name}</span>
                         </div>
                       </TableCell>
                       <TableCell>
                         {isEditing ? (
                          <div className="flex items-center gap-2 max-w-32">
                            <Input
                              type="number"
                              min={policies.minOfflineWindow}
                              max={policies.maxOfflineWindow}
                              value={editValue}
                              onChange={(e) => setEditValue(parseInt(e.target.value) || 24)}
                              className="h-8"
                            />
                            <span className="text-sm text-muted-foreground">hrs</span>
                          </div>
                        ) : (
                           <div className="flex items-center gap-2">
                             <Clock className="h-4 w-4 text-muted-foreground" />
                             <span className="font-medium">{override.offline_window_hours} hours</span>
                           </div>
                        )}
                      </TableCell>
                      <TableCell>
                         <span className={`text-sm font-medium ${getStatusColor(override.offline_window_hours)}`}>
                           {getStatusText(override.offline_window_hours)}
                         </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancel}
                              disabled={updatePolicy.isPending}
                            >
                              Cancel
                            </Button>
                             <Button
                               size="sm"
                               onClick={() => handleSave(override.tenant_id)}
                               disabled={updatePolicy.isPending || editValue < policies.minOfflineWindow || editValue > policies.maxOfflineWindow}
                               className="bg-gradient-primary shadow-luxury hover:shadow-hover"
                             >
                               <Save className="h-3 w-3 mr-1" />
                               {updatePolicy.isPending ? 'Saving...' : 'Save'}
                             </Button>
                           </div>
                         ) : (
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleEdit(override.tenant_id, override.offline_window_hours)}
                           >
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Policy Explanation */}
      <motion.div variants={fadeIn}>
        <Card className="modern-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Policy Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <strong className="text-foreground">12-18 hours:</strong> Short offline window. 
              Suitable for hotels with reliable internet and backup connections.
            </div>
            <div>
              <strong className="text-foreground">18-24 hours:</strong> Standard offline window. 
              Recommended for most hotels with occasional connectivity issues.
            </div>
            <div>
              <strong className="text-foreground">24-36 hours:</strong> Extended offline window. 
              For hotels in areas with frequent power outages or unreliable internet.
            </div>
            <div>
              <strong className="text-foreground">36-48 hours:</strong> Maximum offline window. 
              Use only for remote locations with severe connectivity challenges.
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}