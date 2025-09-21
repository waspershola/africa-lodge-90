import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { TenantWithOwner } from '@/services/tenantService';

const roomSchema = z.object({
  room_number: z.string().min(1, 'Room number is required'),
  floor: z.number().min(1, 'Floor must be at least 1'),
});

type RoomForm = z.infer<typeof roomSchema>;

interface RoomManagementDialogProps {
  tenant: TenantWithOwner | null;
  isOpen: boolean;
  onClose: () => void;
  onRoomsUpdate: () => void;
}

export function RoomManagementDialog({ tenant, isOpen, onClose, onRoomsUpdate }: RoomManagementDialogProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<RoomForm>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      room_number: '',
      floor: 1,
    },
  });

  // Fetch rooms when dialog opens
  React.useEffect(() => {
    if (tenant && isOpen) {
      fetchRooms();
    }
  }, [tenant, isOpen]);

  const fetchRooms = async () => {
    if (!tenant) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .order('room_number');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RoomForm) => {
    if (!tenant) return;

    try {
      // Check if room already exists
      const existingRoom = rooms.find(r => r.room_number === data.room_number);
      if (existingRoom) {
        toast.error('Room number already exists');
        return;
      }

      const { error } = await supabase
        .from('rooms')
        .insert({
          tenant_id: tenant.tenant_id,
          room_number: data.room_number,
          floor: data.floor,
          status: 'available',
          room_type_id: '1ed74a0d-52d4-4399-87f4-55cf911c91df' // Default room type
        });

      if (error) throw error;

      toast.success('Room added successfully');
      form.reset();
      fetchRooms();
      onRoomsUpdate();
    } catch (error) {
      console.error('Error adding room:', error);
      toast.error('Failed to add room');
    }
  };

  const deleteRoom = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;

      toast.success('Room deleted successfully');
      fetchRooms();
      onRoomsUpdate();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete room');
    }
  };

  if (!tenant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Rooms - {tenant.hotel_name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add Room Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Room</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="room_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Number</FormLabel>
                          <FormControl>
                            <Input placeholder="101" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="floor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Floor</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Room
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Rooms List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Current Rooms ({rooms.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading rooms...</div>
              ) : rooms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No rooms found. Add some rooms to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((room) => (
                    <Card key={room.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Room {room.room_number}</h4>
                            <p className="text-sm text-muted-foreground">Floor {room.floor}</p>
                            <Badge variant="outline" className="mt-2">
                              {room.status}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete Room ${room.room_number}?`)) {
                                deleteRoom(room.id);
                              }
                            }}
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}