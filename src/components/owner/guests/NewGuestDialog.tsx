import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Save, X } from 'lucide-react';
import { useCreateGuest } from '@/hooks/useApi';

interface NewGuestDialogProps {
  onClose: () => void;
  onGuestCreated: (guest: any) => void;
}

export default function NewGuestDialog({ onClose, onGuestCreated }: NewGuestDialogProps) {
  const [guestData, setGuestData] = useState({
    name: '',
    email: '',
    phone: '',
    nationality: ''
  });

  const createGuest = useCreateGuest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createGuest.mutateAsync(guestData);
      onGuestCreated(result.data);
    } catch (error) {
      console.error('Error creating guest:', error);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Guest
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={guestData.name}
              onChange={(e) => setGuestData({...guestData, name: e.target.value})}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={guestData.phone}
              onChange={(e) => setGuestData({...guestData, phone: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={guestData.email}
              onChange={(e) => setGuestData({...guestData, email: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              value={guestData.nationality}
              onChange={(e) => setGuestData({...guestData, nationality: e.target.value})}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={createGuest.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createGuest.isPending ? 'Creating...' : 'Create Guest'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}