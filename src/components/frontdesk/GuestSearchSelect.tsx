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
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
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

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch guests with search
  const { data: guests = [], isLoading } = useQuery({
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
    enabled: !!tenantId && open,
    keepPreviousData: true, // G.5: Preserve previous results during refetch
    staleTime: 60000, // G.5: Keep data fresh for 1 minute
  });

  const selectedGuest = guests.find((g) => g.id === value);

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
            <CommandEmpty>
              {isLoading ? "Searching..." : "No guests found."}
            </CommandEmpty>
            {guests.length > 0 && (
              <CommandGroup heading="Guests">
                {guests.map((guest) => (
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
