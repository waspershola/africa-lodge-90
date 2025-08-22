import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, AlertCircle, Clock, Wrench, CreditCard, 
  CheckCircle, LogOut, DollarSign, Calendar,
  UserCheck, Settings, MoreHorizontal
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { Room } from './RoomGrid';

interface RoomTileProps {
  room: Room;
  isSelected: boolean;
  onSelect: () => void;
  onAction: (action: string) => void;
  isReadOnly?: boolean;
}

const statusConfig = {
  available: {
    color: 'bg-success border-success text-success-foreground',
    icon: CheckCircle,
    label: 'Available'
  },
  occupied: {
    color: 'bg-destructive border-destructive text-destructive-foreground',
    icon: User,
    label: 'Occupied'
  },
  reserved: {
    color: 'bg-primary border-primary text-primary-foreground',
    icon: Calendar,
    label: 'Reserved'
  },
  oos: {
    color: 'bg-warning border-warning text-warning-foreground',
    icon: Wrench,
    label: 'Out of Service'
  },
  overstay: {
    color: 'bg-purple-600 border-purple-600 text-white',
    icon: Clock,
    label: 'Overstay'
  }
};

const alertIcons = {
  id_missing: AlertCircle,
  deposit_due: CreditCard,
  cleaning_required: Settings,
  maintenance: Wrench
};

export default function RoomTile({ 
  room, 
  isSelected, 
  onSelect, 
  onAction, 
  isReadOnly = false 
}: RoomTileProps) {
  const [showDetails, setShowDetails] = useState(false);
  const config = statusConfig[room.status];
  const StatusIcon = config.icon;

  const getAvailableActions = () => {
    const actions = [];
    
    switch (room.status) {
      case 'available':
        actions.push(
          { key: 'assign', label: 'Assign Room', icon: UserCheck },
          { key: 'maintenance', label: 'Mark OOS', icon: Wrench }
        );
        break;
      case 'reserved':
        actions.push(
          { key: 'check_in', label: 'Check-In', icon: CheckCircle },
          { key: 'open_folio', label: 'View Reservation', icon: Calendar }
        );
        break;
      case 'occupied':
        actions.push(
          { key: 'check_out', label: 'Check-Out', icon: LogOut },
          { key: 'open_folio', label: 'Open Folio', icon: DollarSign },
          { key: 'collect_payment', label: 'Collect Payment', icon: CreditCard }
        );
        break;
      case 'overstay':
        actions.push(
          { key: 'check_out', label: 'Force Check-Out', icon: LogOut },
          { key: 'contact_guest', label: 'Contact Guest', icon: User },
          { key: 'collect_payment', label: 'Collect Payment', icon: CreditCard }
        );
        break;
      case 'oos':
        actions.push(
          { key: 'work_order', label: 'View Work Order', icon: Wrench },
          { key: 'mark_available', label: 'Mark Available', icon: CheckCircle }
        );
        break;
    }
    
    return actions;
  };

  const availableActions = getAvailableActions();

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative"
      >
        <Card 
          className={`
            cursor-pointer transition-all duration-200 h-24
            ${config.color}
            ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
            ${isReadOnly ? 'opacity-60' : 'hover:shadow-lg'}
          `}
          onClick={onSelect}
        >
          <CardContent className="p-3 h-full flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <StatusIcon className="h-3 w-3 flex-shrink-0" />
                  <h3 className="font-semibold text-sm truncate">
                    {room.number}
                  </h3>
                </div>
                <p className="text-xs opacity-90 truncate">
                  {room.type}
                </p>
              </div>
              
              {/* Alert indicators */}
              {room.alerts && room.alerts.length > 0 && (
                <div className="flex gap-1">
                  {room.alerts.slice(0, 2).map((alert, index) => {
                    const AlertIcon = alertIcons[alert.type];
                    return (
                      <AlertIcon 
                        key={index}
                        className="h-3 w-3 text-destructive-foreground bg-destructive/20 rounded-full p-0.5"
                      />
                    );
                  })}
                  {room.alerts.length > 2 && (
                    <Badge variant="destructive" className="h-4 w-4 p-0 text-[10px]">
                      +{room.alerts.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Guest info or status */}
            <div className="text-xs opacity-90">
              {room.guestName ? (
                <p className="truncate">{room.guestName}</p>
              ) : (
                <p>{config.label}</p>
              )}
            </div>

            {/* Quick action button */}
            {!isReadOnly && availableActions.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                className="absolute bottom-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  if (availableActions.length === 1) {
                    onAction(availableActions[0].key);
                  } else {
                    setShowDetails(true);
                  }
                }}
              >
                {availableActions.length === 1 ? (
                  React.createElement(availableActions[0].icon, { className: "h-3 w-3" })
                ) : (
                  <MoreHorizontal className="h-3 w-3" />
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Room Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StatusIcon className="h-5 w-5" />
              Room {room.number} - {room.type}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Status Badge */}
            <Badge className={config.color}>
              {config.label}
            </Badge>

            {/* Guest Information */}
            {room.guestName && (
              <div>
                <h4 className="font-medium text-sm mb-2">Guest Information</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {room.guestName}</p>
                  {room.checkInDate && (
                    <p><strong>Check-in:</strong> {new Date(room.checkInDate).toLocaleDateString()}</p>
                  )}
                  {room.checkOutDate && (
                    <p><strong>Check-out:</strong> {new Date(room.checkOutDate).toLocaleDateString()}</p>
                  )}
                  {room.revenue && (
                    <p><strong>Revenue:</strong> ₦{room.revenue.toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}

            {/* Alerts */}
            {room.alerts && room.alerts.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Alerts</h4>
                <div className="space-y-2">
                  {room.alerts.map((alert, index) => {
                    const AlertIcon = alertIcons[alert.type];
                    return (
                      <div key={index} className="flex items-start gap-2 p-2 bg-destructive/5 rounded-lg">
                        <AlertIcon className="h-4 w-4 text-destructive mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-destructive">
                            {alert.type.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            {!isReadOnly && availableActions.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium text-sm mb-3">Available Actions</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {availableActions.map((action) => {
                      const ActionIcon = action.icon;
                      return (
                        <Button
                          key={action.key}
                          variant="outline"
                          className="justify-start gap-2"
                          onClick={() => {
                            onAction(action.key);
                            setShowDetails(false);
                          }}
                        >
                          <ActionIcon className="h-4 w-4" />
                          {action.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}