import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard, 
  FileText,
  Edit,
  Star,
  TrendingUp,
  X
} from "lucide-react";
import { useGuest, useGuestReservations, useUpdateGuest, UpdateGuestData } from "@/hooks/useGuests";
import { useCurrency } from "@/hooks/useCurrency";
import { format } from "date-fns";

interface GuestProfileProps {
  guestId: string;
  onClose: () => void;
}

export default function GuestProfile({ guestId, onClose }: GuestProfileProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<UpdateGuestData>>({});
  
  const { data: guest, isLoading } = useGuest(guestId);
  const { data: reservations = [] } = useGuestReservations(guestId);
  const updateGuest = useUpdateGuest();
  const { formatPrice } = useCurrency();

  if (isLoading) {
    return <div>Loading guest profile...</div>;
  }

  if (!guest) {
    return <div>Guest not found</div>;
  }

  const handleEditGuest = () => {
    setEditFormData({
      id: guest.id,
      first_name: guest.first_name,
      last_name: guest.last_name,
      email: guest.email || '',
      phone: guest.phone || '',
      nationality: guest.nationality || '',
      address: guest.address || '',
      city: guest.city || '',
      country: guest.country || '',
      postal_code: guest.postal_code || '',
      date_of_birth: guest.date_of_birth || '',
      id_type: guest.id_type || '',
      id_number: guest.id_number || '',
      vip_status: guest.vip_status as 'regular' | 'silver' | 'gold' | 'vip',
      notes: guest.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editFormData.id) return;
    try {
      await updateGuest.mutateAsync(editFormData as UpdateGuestData);
      setIsEditDialogOpen(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const getVipStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'gold': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Guest Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {guest.first_name} {guest.last_name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getVipStatusColor(guest.vip_status)}>
                      {guest.vip_status?.toUpperCase() || 'REGULAR'}
                    </Badge>
                    <Badge variant="outline">
                      {guest.total_stays || 0} stays
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEditGuest}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{guest.total_stays || 0}</div>
              <div className="text-sm text-muted-foreground">Total Stays</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{formatPrice(guest.total_spent || 0)}</div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {guest.total_stays > 0 ? formatPrice((guest.total_spent || 0) / guest.total_stays) : formatPrice(0)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Per Stay</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {guest.last_stay_date ? format(new Date(guest.last_stay_date), 'MMM yyyy') : 'Never'}
              </div>
              <div className="text-sm text-muted-foreground">Last Stay</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for detailed information */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Personal Details</TabsTrigger>
            <TabsTrigger value="history">Booking History</TabsTrigger>
            <TabsTrigger value="notes">Notes & Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{guest.email || 'Not provided'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{guest.phone || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nationality</Label>
                    <span>{guest.nationality || 'Not provided'}</span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date of Birth</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{guest.date_of_birth ? format(new Date(guest.date_of_birth), 'PPP') : 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Address</Label>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      {guest.address && <div>{guest.address}</div>}
                      {(guest.city || guest.country) && (
                        <div>{guest.city}{guest.city && guest.country && ', '}{guest.country}</div>
                      )}
                      {guest.postal_code && <div>{guest.postal_code}</div>}
                      {!guest.address && !guest.city && !guest.country && 'Not provided'}
                    </div>
                  </div>
                </div>

                {guest.id_type && guest.id_number && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">ID Type</Label>
                      <span className="capitalize">{guest.id_type.replace('_', ' ')}</span>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">ID Number</Label>
                      <span>{guest.id_number}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Booking History</CardTitle>
              </CardHeader>
              <CardContent>
                {reservations.length > 0 ? (
                  <div className="space-y-4">
                    {reservations.map((reservation: any) => (
                      <div key={reservation.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            Room {reservation.rooms?.room_number || 'N/A'}
                          </div>
                          <Badge variant="outline">
                            {reservation.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {reservation.check_in_date && reservation.check_out_date && (
                            <div>
                              {format(new Date(reservation.check_in_date), 'PP')} - {format(new Date(reservation.check_out_date), 'PP')}
                            </div>
                          )}
                          <div className="font-medium">
                            {formatPrice(reservation.total_amount || 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No booking history found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Notes & Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                {guest.notes ? (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                      <p className="text-sm">{guest.notes}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No notes or preferences recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Guest Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Guest Profile</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_first_name">First Name</Label>
                <Input
                  id="edit_first_name"
                  value={editFormData.first_name || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_last_name">Last Name</Label>
                <Input
                  id="edit_last_name"
                  value={editFormData.last_name || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  type="tel"
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_vip_status">VIP Status</Label>
            <Select 
              value={editFormData.vip_status || 'regular'} 
              onValueChange={(value: 'regular' | 'silver' | 'gold' | 'vip') => setEditFormData(prev => ({ ...prev, vip_status: value }))}
            >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_address">Address</Label>
              <Input
                id="edit_address"
                value={editFormData.address || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_city">City</Label>
                <Input
                  id="edit_city"
                  value={editFormData.city || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_country">Country</Label>
                <Input
                  id="edit_country"
                  value={editFormData.country || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, country: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_postal_code">Postal Code</Label>
                <Input
                  id="edit_postal_code"
                  value={editFormData.postal_code || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_notes">Notes</Label>
              <Textarea
                id="edit_notes"
                placeholder="Additional notes about the guest..."
                value={editFormData.notes || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSaveEdit}
                className="flex-1"
                disabled={updateGuest.isPending}
              >
                {updateGuest.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={updateGuest.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}