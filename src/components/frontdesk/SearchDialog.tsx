import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, User, BedDouble, Phone, Mail } from "lucide-react";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockSearchResults = [
  {
    id: 1,
    type: "guest",
    name: "John Doe",
    room: "201",
    phone: "+234 801 234 5678",
    email: "john@example.com",
    status: "checked-in"
  },
  {
    id: 2,
    type: "room",
    number: "305", 
    guest: "Jane Smith",
    type_name: "Deluxe Room",
    status: "occupied"
  },
  {
    id: 3,
    type: "guest",
    name: "Mike Wilson",
    room: "102",
    phone: "+234 802 345 6789", 
    email: "mike@example.com",
    status: "reserved"
  }
];

export const SearchDialog = ({ open, onOpenChange }: SearchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<typeof mockSearchResults>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      // Filter mock results based on query
      const filtered = mockSearchResults.filter(item =>
        item.name?.toLowerCase().includes(query.toLowerCase()) ||
        item.number?.toLowerCase().includes(query.toLowerCase()) ||
        item.phone?.includes(query) ||
        item.email?.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  };

  const handleResultClick = (result: any) => {
    console.log("Selected result:", result);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Guest/Room
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by guest name, room number, phone, or email..."
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.length === 0 && searchQuery.length > 2 && (
              <div className="text-center py-8 text-muted-foreground">
                No results found for "{searchQuery}"
              </div>
            )}
            
            {results.map((result) => (
              <div 
                key={result.id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {result.type === "guest" ? (
                        <User className="h-5 w-5 text-primary" />
                      ) : (
                        <BedDouble className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    
                    <div>
                      <div className="font-medium">
                        {result.type === "guest" ? result.name : `Room ${result.number}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.type === "guest" ? (
                          <div className="flex items-center gap-2">
                            <span>Room {result.room}</span>
                            {result.phone && (
                              <>
                                <span>•</span>
                                <Phone className="h-3 w-3" />
                                <span>{result.phone}</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <div>
                            {result.guest} • {result.type_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={
                      result.status === "checked-in" || result.status === "occupied" ? "default" :
                      result.status === "reserved" ? "secondary" : "outline"
                    }
                  >
                    {result.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};