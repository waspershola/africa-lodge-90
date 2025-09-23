import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface StaffExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffData: any[];
}

export function StaffExportDialog({ open, onOpenChange, staffData }: StaffExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'name', 'email', 'role', 'department', 'status', 'hire_date', 'phone'
  ]);

  const availableFields = [
    { id: 'name', label: 'Full Name', required: true },
    { id: 'email', label: 'Email Address', required: true },
    { id: 'role', label: 'Role/Position', required: false },
    { id: 'department', label: 'Department', required: false },
    { id: 'status', label: 'Employment Status', required: false },
    { id: 'hire_date', label: 'Hire Date', required: false },
    { id: 'phone', label: 'Phone Number', required: false },
    { id: 'employee_id', label: 'Employee ID', required: false },
    { id: 'nin', label: 'NIN', required: false },
    { id: 'nationality', label: 'Nationality', required: false },
    { id: 'employment_type', label: 'Employment Type', required: false },
    { id: 'emergency_contact_name', label: 'Emergency Contact', required: false },
    { id: 'emergency_contact_phone', label: 'Emergency Phone', required: false },
    { id: 'bank_name', label: 'Bank Name', required: false },
    { id: 'account_number', label: 'Account Number', required: false }
  ];

  const handleFieldToggle = (fieldId: string) => {
    const field = availableFields.find(f => f.id === fieldId);
    if (field?.required) return; // Don't allow toggling required fields

    setSelectedFields(prev => 
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const convertToCSV = (data: any[], fields: string[]) => {
    const headers = fields.map(field => 
      availableFields.find(f => f.id === field)?.label || field
    );
    
    const csvContent = [
      headers.join(','),
      ...data.map(staff => 
        fields.map(field => {
          const value = staff[field] || '';
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  const handleExport = () => {
    try {
      const filteredData = staffData.map(staff => {
        const exportItem: any = {};
        selectedFields.forEach(field => {
          exportItem[field] = staff[field] || '';
        });
        return exportItem;
      });

      if (exportFormat === 'csv') {
        const csvContent = convertToCSV(filteredData, selectedFields);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `staff-export-${new Date().toISOString().split('T')[0]}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }

      toast.success(`Staff data exported successfully (${filteredData.length} records)`);
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export staff data');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Staff Data
          </DialogTitle>
          <DialogDescription>
            Export staff information for payroll, HR, or external systems
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'excel') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV File (.csv)
                  </div>
                </SelectItem>
                <SelectItem value="excel" disabled>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel File (.xlsx) - Coming Soon
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection */}
          <div className="space-y-3">
            <Label>Fields to Export</Label>
            <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
              {availableFields.map(field => (
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

          {/* Export Summary */}
          <div className="bg-muted/30 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>{staffData.length}</strong> staff members will be exported with{' '}
              <strong>{selectedFields.length}</strong> fields
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={selectedFields.length === 0}
            className="bg-gradient-primary"
          >
            <Download className="h-4 w-4 mr-2" />
            Export {exportFormat.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}