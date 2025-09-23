import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  User, 
  Calendar,
  MessageSquare,
  FileText,
  AlertTriangle 
} from 'lucide-react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useStaffFinancials } from '@/hooks/useStaffFinancials';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ApprovalAction {
  id: string;
  action: 'approve' | 'reject';
  comments: string;
  stage: 'manager' | 'owner' | 'accountant';
}

export function SalaryApprovalWorkflow() {
  const { user } = useAuth();
  const { salaryAudits, createSalaryAudit } = useStaffFinancials();
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [actionComments, setActionComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter audits based on user role and approval stage
  const getRelevantAudits = () => {
    const userRole = user?.role;
    
    if (userRole === 'MANAGER') {
      return salaryAudits.filter(audit => audit.approval_stage === 'pending');
    } else if (userRole === 'OWNER') {
      return salaryAudits.filter(audit => audit.approval_stage === 'manager_approved');
    } else if (userRole === 'POS') {
      return salaryAudits.filter(audit => audit.approval_stage === 'owner_approved');
    }
    
    return salaryAudits;
  };

  const relevantAudits = getRelevantAudits();

  const getApprovalStage = (currentStage: string) => {
    const stages = {
      'pending': { label: 'Manager Review', icon: User, color: 'bg-blue-500/10 text-blue-600' },
      'manager_approved': { label: 'Owner Approval', icon: CheckCircle, color: 'bg-amber-500/10 text-amber-600' },
      'owner_approved': { label: 'Payment Processing', icon: DollarSign, color: 'bg-green-500/10 text-green-600' },
      'completed': { label: 'Completed', icon: CheckCircle, color: 'bg-success/10 text-success' },
      'rejected': { label: 'Rejected', icon: XCircle, color: 'bg-danger/10 text-danger' }
    };
    return stages[currentStage] || stages['pending'];
  };

  const getNextStage = (currentStage: string): string => {
    const progression = {
      'pending': 'manager_approved',
      'manager_approved': 'owner_approved', 
      'owner_approved': 'completed'
    };
    return progression[currentStage] || currentStage;
  };

  const getUserActionLabel = () => {
    const userRole = user?.role;
    
    if (userRole === 'MANAGER') {
      return 'Review & Approve';
    } else if (userRole === 'OWNER') {
      return 'Final Approval';
    } else if (userRole === 'POS') {
      return 'Process Payment';
    }
    
    return 'Review';
  };

  const handleApprovalAction = async (audit: any, action: 'approve' | 'reject') => {
    if (!actionComments.trim()) {
      toast.error('Please provide comments for this action');
      return;
    }

    setIsProcessing(true);
    try {
      const nextStage = action === 'approve' ? getNextStage(audit.approval_stage) : 'rejected';
      
      // Create a new audit record for the approval action
      await createSalaryAudit({
        user_id: audit.user_id,
        old_salary: audit.old_salary,
        new_salary: audit.new_salary,
        change_reason: `${action === 'approve' ? 'Approved' : 'Rejected'} by ${user?.role}: ${actionComments}`,
        approval_stage: nextStage,
        approved_by: user?.id,
        effective_date: new Date().toISOString().split('T')[0]
      });

      const actionText = action === 'approve' ? 'approved' : 'rejected';
      toast.success(`Salary change ${actionText} successfully`);
      
      setSelectedAudit(null);
      setActionComments('');
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Failed to process approval');
    } finally {
      setIsProcessing(false);
    }
  };

  const canTakeAction = (audit: any) => {
    const userRole = user?.role;
    
    if (userRole === 'MANAGER' && audit.approval_stage === 'pending') return true;
    if (userRole === 'OWNER' && audit.approval_stage === 'manager_approved') return true;
    if (userRole === 'POS' && audit.approval_stage === 'owner_approved') return true;
    
    return false;
  };

  if (relevantAudits.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="h-12 w-12 text-success mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pending Approvals</h3>
          <p className="text-muted-foreground text-center">
            There are no salary changes requiring your attention at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Salary Approval Workflow</h2>
          <p className="text-muted-foreground">
            Review and approve salary changes for your team
          </p>
        </div>
        <Badge variant="outline">
          {relevantAudits.length} Pending {relevantAudits.length === 1 ? 'Review' : 'Reviews'}
        </Badge>
      </div>

      {/* Approval Process Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Approval Process Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {['Manager Review', 'Owner Approval', 'Payment Processing'].map((stage, index) => (
              <div key={stage} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    h-10 w-10 rounded-full flex items-center justify-center
                    ${index === 0 ? 'bg-blue-500/10 text-blue-600' : 
                      index === 1 ? 'bg-amber-500/10 text-amber-600' : 
                      'bg-green-500/10 text-green-600'}
                  `}>
                    {index === 0 ? <User className="h-5 w-5" /> :
                     index === 1 ? <CheckCircle className="h-5 w-5" /> :
                     <DollarSign className="h-5 w-5" />}
                  </div>
                  <span className="text-sm mt-1">{stage}</span>
                </div>
                {index < 2 && (
                  <div className="h-px bg-border w-20 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      <div className="space-y-4">
        {relevantAudits.map((audit) => {
          const stageInfo = getApprovalStage(audit.approval_stage);
          const StageIcon = stageInfo.icon;
          
          return (
            <Card key={audit.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarFallback className="bg-gradient-primary text-white">
                        {audit.user_id?.toString().slice(-2).toUpperCase() || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Staff Member ({audit.user_id})</h3>
                        <Badge className={stageInfo.color}>
                          <StageIcon className="h-3 w-3 mr-1" />
                          {stageInfo.label}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">Previous Salary:</span>
                          <span className="font-medium">₦{audit.old_salary?.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">New Salary:</span>
                          <span className="font-medium text-primary">₦{audit.new_salary?.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">Change:</span>
                          <span className={`font-medium ${
                            (audit.new_salary - audit.old_salary) > 0 ? 'text-success' : 'text-danger'
                          }`}>
                            {(audit.new_salary - audit.old_salary) > 0 ? '+' : ''}
                            ₦{(audit.new_salary - audit.old_salary).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">Reason:</span>
                          <span>{audit.change_reason || 'No reason provided'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Requested on {format(new Date(audit.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {canTakeAction(audit) ? (
                      <Button 
                        onClick={() => setSelectedAudit(audit)}
                        className="bg-gradient-primary"
                        size="sm"
                      >
                        {getUserActionLabel()}
                      </Button>
                    ) : (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        Awaiting {stageInfo.label}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Approval Action Dialog */}
      {selectedAudit && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {getUserActionLabel()}: Staff Member ({selectedAudit.user_id})
            </CardTitle>
            <CardDescription>
              Salary change from ₦{selectedAudit.old_salary?.toLocaleString()} to ₦{selectedAudit.new_salary?.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Comments *</label>
              <Textarea
                placeholder="Please provide your comments for this approval decision..."
                value={actionComments}
                onChange={(e) => setActionComments(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => handleApprovalAction(selectedAudit, 'approve')}
                disabled={isProcessing || !actionComments.trim()}
                className="bg-success text-white hover:bg-success/90"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => handleApprovalAction(selectedAudit, 'reject')}
                disabled={isProcessing || !actionComments.trim()}
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => {
                  setSelectedAudit(null);
                  setActionComments('');
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}