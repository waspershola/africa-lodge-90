import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  Import
} from 'lucide-react';
import { toast } from 'sonner';
import { useStaffInvites } from '@/hooks/useStaffInvites';

interface StaffBulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ImportRow {
  data: Record<string, string>;
  errors: string[];
  status: 'valid' | 'invalid' | 'processing' | 'success' | 'failed';
  rowNumber: number;
}

export function StaffBulkImportDialog({ open, onOpenChange, onSuccess }: StaffBulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'results'>('upload');
  const { inviteUser } = useStaffInvites();

  const requiredFields = ['name', 'email', 'role'];
  const validRoles = ['OWNER', 'MANAGER', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'POS', 'ACCOUNTANT'];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV file must contain headers and at least one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const rows: ImportRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.every(v => !v)) continue; // Skip empty rows

        const data: Record<string, string> = {};
        headers.forEach((header, index) => {
          data[header] = values[index] || '';
        });

        const errors = validateRow(data, headers);
        rows.push({
          data,
          errors,
          status: errors.length > 0 ? 'invalid' : 'valid',
          rowNumber: i
        });
      }

      setImportData(rows);
      setStep('preview');
    };

    reader.onerror = () => {
      toast.error('Failed to read CSV file');
    };

    reader.readAsText(file);
  };

  const validateRow = (data: Record<string, string>, headers: string[]): string[] => {
    const errors: string[] = [];

    // Check required fields
    requiredFields.forEach(field => {
      const headerKey = headers.find(h => h.includes(field.toLowerCase()));
      if (!headerKey || !data[headerKey]?.trim()) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate email format
    const emailHeader = headers.find(h => h.includes('email'));
    if (emailHeader && data[emailHeader]) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data[emailHeader])) {
        errors.push('Invalid email format');
      }
    }

    // Validate role
    const roleHeader = headers.find(h => h.includes('role'));
    if (roleHeader && data[roleHeader]) {
      if (!validRoles.includes(data[roleHeader].toUpperCase())) {
        errors.push(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
      }
    }

    // Validate dates
    ['hire_date', 'date_of_birth'].forEach(dateField => {
      const dateHeader = headers.find(h => h.includes(dateField));
      if (dateHeader && data[dateHeader]) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(data[dateHeader])) {
          errors.push(`${dateField} must be in YYYY-MM-DD format`);
        }
      }
    });

    return errors;
  };

  const handleBulkImport = async () => {
    const validRows = importData.filter(row => row.status === 'valid');
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setIsProcessing(true);
    setStep('processing');
    setProcessingProgress(0);

    const updatedRows = [...importData];

    for (let i = 0; i < validRows.length; i++) {
      try {
        const row = validRows[i];
        const index = updatedRows.findIndex(r => r.rowNumber === row.rowNumber);
        
        if (index !== -1) {
          updatedRows[index].status = 'processing';
          setImportData([...updatedRows]);
        }

        // Prepare staff data for invitation
        const staffData = {
          name: row.data.name || row.data['full name'],
          email: row.data.email || row.data['email address'],
          role: (row.data.role || row.data['role/position']).toUpperCase(),
          department: row.data.department,
          phone: row.data.phone || row.data['phone number'],
          address: row.data.address || row.data['home address'],
          nin: row.data.nin || row.data['national id number (nin)'],
          date_of_birth: row.data.date_of_birth || row.data['date of birth (yyyy-mm-dd)'],
          nationality: row.data.nationality,
          employee_id: row.data.employee_id || row.data['employee id'],
          hire_date: row.data.hire_date || row.data['hire date (yyyy-mm-dd)'],
          employment_type: row.data.employment_type || row.data['employment type (full_time/part_time/contract/hourly)'],
          emergency_contact_name: row.data.emergency_contact_name || row.data['emergency contact name'],
          emergency_contact_phone: row.data.emergency_contact_phone || row.data['emergency contact phone'],
          emergency_contact_relationship: row.data.emergency_contact_relationship || row.data['emergency contact relationship'],
          next_of_kin_name: row.data.next_of_kin_name || row.data['next of kin name'],
          next_of_kin_phone: row.data.next_of_kin_phone || row.data['next of kin phone'],
          next_of_kin_relationship: row.data.next_of_kin_relationship || row.data['next of kin relationship'],
          bank_name: row.data.bank_name || row.data['bank name'],
          account_number: row.data.account_number || row.data['account number'],
          account_name: row.data.account_name || row.data['account holder name'],
          passport_number: row.data.passport_number || row.data['passport number'],
          drivers_license: row.data.drivers_license || row.data['driver\'s license'],
          salary_amount: row.data.salary_amount || row.data['salary amount'],
          hourly_rate: row.data.hourly_rate || row.data['hourly rate'],
          payment_method: row.data.payment_method || row.data['payment method (bank_transfer/cash/mobile_money)'] || 'bank_transfer'
        };

        const result = await inviteUser(staffData);
        
        if (index !== -1) {
          updatedRows[index].status = result.success ? 'success' : 'failed';
          if (!result.success) {
            updatedRows[index].errors.push(result.error || 'Import failed');
          }
        }

        setProcessingProgress(((i + 1) / validRows.length) * 100);
        setImportData([...updatedRows]);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error: any) {
        const index = updatedRows.findIndex(r => r.rowNumber === validRows[i].rowNumber);
        if (index !== -1) {
          updatedRows[index].status = 'failed';
          updatedRows[index].errors.push(error.message || 'Import failed');
          setImportData([...updatedRows]);
        }
      }
    }

    setIsProcessing(false);
    setStep('results');

    const successCount = updatedRows.filter(r => r.status === 'success').length;
    const failedCount = updatedRows.filter(r => r.status === 'failed').length;

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} staff members`);
      if (onSuccess) onSuccess();
    }
    
    if (failedCount > 0) {
      toast.warning(`${failedCount} imports failed. Check the results for details.`);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setImportData([]);
    setStep('upload');
    setProcessingProgress(0);
    setIsProcessing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'invalid': return <XCircle className="h-4 w-4 text-danger" />;
      case 'processing': return <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed': return <XCircle className="h-4 w-4 text-danger" />;
      default: return null;
    }
  };

  const validCount = importData.filter(r => r.status === 'valid' || r.status === 'success').length;
  const invalidCount = importData.filter(r => r.status === 'invalid' || r.status === 'failed').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Import Staff
          </DialogTitle>
          <DialogDescription>
            Import multiple staff members from a CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertDescription>
                  Upload a CSV file with staff information. Make sure to include required fields: Name, Email, and Role.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="file-upload">Select CSV File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-success border-success/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {validCount} Valid
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="outline" className="text-danger border-danger/20">
                      <XCircle className="h-3 w-3 mr-1" />
                      {invalidCount} Invalid
                    </Badge>
                  )}
                </div>
              </div>

              <div className="border rounded-lg max-h-96 overflow-y-auto">
                <div className="p-4 space-y-2">
                  {importData.map((row, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(row.status)}
                        <div>
                          <div className="font-medium">
                            {row.data.name || row.data['full name'] || 'Unknown'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {row.data.email || row.data['email address']} • {row.data.role || row.data['role/position']}
                          </div>
                        </div>
                      </div>
                      
                      {row.errors.length > 0 && (
                        <div className="text-sm text-danger">
                          {row.errors.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">Processing Import...</div>
                <Progress value={processingProgress} className="w-full" />
                <div className="text-sm text-muted-foreground mt-2">
                  {Math.round(processingProgress)}% complete
                </div>
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Import completed! {importData.filter(r => r.status === 'success').length} staff members were successfully imported.
                </AlertDescription>
              </Alert>

              <div className="border rounded-lg max-h-96 overflow-y-auto">
                <div className="p-4 space-y-2">
                  {importData.map((row, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(row.status)}
                        <div>
                          <div className="font-medium">
                            {row.data.name || row.data['full name'] || 'Unknown'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {row.data.email || row.data['email address']}
                          </div>
                        </div>
                      </div>
                      
                      {row.errors.length > 0 && (
                        <div className="text-sm text-danger">
                          {row.errors.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {step === 'results' ? 'Close' : 'Cancel'}
          </Button>
          
          {step === 'upload' && (
            <Button disabled>
              <Eye className="h-4 w-4 mr-2" />
              Preview Import
            </Button>
          )}
          
          {step === 'preview' && (
            <Button 
              onClick={handleBulkImport}
              disabled={validCount === 0}
              className="bg-gradient-primary"
            >
              <Import className="h-4 w-4 mr-2" />
              Import {validCount} Staff Members
            </Button>
          )}
          
          {step === 'results' && (
            <Button onClick={resetDialog} variant="outline">
              Import Another File
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}