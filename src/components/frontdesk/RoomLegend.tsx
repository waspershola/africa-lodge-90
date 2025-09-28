import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const RoomLegend = () => {
  const legends = [
    { color: 'bg-room-available text-room-available-foreground', label: 'Available', status: 'available' },
    { color: 'bg-room-occupied text-room-occupied-foreground', label: 'Occupied', status: 'occupied' },
    { color: 'bg-room-reserved text-room-reserved-foreground', label: 'Reserved', status: 'reserved' },
    { color: 'bg-room-dirty text-room-dirty-foreground', label: 'Dirty (Needs Cleaning)', status: 'dirty' },
    { color: 'bg-room-oos text-room-oos-foreground', label: 'Out of Service', status: 'oos' },
    { color: 'bg-room-overstay text-room-overstay-foreground', label: 'Overstay', status: 'overstay' },
  ];

  return (
    <Card className="luxury-card">
      <CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Room Status:</span>
          {legends.map((legend) => (
            <Badge 
              key={legend.status}
              className={`${legend.color} text-xs`}
              variant="secondary"
            >
              {legend.label}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};