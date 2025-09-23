import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, FileText, Info, Printer } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface StaffTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StaffTemplateDialog({ open, onOpenChange }: StaffTemplateDialogProps) {
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

  const generatePDFForm = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text('STAFF INFORMATION FORM', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text('Please fill out this form clearly in block letters', 105, 30, { align: 'center' });
    
    let yPosition = 50;
    const leftMargin = 20;
    const rightMargin = 190;
    const lineHeight = 15;
    const fieldHeight = 8;
    
    fieldCategories.forEach((category, categoryIndex) => {
      const categoryFields = availableFields.filter(field => 
        field.category === category && selectedFields.includes(field.id)
      );
      
      if (categoryFields.length === 0) return;
      
      // Category header
      if (categoryIndex > 0) yPosition += 10; // Extra space between categories
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`${category.toUpperCase()} INFORMATION`, leftMargin, yPosition);
      yPosition += lineHeight;
      
      // Underline
      doc.line(leftMargin, yPosition - 10, rightMargin, yPosition - 10);
      yPosition += 5;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      
      categoryFields.forEach(field => {
        // Check if we need a new page
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Field label
        const label = field.label + (field.required ? ' *' : '');
        doc.text(label, leftMargin, yPosition);
        
        // Underlined space for writing
        const labelWidth = doc.getTextWidth(label);
        const lineStart = leftMargin + labelWidth + 5;
        const lineEnd = rightMargin - 10;
        
        // Draw line for writing
        doc.line(lineStart, yPosition + 2, lineEnd, yPosition + 2);
        
        yPosition += lineHeight;
        
        // For long fields like address, add multiple lines
        if (field.id === 'address') {
          doc.line(leftMargin + 20, yPosition + 2, lineEnd, yPosition + 2);
          yPosition += lineHeight;
        }
      });
      
      yPosition += 10; // Space after category
    });
    
    // Footer with instructions
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    yPosition += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text('INSTRUCTIONS:', leftMargin, yPosition);
    yPosition += 15;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const instructions = [
      '• Please write clearly in BLOCK LETTERS',
      '• Fill all required fields marked with (*)',
      '• Provide accurate contact information',
      '• Attach copies of relevant documents (ID, certificates, etc.)',
      '• Sign and date the form before submission'
    ];
    
    instructions.forEach(instruction => {
      doc.text(instruction, leftMargin, yPosition);
      yPosition += 12;
    });
    
    yPosition += 20;
    doc.text('Signature: ________________________    Date: _______________', leftMargin, yPosition);
    yPosition += 15;
    doc.text('For Office Use Only: ________________________', leftMargin, yPosition);
    
    return doc;
  };

  const handleDownloadTemplate = () => {
    try {
      const pdf = generatePDFForm();
      pdf.save(`staff-information-form-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success('Staff information form downloaded successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF form');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Download Staff Information Form
          </DialogTitle>
          <DialogDescription>
            Download a printable PDF form for collecting staff information. Staff can fill it out by hand and submit for data entry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This generates a printable PDF form with blank fields for staff to fill out by hand. Perfect for collecting staff information during recruitment or onboarding.
            </AlertDescription>
          </Alert>

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

          {/* Form Summary */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Form Summary</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><strong>{selectedFields.length}</strong> fields will be included in the PDF form</p>
              <p>Organized by categories with clear sections and writing lines</p>
              <p>Includes instructions, signature area, and office use section</p>
              <p>Ready to print and distribute to new staff members</p>
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
            Download PDF Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}