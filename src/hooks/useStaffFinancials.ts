// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { toast } from 'sonner';

interface StaffFinancial {
  id: string;
  user_id: string;
  salary_amount?: number;
  salary_currency: string;
  employment_type: string;
  payment_method: string;
  status: string;
  effective_date?: string;
  bank_name?: string;
  account_number?: string;
  salary_grade?: string;
  monthly_salary?: number;
  annual_salary?: number;
  hourly_rate?: number;
}

interface SalaryAudit {
  id: string;
  user_id: string;
  old_salary?: number;
  new_salary?: number;
  change_reason?: string;
  approval_stage: string;
  effective_date: string;
  created_at: string;
  approved_by?: string;
}

interface SalaryPayment {
  id: string;
  user_id: string;
  payment_period_start: string;
  payment_period_end: string;
  gross_amount: number;
  deductions: number;
  net_amount: number;
  payment_date?: string;
  status: string;
  payment_method: string;
  payment_reference?: string;
}

export function useStaffFinancials() {
  const { tenant } = useAuth();
  const [staffFinancials, setStaffFinancials] = useState<StaffFinancial[]>([]);
  const [salaryAudits, setSalaryAudits] = useState<SalaryAudit[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenant?.tenant_id) {
      fetchStaffFinancials();
      fetchSalaryAudits();
      fetchSalaryPayments();
    }
  }, [tenant?.tenant_id]);

  const fetchStaffFinancials = async () => {
    if (!tenant?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('staff_financials')
        .select('*')
        .eq('tenant_id', tenant.tenant_id);

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching staff financials:', error);
        return;
      }

      setStaffFinancials(data || []);
    } catch (error) {
      console.error('Error fetching staff financials:', error);
    }
  };

  const fetchSalaryAudits = async () => {
    if (!tenant?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('staff_salary_audit')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching salary audits:', error);
        return;
      }

      setSalaryAudits(data || []);
    } catch (error) {
      console.error('Error fetching salary audits:', error);
    }
  };

  const fetchSalaryPayments = async () => {
    if (!tenant?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('salary_payments')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching salary payments:', error);
        return;
      }

      setSalaryPayments(data || []);
    } catch (error) {
      console.error('Error fetching salary payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createStaffFinancial = async (staffFinancial: Omit<StaffFinancial, 'id'>) => {
    if (!tenant?.tenant_id) return null;

    try {
      const { data, error } = await supabase
        .from('staff_financials')
        .insert({
          ...staffFinancial,
          tenant_id: tenant.tenant_id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Staff financial record created successfully');
      fetchStaffFinancials();
      return data;
    } catch (error) {
      console.error('Error creating staff financial record:', error);
      toast.error('Failed to create staff financial record');
      return null;
    }
  };

  const updateStaffFinancial = async (id: string, updates: Partial<StaffFinancial>) => {
    try {
      const { data, error } = await supabase
        .from('staff_financials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Staff financial record updated successfully');
      fetchStaffFinancials();
      return data;
    } catch (error) {
      console.error('Error updating staff financial record:', error);
      toast.error('Failed to update staff financial record');
      return null;
    }
  };

  const createSalaryAudit = async (audit: Omit<SalaryAudit, 'id' | 'created_at'>) => {
    if (!tenant?.tenant_id) return null;

    try {
      const { data, error } = await supabase
        .from('staff_salary_audit')
        .insert({
          ...audit,
          tenant_id: tenant.tenant_id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Salary audit record created successfully');
      fetchSalaryAudits();
      return data;
    } catch (error) {
      console.error('Error creating salary audit:', error);
      toast.error('Failed to create salary audit record');
      return null;
    }
  };

  const approveSalaryAudit = async (auditId: string, approvalStage: string) => {
    try {
      const { data, error } = await supabase
        .from('staff_salary_audit')
        .update({
          approval_stage: approvalStage,
          approved_at: new Date().toISOString()
        })
        .eq('id', auditId)
        .select()
        .single();

      if (error) throw error;

      toast.success('Salary audit approved successfully');
      fetchSalaryAudits();
      return data;
    } catch (error) {
      console.error('Error approving salary audit:', error);
      toast.error('Failed to approve salary audit');
      return null;
    }
  };

  const createSalaryPayment = async (payment: Omit<SalaryPayment, 'id'>) => {
    if (!tenant?.tenant_id) return null;

    try {
      const { data, error } = await supabase
        .from('salary_payments')
        .insert({
          ...payment,
          tenant_id: tenant.tenant_id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Salary payment record created successfully');
      fetchSalaryPayments();
      return data;
    } catch (error) {
      console.error('Error creating salary payment:', error);
      toast.error('Failed to create salary payment record');
      return null;
    }
  };

  return {
    staffFinancials,
    salaryAudits,
    salaryPayments,
    loading,
    createStaffFinancial,
    updateStaffFinancial,
    createSalaryAudit,
    approveSalaryAudit,
    createSalaryPayment,
    refetch: () => {
      fetchStaffFinancials();
      fetchSalaryAudits();
      fetchSalaryPayments();
    }
  };
}