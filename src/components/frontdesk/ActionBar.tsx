import { Button } from "@/components/ui/button";
import { 
  Plus,
  UserPlus,
  Calendar,
  CreditCard,
  Search,
  MoreHorizontal,
  Filter
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActionBarProps {
  onAction: (action: string) => void;
}

export const ActionBar = ({ onAction }: ActionBarProps) => {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button 
          className="bg-gradient-primary hover:bg-gradient-primary/90" 
          onClick={() => onAction('new-reservation')}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Reservation
        </Button>
        
        <Button variant="outline" onClick={() => onAction('group-booking')}>
          <UserPlus className="h-4 w-4 mr-2" />
          Group Booking
        </Button>
        
        <Button variant="outline" onClick={() => onAction('reservations')}>
          <Calendar className="h-4 w-4 mr-2" />
          Reservations
        </Button>
        
        <Button variant="outline" onClick={() => onAction('collect-payment')}>
          <CreditCard className="h-4 w-4 mr-2" />
          Collect Payment
        </Button>
        
        <Button variant="outline" onClick={() => onAction('guest-directory')}>
          <Search className="h-4 w-4 mr-2" />
          Guest Directory
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal className="h-4 w-4 mr-2" />
              More Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => onAction('extend-stay')}>
              Extend Stay
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('transfer-room')}>
              Transfer Room
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('add-service')}>
              Add Service
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('work-order')}>
              Create Work Order
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('housekeeping')}>
              Housekeeping Request
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};