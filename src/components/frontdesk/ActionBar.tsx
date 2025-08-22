import { Button } from "@/components/ui/button";
import { 
  Plus,
  UserPlus,
  LogIn,
  LogOut,
  CreditCard,
  Search,
  MoreHorizontal,
  Filter,
  HelpCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActionBarProps {
  onAction: (action: string) => void;
  showKeyboardHelp: boolean;
  onToggleKeyboardHelp: () => void;
}

export const ActionBar = ({ onAction, showKeyboardHelp, onToggleKeyboardHelp }: ActionBarProps) => {
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
        
        <Button variant="outline" onClick={() => onAction('assign-room')}>
          <UserPlus className="h-4 w-4 mr-2" />
          Assign Room
          <kbd className="ml-2 text-xs bg-muted px-1 rounded">A</kbd>
        </Button>
        
        <Button variant="outline" onClick={() => onAction('check-in')}>
          <LogIn className="h-4 w-4 mr-2" />
          Check-In
          <kbd className="ml-2 text-xs bg-muted px-1 rounded">I</kbd>
        </Button>
        
        <Button variant="outline" onClick={() => onAction('check-out')}>
          <LogOut className="h-4 w-4 mr-2" />
          Check-Out
          <kbd className="ml-2 text-xs bg-muted px-1 rounded">O</kbd>
        </Button>
        
        <Button variant="outline" onClick={() => onAction('collect-payment')}>
          <CreditCard className="h-4 w-4 mr-2" />
          Collect Payment
        </Button>
        
        <Button variant="outline" onClick={() => onAction('search')}>
          <Search className="h-4 w-4 mr-2" />
          Search Guest/Room
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

        <div className="ml-auto">
          <Button 
            variant={showKeyboardHelp ? "default" : "ghost"}
            size="sm"
            onClick={onToggleKeyboardHelp}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>
        </div>
      </div>
    </div>
  );
};