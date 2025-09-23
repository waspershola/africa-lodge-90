import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet, FileText, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface StaffTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StaffTemplateDialog({ open, onOpenChange }: StaffTemplateDialogProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'name', 'email', 'role', 'department', 'phone', 'hire_date', 'employee_id'
  ]);

  const availableFields = [
    { id: 'name', label: 'Full Name', required: true, category: 'Basic' },
    { id: 'email', label: 'Email Address', required: true, category: 'Basic' },
    { id: 'role', label: 'Role/Position', required: true, category: 'Basic' },
    { id: 'department', label: 'Department', required: false, category: 'Basic' },
    { id: 'phone', label: 'Phone Number', required: false, category: 'Basic' },
    { id: 'hire_date', label: 'Hire Date (YYYY-MM-DD)', required: false, category: 'Basic' },
    { id: 'employee_id', label: 'Employee ID', required: false, category: 'Basic' },
    
    // Personal Information
    { id: 'address', label: 'Home Address', required: false, category: 'Personal' },
    { id: 'nin', label: 'National ID Number (NIN)', required: false, category: 'Personal' },
    { id: 'date_of_birth', label: 'Date of Birth (YYYY-MM-DD)', required: false, category: 'Personal' },
    { id: 'nationality', label: 'Nationality', required: false, category: 'Personal' },
    { id: 'passport_number', label: 'Passport Number', required: false, category: 'Personal' },
    { id: 'drivers_license', label: 'Driver\'s License', required: false, category: 'Personal' },
    
    // Employment Details
    { id: 'employment_type', label: 'Employment Type (full_time/part_time/contract/hourly)', required: false, category: 'Employment' },
    { id: 'salary_amount', label: 'Salary Amount', required: false, category: 'Employment' },
    { id: 'hourly_rate', label: 'Hourly Rate', required: false, category: 'Employment' },
    { id: 'payment_method', label: 'Payment Method (bank_transfer/cash/mobile_money)', required: false, category: 'Employment' },
    
    // Emergency Contacts
    { id: 'emergency_contact_name', label: 'Emergency Contact Name', required: false, category: 'Emergency' },
    { id: 'emergency_contact_phone', label: 'Emergency Contact Phone', required: false, category: 'Emergency' },
    { id: 'emergency_contact_relationship', label: 'Emergency Contact Relationship', required: false, category: 'Emergency' },
    { id: 'next_of_kin_name', label: 'Next of Kin Name', required: false, category: 'Emergency' },
    { id: 'next_of_kin_phone', label: 'Next of Kin Phone', required: false, category: 'Emergency' },
    { id: 'next_of_kin_relationship', label: 'Next of Kin Relationship', required: false, category: 'Emergency' },
    
    // Banking Information
    { id: 'bank_name', label: 'Bank Name', required: false, category: 'Banking' },
    { id: 'account_number', label: 'Account Number', required: false, category: 'Banking' },
    { id: 'account_name', label: 'Account Holder Name', required: false, category: 'Banking' }
  ];

  const fieldCategories = ['Basic', 'Personal', 'Employment', 'Emergency', 'Banking'];

  const handleFieldToggle = (fieldId: string) => {
    const field = availableFields.find(f => f.id === fieldId);
    if (field?.required) return; // Don't allow toggling required fields

    setSelectedFields(prev => 
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const generateTemplate = () => {
    const headers = selectedFields.map(field => {
      const fieldInfo = availableFields.find(f => f.id === field);
      return fieldInfo?.label || field;
    });
    
    // Create sample row with instructions
    const sampleRow = selectedFields.map(field => {
      switch (field) {
        case 'name': return 'John Doe';
        case 'email': return 'john.doe@example.com';
        case 'role': return 'FRONT_DESK (or MANAGER, HOUSEKEEPING, etc.)';
        case 'department': return 'Front Office';
        case 'phone': return '+234 123 456 7890';
        case 'hire_date': return '2024-01-15';
        case 'date_of_birth': return '1990-05-20';
        case 'employment_type': return 'full_time';
        case 'salary_amount': return '150000';
        case 'hourly_rate': return '2500';
        case 'payment_method': return 'bank_transfer';
        case 'nin': return '12345678901';
        case 'nationality': return 'Nigerian';
        case 'address': return '123 Main Street, Lagos';
        case 'emergency_contact_name': return 'Jane Doe';
        case 'emergency_contact_phone': return '+234 987 654 3210';
        case 'emergency_contact_relationship': return 'Sister';
        case 'bank_name': return 'Access Bank';
        case 'account_number': return '1234567890';
        case 'account_name': return 'John Doe';
        default: return `Enter ${field}`;
      }
    });

    const csvContent = [
      headers.join(','),
      sampleRow.join(','),
      // Add empty rows for filling
      ...Array(5).fill(selectedFields.map(() => '').join(','))
    ].join('\n');

    return csvContent;
  };

  const handleDownloadTemplate = () => {
    try {
      const templateContent = generateTemplate();
      const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `staff-import-template-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success('Staff template downloaded successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Download Staff Info Template
          </DialogTitle>
          <DialogDescription>
            Download a template for collecting staff information. Fill it out and use bulk import to add multiple staff members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This template includes sample data in the first row as a guide. Remove or replace the sample data with actual staff information before importing.
            </AlertDescription>
          </Alert>

          {/* Export Format */}
          <div className="space-y-2">
            <Label>Template Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'excel') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV Template (.csv)
                  </div>
                </SelectItem>
                <SelectItem value="excel" disabled>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel Template (.xlsx) - Coming Soon
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection by Category */}
          <div className="space-y-4">
            <Label>Fields to Include in Template</Label>
            {fieldCategories.map(category => (
              <div key={category} className="space-y-3">
                <h4 className="font-medium text-sm text-foreground">{category} Information</h4>
                <div className="grid grid-cols-1 gap-2 pl-4 border-l-2 border-muted">
                  {availableFields
                    .filter(field => field.category === category)
                    .map(field => (
                      <div key={field.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={field.id}
                          checked={selectedFields.includes(field.id)}
                          onCheckedChange={() => handleFieldToggle(field.id)}
                          disabled={field.required}
                        />
                        <Label 
                          htmlFor={field.id} 
                          className={`text-sm ${field.required ? 'font-medium' : ''}`}
                        >
                          {field.label}
                          {field.required && <span className="text-muted-foreground ml-1">(Required)</span>}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Template Summary */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Template Summary</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><strong>{selectedFields.length}</strong> fields will be included in the template</p>
              <p>Template includes 1 sample row + 5 blank rows for data entry</p>
              <p>After filling, use the "Bulk Import" feature to add staff members</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDownloadTemplate}
            disabled={selectedFields.length === 0}
            className="bg-gradient-primary"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template ({exportFormat.toUpperCase()})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}