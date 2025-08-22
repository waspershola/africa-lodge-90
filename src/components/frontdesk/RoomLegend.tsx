import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const RoomLegend = () => {
  const legends = [
    { color: 'bg-success text-success-foreground', label: 'Available', status: 'available' },
    { color: 'bg-destructive text-destructive-foreground', label: 'Occupied', status: 'occupied' },
    { color: 'bg-blue-500 text-white', label: 'Reserved', status: 'reserved' },
    { color: 'bg-orange-500 text-white', label: 'Out of Service', status: 'oos' },
    { color: 'bg-purple-500 text-white', label: 'Overstay', status: 'overstay' },
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