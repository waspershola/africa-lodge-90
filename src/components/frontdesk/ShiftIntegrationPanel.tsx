import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Activity,
  CheckCircle
} from 'lucide-react';
import { useActiveShiftSessions } from '@/hooks/useShiftSessions';
import { useQRShiftRouting } from '@/hooks/useQRShiftRouting';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

interface ShiftIntegrationPanelProps {
  className?: string;
}

export const ShiftIntegrationPanel: React.FC<ShiftIntegrationPanelProps> = ({ 
  className 
}) => {
  const { tenant } = useAuth();
  const { data: activeShifts, isLoading } = useActiveShiftSessions();
  const { activeStaff, getShiftCoverage } = useQRShiftRouting();
  
  // Fetch staff details for active shifts
  const { data: shiftsWithStaff } = useQuery({
    queryKey: ['shifts-with-staff', tenant?.tenant_id, activeShifts],
    queryFn: async () => {
      if (!activeShifts || activeShifts.length === 0) return [];
      
      const staffIds = activeShifts.map(shift => shift.staff_id);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .in('id', staffIds);
      
      if (error) throw error;
      
      // Map staff info to shifts
      return activeShifts.map(shift => ({
        ...shift,
        staff_name: data.find(s => s.id === shift.staff_id)?.name || 'Unknown Staff',
        staff_email: data.find(s => s.id === shift.staff_id)?.email
      }));
    },
    enabled: !!activeShifts && activeShifts.length > 0,
  });
  
  const shiftCoverage = getShiftCoverage();
  const totalActiveStaff = activeShifts?.length || 0;
  
  // Calculate shift metrics
  const totalCashHandled = activeShifts?.reduce((sum, shift) => 
    sum + (shift.cash_total || 0), 0
  ) || 0;
  
  const totalPOSHandled = activeShifts?.reduce((sum, shift) => 
    sum + (shift.pos_total || 0), 0
  ) || 0;

  const roleDistribution = activeShifts?.reduce((acc, shift) => {
    acc[shift.role] = (acc[shift.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Activity className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading shift data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Active Staff Count */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Staff</p>
                <p className="text-2xl font-bold">{totalActiveStaff}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Shift Coverage Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coverage</p>
                <p className="text-2xl font-bold">
                  {shiftCoverage.hasActiveCoverage ? (
                    <span className="text-green-600">Full</span>
                  ) : (
                    <span className="text-red-600">Limited</span>
                  )}
                </p>
              </div>
              {shiftCoverage.hasActiveCoverage ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Cash Handled */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cash Today</p>
                <p className="text-2xl font-bold">${totalCashHandled.toFixed(0)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Total POS Handled */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">POS Today</p>
                <p className="text-2xl font-bold">${totalPOSHandled.toFixed(0)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Shifts Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Shifts
              {totalActiveStaff > 0 && (
                <Badge variant="secondary">{totalActiveStaff}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalActiveStaff > 0 ? (
              <div className="space-y-3">
                {shiftsWithStaff?.map((shift) => (
                  <div 
                    key={shift.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{shift.staff_name}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{shift.role}</Badge>
                        {shift.device_id && (
                          <span className="text-xs text-muted-foreground">
                            Device: {shift.device_id}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Started {formatDistanceToNow(new Date(shift.start_time))} ago
                      </div>
                    </div>
                    <Badge className="bg-green-50 text-green-700">
                      <Activity className="h-3 w-3 mr-1 animate-pulse" />
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No active shifts</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.open('/shift-terminal', '_blank')}
                >
                  Start Shift
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coverage Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Coverage Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Role Distribution */}
              <div>
                <h4 className="font-medium mb-2">Staff by Role</h4>
                <div className="space-y-2">
                  {Object.entries(roleDistribution).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{role.toLowerCase()}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                  {Object.keys(roleDistribution).length === 0 && (
                    <p className="text-sm text-muted-foreground">No active roles</p>
                  )}
                </div>
              </div>

              {/* Missing Critical Roles */}
              {!shiftCoverage.hasActiveCoverage && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Missing Coverage</h4>
                  <div className="space-y-1">
                    {shiftCoverage.missingRoles.map((role) => (
                      <div key={role} className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">{role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coverage Status */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Status</span>
                  <Badge 
                    variant={shiftCoverage.hasActiveCoverage ? "default" : "destructive"}
                  >
                    {shiftCoverage.hasActiveCoverage ? "Fully Covered" : "Needs Attention"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};