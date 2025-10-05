import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Calendar,
  Phone,
  Mail,
  Building2,
  Plus,
  Trash2,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

export function GroupBookingDialog() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("create");
  
  // Form state
  const [groupName, setGroupName] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [organizerPhone, setOrganizerPhone] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [totalRooms, setTotalRooms] = useState("1");
  const [totalGuests, setTotalGuests] = useState("1");
  const [paymentMode, setPaymentMode] = useState("organizer_pays");
  const [specialRequests, setSpecialRequests] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Group Booking Created",
      description: `${groupName} - ${totalRooms} rooms reserved`,
    });
    
    // Reset form
    setGroupName("");
    setOrganizerName("");
    setOrganizerEmail("");
    setOrganizerPhone("");
    setCheckIn("");
    setCheckOut("");
    setTotalRooms("1");
    setTotalGuests("1");
    setPaymentMode("organizer_pays");
    setSpecialRequests("");
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Group Booking</TabsTrigger>
          <TabsTrigger value="manage">Manage Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4 mt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Group Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Group Name *</Label>
                    <Input
                      id="groupName"
                      placeholder="e.g., XYZ Corp Annual Retreat"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="groupCode">Group Code (Optional)</Label>
                    <Input
                      id="groupCode"
                      placeholder="e.g., XYZ2024"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalRooms">Total Rooms *</Label>
                    <Input
                      id="totalRooms"
                      type="number"
                      min="1"
                      value={totalRooms}
                      onChange={(e) => setTotalRooms(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalGuests">Total Guests *</Label>
                    <Input
                      id="totalGuests"
                      type="number"
                      min="1"
                      value={totalGuests}
                      onChange={(e) => setTotalGuests(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organizer Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Organizer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizerName">Full Name *</Label>
                    <Input
                      id="organizerName"
                      placeholder="John Doe"
                      value={organizerName}
                      onChange={(e) => setOrganizerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organizerPhone">Phone Number *</Label>
                    <Input
                      id="organizerPhone"
                      type="tel"
                      placeholder="+234 800 000 0000"
                      value={organizerPhone}
                      onChange={(e) => setOrganizerPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizerEmail">Email Address *</Label>
                  <Input
                    id="organizerEmail"
                    type="email"
                    placeholder="john.doe@company.com"
                    value={organizerEmail}
                    onChange={(e) => setOrganizerEmail(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stay Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Stay Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn">Check-in Date *</Label>
                    <Input
                      id="checkIn"
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="checkOut">Check-out Date *</Label>
                    <Input
                      id="checkOut"
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMode">Payment Mode *</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="organizer_pays">Organizer Pays All</SelectItem>
                      <SelectItem value="individual_pays">Each Guest Pays</SelectItem>
                      <SelectItem value="split_billing">Split Billing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialRequests">Special Requests</Label>
                  <Textarea
                    id="specialRequests"
                    placeholder="Any special requirements for the group..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Group Booking
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4 mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {/* Sample group bookings */}
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">XYZ Corp Annual Retreat</h3>
                        <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>15 rooms • 30 guests</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Jan 15-20, 2024</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>+234 800 000 0000</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>contact@xyzcorp.com</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No more group bookings found</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
