import { useMutation } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

interface ShiftSummaryData {
  shift_id: string;
  staff_name: string;
  role: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  cash_total: number;
  pos_total: number;
  total_collected: number;
  handover_notes?: string;
  unresolved_items: string[];
  device_slug?: string;
}

export const useShiftPDFReport = () => {
  const { tenant } = useAuth();

  const generateShiftReport = useMutation({
    mutationFn: async (shiftData: ShiftSummaryData) => {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`${tenant?.hotel_name || 'Hotel'} - Shift Report`, 20, 30);
      
      // Shift Info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Shift ID: ${shiftData.shift_id}`, 20, 50);
      doc.text(`Staff: ${shiftData.staff_name}`, 20, 60);
      doc.text(`Role: ${shiftData.role}`, 20, 70);
      
      if (shiftData.device_slug) {
        doc.text(`Device: ${shiftData.device_slug}`, 20, 80);
      }
      
      // Time Information
      doc.text(`Start Time: ${new Date(shiftData.start_time).toLocaleString()}`, 20, 100);
      doc.text(`End Time: ${new Date(shiftData.end_time).toLocaleString()}`, 20, 110);
      doc.text(`Duration: ${shiftData.duration_hours.toFixed(2)} hours`, 20, 120);
      
      // Financial Summary
      doc.setFont('helvetica', 'bold');
      doc.text('Financial Summary', 20, 140);
      doc.setFont('helvetica', 'normal');
      doc.text(`Cash Total: $${shiftData.cash_total.toFixed(2)}`, 30, 155);
      doc.text(`POS Total: $${shiftData.pos_total.toFixed(2)}`, 30, 165);
      doc.text(`Total Collected: $${shiftData.total_collected.toFixed(2)}`, 30, 175);
      
      // Unresolved Items
      if (shiftData.unresolved_items.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Unresolved Items', 20, 195);
        doc.setFont('helvetica', 'normal');
        
        let yPosition = 210;
        shiftData.unresolved_items.forEach((item, index) => {
          doc.text(`${index + 1}. ${item}`, 30, yPosition);
          yPosition += 10;
          
          // Add new page if needed
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 30;
          }
        });
      }
      
      // Handover Notes
      if (shiftData.handover_notes) {
        let yPos = shiftData.unresolved_items.length > 0 ? 220 + (shiftData.unresolved_items.length * 10) : 195;
        
        if (yPos > 250) {
          doc.addPage();
          yPos = 30;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text('Handover Notes', 20, yPos);
        doc.setFont('helvetica', 'normal');
        
        // Split long notes into lines
        const notes = doc.splitTextToSize(shiftData.handover_notes, 170);
        doc.text(notes, 20, yPos + 15);
      }
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 285);
        doc.text(`Page ${i} of ${pageCount}`, 150, 285);
      }
      
      // Generate filename and download
      const filename = `shift-report-${shiftData.shift_id}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      return { success: true, filename };
    }
  });

  const generateDailyShiftsReport = useMutation({
    mutationFn: async (shifts: ShiftSummaryData[]) => {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`${tenant?.hotel_name || 'Hotel'} - Daily Shifts Report`, 20, 30);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);
      
      // Summary Statistics
      const totalShifts = shifts.length;
      const totalHours = shifts.reduce((sum, shift) => sum + shift.duration_hours, 0);
      const totalCash = shifts.reduce((sum, shift) => sum + shift.cash_total, 0);
      const totalPOS = shifts.reduce((sum, shift) => sum + shift.pos_total, 0);
      const totalCollected = totalCash + totalPOS;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Daily Summary', 20, 65);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Shifts: ${totalShifts}`, 20, 80);
      doc.text(`Total Hours: ${totalHours.toFixed(2)}`, 20, 90);
      doc.text(`Total Cash: $${totalCash.toFixed(2)}`, 20, 100);
      doc.text(`Total POS: $${totalPOS.toFixed(2)}`, 20, 110);
      doc.text(`Total Collected: $${totalCollected.toFixed(2)}`, 20, 120);
      
      // Individual Shifts
      doc.setFont('helvetica', 'bold');
      doc.text('Individual Shifts', 20, 140);
      
      let yPosition = 155;
      shifts.forEach((shift, index) => {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 30;
        }
        
        doc.setFont('helvetica', 'normal');
        doc.text(`${index + 1}. ${shift.staff_name} (${shift.role})`, 20, yPosition);
        doc.text(`   Duration: ${shift.duration_hours.toFixed(2)}h`, 25, yPosition + 8);
        doc.text(`   Collected: $${shift.total_collected.toFixed(2)}`, 25, yPosition + 16);
        
        if (shift.unresolved_items.length > 0) {
          doc.text(`   Unresolved: ${shift.unresolved_items.length} items`, 25, yPosition + 24);
          yPosition += 32;
        } else {
          yPosition += 24;
        }
      });
      
      // Generate filename and download
      const filename = `daily-shifts-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      return { success: true, filename };
    }
  });

  return {
    generateShiftReport,
    generateDailyShiftsReport
  };
};