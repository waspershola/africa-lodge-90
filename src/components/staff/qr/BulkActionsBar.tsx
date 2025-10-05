import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, CheckCircle, XCircle, X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  staffMembers: Array<{ id: string; name: string; role: string }>;
  onAssign: (staffId: string, notes?: string) => void;
  onComplete: (notes?: string) => void;
  onCancel: (notes?: string) => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  staffMembers,
  onAssign,
  onComplete,
  onCancel,
  onClearSelection,
}: BulkActionsBarProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [notes, setNotes] = useState('');

  const handleAssign = () => {
    if (selectedStaff) {
      onAssign(selectedStaff, notes || undefined);
      setShowAssignDialog(false);
      setSelectedStaff('');
      setNotes('');
    }
  };

  const handleComplete = () => {
    onComplete(notes || undefined);
    setShowCompleteDialog(false);
    setNotes('');
  };

  const handleCancel = () => {
    onCancel(notes || undefined);
    setShowCancelDialog(false);
    setNotes('');
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-primary text-primary-foreground rounded-full shadow-lg px-6 py-3 flex items-center gap-4">
          <span className="font-medium">{selectedCount} selected</span>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowAssignDialog(true)}
              className="rounded-full"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Assign
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowCompleteDialog(true)}
              className="rounded-full"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Complete
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowCancelDialog(true)}
              className="rounded-full"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
              className="rounded-full hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Requests</DialogTitle>
            <DialogDescription>
              Assign {selectedCount} request(s) to a staff member
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Staff Member</label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any assignment notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedStaff}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Requests</DialogTitle>
            <DialogDescription>
              Mark {selectedCount} request(s) as completed
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Completion Notes (Optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any completion notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete}>
              Complete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Requests</DialogTitle>
            <DialogDescription>
              Cancel {selectedCount} request(s). This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Cancellation Reason</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain why these requests are being cancelled..."
              rows={3}
              required
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Back
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={!notes.trim()}>
              Cancel Requests
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
