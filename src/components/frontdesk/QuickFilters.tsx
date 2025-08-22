import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface QuickFiltersProps {
  activeFilter?: string;
  onFilterChange: (filter: string | undefined) => void;
  statusCounts: Record<string, number>;
}

export const QuickFilters = ({ activeFilter, onFilterChange, statusCounts }: QuickFiltersProps) => {
  const filters = [
    { key: 'available', label: 'Available', count: statusCounts.available || 0, color: 'success' },
    { key: 'occupied', label: 'Occupied', count: statusCounts.occupied || 0, color: 'destructive' },
    { key: 'reserved', label: 'Reserved', count: statusCounts.reserved || 0, color: 'blue' },
    { key: 'oos', label: 'OOS', count: statusCounts.oos || 0, color: 'orange' },
    { key: 'overstay', label: 'Overstay', count: statusCounts.overstay || 0, color: 'purple' },
  ];

  const handleFilterClick = (filterKey: string) => {
    onFilterChange(activeFilter === filterKey ? undefined : filterKey);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground mr-2">Quick Filters:</span>
      {filters.map((filter) => (
        <motion.div
          key={filter.key}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant={activeFilter === filter.key ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterClick(filter.key)}
            className="h-8 px-3"
          >
            <span className="mr-2">{filter.label}</span>
            <Badge 
              variant="secondary" 
              className={`text-xs h-4 px-1 ${
                filter.color === 'success' ? 'bg-success/20 text-success' :
                filter.color === 'destructive' ? 'bg-destructive/20 text-destructive' :
                filter.color === 'blue' ? 'bg-blue-500/20 text-blue-600' :
                filter.color === 'orange' ? 'bg-orange-500/20 text-orange-600' :
                filter.color === 'purple' ? 'bg-purple-500/20 text-purple-600' :
                'bg-muted text-muted-foreground'
              }`}
            >
              {filter.count}
            </Badge>
          </Button>
        </motion.div>
      ))}
      {activeFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange(undefined)}
          className="text-muted-foreground"
        >
          Clear Filter
        </Button>
      )}
    </div>
  );
};