// @ts-nocheck
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, UserPlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GuestData {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
}

interface GuestSearchSelectProps {
  value: string;
  onSelect: (guestId: string, guestData: GuestData) => void;
  onCreateNew?: () => void;
  placeholder?: string;
}

export const GuestSearchSelect = ({
  value,
  onSelect,
  onCreateNew,
  placeholder = "Search guest by name, phone or email...",
}: GuestSearchSelectProps) => {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [persistentResults, setPersistentResults] = useState<GuestData[]>([]);

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch guests with search
  const { data: guests = [], isLoading, isFetching } = useQuery({
    queryKey: ['guests-search', tenantId, debouncedQuery],
    queryFn: async () => {
      if (!tenantId) return [];

      let query = supabase
        .from('guests')
        .select('id, first_name, last_name, email, phone, updated_at')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false })
        .limit(50);

      // Apply search filter
      if (debouncedQuery) {
        query = query.or(
          `first_name.ilike.%${debouncedQuery}%,last_name.ilike.%${debouncedQuery}%,email.ilike.%${debouncedQuery}%,phone.ilike.%${debouncedQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as GuestData[];
    },
    enabled: !!tenantId, // G++ Recovery: Always enabled when tenant exists (not dependent on popover open state)
    keepPreviousData: true, // G.5: Preserve previous results during refetch
    staleTime: 60000, // G.5: Keep data fresh for 1 minute
    refetchOnWindowFocus: (query) => {
      // G++ Recovery: Refetch if stale regardless of popover state
      const dataAge = Date.now() - (query.state.dataUpdatedAt || 0);
      const isStale = dataAge > 60000; // Older than 1 minute
      if (isStale) {
        console.log('[Guest Search] Tab visible and data stale, refetching...');
      }
      return isStale;
    },
  });

  // G++ Fix: Persist search results when popover closes
  useEffect(() => {
    if (guests.length > 0 && !isFetching) {
      setPersistentResults(guests);
    }
  }, [guests, isFetching]);

  // Use persistent results if popover is closed and we have them
  const displayGuests = open ? guests : (persistentResults.length > 0 ? persistentResults : guests);
  const selectedGuest = displayGuests.find((g) => g.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value && selectedGuest
            ? `${selectedGuest.first_name} ${selectedGuest.last_name}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type to search..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {(isLoading || isFetching) && debouncedQuery && (
              <div className="flex items-center justify-center p-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Searching guests...</span>
              </div>
            )}
            <CommandEmpty>
              {isLoading || isFetching ? "Searching..." : "No guests found."}
            </CommandEmpty>
            {displayGuests.length > 0 && (
              <CommandGroup heading="Guests">
                {displayGuests.map((guest) => (
                  <CommandItem
                    key={guest.id}
                    value={guest.id}
                    onSelect={() => {
                      onSelect(guest.id, guest);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === guest.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {guest.first_name} {guest.last_name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {guest.email || guest.phone || "No contact info"}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {onCreateNew && (
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    onCreateNew();
                    setOpen(false);
                  }}
                  className="text-primary"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create New Guest
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
