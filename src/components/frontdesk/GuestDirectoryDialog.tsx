import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  User,
  Eye,
  Filter
} from "lucide-react";
import { useGuestSearch, useRecentGuests } from "@/hooks/useGuestSearch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface GuestDirectoryDialogProps {
  onSelectGuest?: (guest: any) => void;
}

export function GuestDirectoryDialog({ onSelectGuest }: GuestDirectoryDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [vipFilter, setVipFilter] = useState("all");
  
  const { data: searchResults, isLoading: searching } = useGuestSearch(searchQuery);
  const { data: recentGuests, isLoading: loadingRecent } = useRecentGuests();
  
  const guests = searchQuery.length >= 2 ? searchResults : recentGuests;

  const filteredGuests = guests?.filter(guest => {
    if (vipFilter === "all") return true;
    return guest.vip_status === vipFilter;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getVipBadge = (status?: string) => {
    switch (status) {
      case 'vip':
        return <Badge className="bg-gradient-primary">VIP</Badge>;
      case 'corporate':
        return <Badge variant="outline" className="border-primary">Corporate</Badge>;
      case 'loyalty':
        return <Badge variant="secondary">Loyalty</Badge>;
      default:
        return <Badge variant="outline">Regular</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={vipFilter} onValueChange={setVipFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Guests</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="corporate">Corporate</SelectItem>
            <SelectItem value="loyalty">Loyalty</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Guest List */}
      <ScrollArea className="h-[500px]">
        {searching || loadingRecent ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredGuests && filteredGuests.length > 0 ? (
          <div className="space-y-3">
            {filteredGuests.map((guest) => (
              <Card key={guest.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(guest.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{guest.name}</h3>
                            {getVipBadge(guest.vip_status)}
                            {guest.current_room && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Room {guest.current_room}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {guest.nationality || "Nationality not specified"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{guest.phone || "N/A"}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{guest.email || "N/A"}</span>
                        </div>

                        {guest.last_stay_date && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Last stay: {format(new Date(guest.last_stay_date), 'MMM dd, yyyy')}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{guest.total_stays} stay{guest.total_stays !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelectGuest?.(guest)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              {searchQuery.length >= 2
                ? "No guests found matching your search"
                : "Start typing to search for guests"}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
