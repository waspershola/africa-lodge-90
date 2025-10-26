import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Edit, 
  Check, 
  X, 
  AlertCircle,
  Calendar,
  CreditCard,
  FileText
} from 'lucide-react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StaffFinancial {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  salary_amount?: number;
  salary_currency: string;
  employment_type: string;
  payment_method: string;
  status: string;
  effective_date?: string;
  bank_name?: string;
  account_number?: string;
  salary_grade?: string;
}

interface SalaryAudit {
  id: string;
  user_id: string;
  name: string;
  old_salary: number;
  new_salary: number;
  change_reason: string;
  approval_stage: string;
  effective_date: string;
  created_at: string;
}

export function SalaryManagementTab() {
  const { tenant } = useAuth();
  const [staffFinancials, setStaffFinancials] = useState<StaffFinancial[]>([]);
  const [salaryAudits, setSalaryAudits] = useState<SalaryAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StaffFinancial>>({});

  useEffect(() => {
    fetchStaffFinancials();
    fetchSalaryAudits();
  }, [tenant]);

  const fetchStaffFinancials = async () => {
    if (!tenant?.tenant_id) return;

    try {
      // Fetch staff with their financial information
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .eq('is_active', true)
        .order('name');

      if (usersError) throw usersError;

      // Fetch financial data for these users
      const { data: financials, error: financialsError } = await supabase
        .from('staff_financials')
        .select('*')
        .eq('tenant_id', tenant.tenant_id);

      if (financialsError && financialsError.code !== 'PGRST116') {
        console.error('Financials fetch error:', financialsError);
      }

      // Combine user data with financial data
      const staffWithFinancials: StaffFinancial[] = users.map(user => {
        const financial = financials?.find(f => f.user_id === user.id);
        return {
          id: user.id,
          user_id: user.id,
          name: user.name || 'Unknown',
          email: user.email,
          role: user.role,
          salary_amount: financial?.salary_amount || financial?.monthly_salary,
          salary_currency: financial?.salary_currency || 'NGN',
          employment_type: financial?.employment_type || 'full_time',
          payment_method: financial?.payment_method || 'bank_transfer',
          status: financial?.status || 'active',
          effective_date: financial?.effective_date,
          bank_name: financial?.bank_name,
          account_number: financial?.account_number,
          salary_grade: financial?.salary_grade
        };
      });

      setStaffFinancials(staffWithFinancials);
    } catch (error) {
      console.error('Error fetching staff financials:', error);
      toast.error('Failed to load staff financial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryAudits = async () => {
    if (!tenant?.tenant_id) return;

    try {
      const { data: audits, error } = await supabase
        .from('staff_salary_audit')
        .select(`
          *,
          users!staff_salary_audit_user_id_fkey(name)
        `)
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.error('Audits fetch error:', error);
        return;
      }

      if (audits) {
        const formattedAudits: SalaryAudit[] = audits.map(audit => ({
          id: audit.id,
          user_id: audit.user_id,
          name: audit.users?.name || 'Unknown',
          old_salary: audit.old_salary || 0,
          new_salary: audit.new_salary || 0,
          change_reason: audit.change_reason || '',
          approval_stage: audit.approval_stage,
          effective_date: audit.effective_date,
          created_at: audit.created_at
        }));
        setSalaryAudits(formattedAudits);
      }
    } catch (error) {
      console.error('Error fetching salary audits:', error);
    }
  };

  const startEditing = (staff: StaffFinancial) => {
    setEditingStaff(staff.id);
    setEditForm(staff);
  };

  const cancelEditing = () => {
    setEditingStaff(null);
    setEditForm({});
  };

  const saveSalaryUpdate = async () => {
    if (!editForm.user_id || !tenant?.tenant_id) return;

    try {
      const updatedSalary = Number(editForm.salary_amount || 0);
      const originalStaff = staffFinancials.find(s => s.id === editForm.user_id);
      const oldSalary = Number(originalStaff?.salary_amount || 0);

      // Create salary audit record
      const { error: auditError } = await supabase
        .from('staff_salary_audit')
        .insert({
          user_id: editForm.user_id,
          tenant_id: tenant.tenant_id,
          old_salary: oldSalary,
          new_salary: updatedSalary,
          change_reason: 'Manual salary adjustment',
          approval_stage: 'pending'
        });

      if (auditError) throw auditError;

      toast.success('Salary update submitted for approval');
      setEditingStaff(null);
      setEditForm({});
      fetchSalaryAudits();
    } catch (error) {
      console.error('Error updating salary:', error);
      toast.error('Failed to submit salary update');
    }
  };

  const getEmploymentTypeBadge = (type: string) => {
    const colors = {
      full_time: 'bg-success/10 text-success border-success/20',
      part_time: 'bg-warning/10 text-warning border-warning/20',
      contract: 'bg-primary/10 text-primary border-primary/20',
      hourly: 'bg-accent/10 text-accent border-accent/20'
    };
    return colors[type as keyof typeof colors] || 'bg-muted text-muted-foreground border-muted';
  };

  const getApprovalStageBadge = (stage: string) => {
    const colors = {
      pending: 'bg-warning/10 text-warning border-warning/20',
      manager_approved: 'bg-primary/10 text-primary border-primary/20',
      owner_approved: 'bg-success/10 text-success border-success/20',
      completed: 'bg-success/10 text-success border-success/20',
      rejected: 'bg-danger/10 text-danger border-danger/20'
    };
    return colors[stage as keyof typeof colors] || 'bg-muted text-muted-foreground border-muted';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate summary stats
  const totalSalaryBudget = staffFinancials.reduce((sum, staff) => sum + (staff.salary_amount || 0), 0);
  const averageSalary = staffFinancials.length > 0 ? totalSalaryBudget / staffFinancials.length : 0;
  const pendingApprovals = salaryAudits.filter(audit => audit.approval_stage === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Salary Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalSalaryBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Monthly payroll total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{Math.round(averageSalary).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per staff member</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Salary changes awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Salary Management */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Salary Management</CardTitle>
          <CardDescription>
            Manage salaries, view payment information, and track compensation changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staffFinancials.map(staff => (
              <Card key={staff.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {staff.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1">
                        <h3 className="font-semibold">{staff.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{staff.role}</Badge>
                          <Badge className={getEmploymentTypeBadge(staff.employment_type)}>
                            {staff.employment_type?.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {editingStaff === staff.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editForm.salary_amount || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, salary_amount: Number(e.target.value) }))}
                            className="w-32"
                            placeholder="Amount"
                          />
                          <Button size="sm" onClick={saveSalaryUpdate}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-semibold">
                              ₦{(staff.salary_amount || 0).toLocaleString()}/month
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {staff.payment_method?.replace('_', ' ')}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => startEditing(staff)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Salary Changes */}
      {salaryAudits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Salary Changes</CardTitle>
            <CardDescription>Track salary adjustments and approval workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {salaryAudits.slice(0, 5).map(audit => (
                <div key={audit.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{audit.name}</span>
                      <Badge className={getApprovalStageBadge(audit.approval_stage)}>
                        {audit.approval_stage.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      ₦{audit.old_salary.toLocaleString()} → ₦{audit.new_salary.toLocaleString()}
                      <span className="ml-2">({audit.change_reason})</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(audit.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}