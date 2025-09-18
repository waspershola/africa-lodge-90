import { motion } from 'framer-motion';
import { Building2, DollarSign, Users, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

interface GlobalKPICardsProps {
  metrics: {
    overview: {
      totalRevenue: number;
      mrr: number;
      activeTenants: number;
      totalTenants: number;
      avgOccupancy: number;
      growthRate: number;
    };
  };
  onDrillDown?: (metric: string) => void;
}

export default function GlobalKPICards({ metrics, onDrillDown }: GlobalKPICardsProps) {
  const kpiCards = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: `₦${(metrics.overview.totalRevenue / 1000000).toFixed(1)}M`,
      icon: Building2,
      gradient: 'from-primary/5 to-primary/10',
      border: 'border-primary/20',
      textColor: 'text-primary',
      badge: {
        icon: TrendingUp,
        label: `+${metrics.overview.growthRate}%`,
        variant: 'success' as const,
        sublabel: 'MoM Growth'
      }
    },
    {
      id: 'mrr',
      title: 'Monthly Recurring Revenue',
      value: `₦${(metrics.overview.mrr / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      gradient: 'from-accent/5 to-accent/10',
      border: 'border-accent/20',
      textColor: 'text-accent',
      progress: {
        value: 85,
        label: '85% ARR'
      }
    },
    {
      id: 'tenants',
      title: 'Active Tenants',
      value: metrics.overview.activeTenants.toString(),
      icon: Users,
      gradient: 'from-success/5 to-success/10',
      border: 'border-success/20',
      textColor: 'text-success',
      sublabel: `of ${metrics.overview.totalTenants} total`,
      badge: {
        label: `${((metrics.overview.activeTenants / metrics.overview.totalTenants) * 100).toFixed(1)}%`,
        variant: 'outline' as const,
        sublabel: 'Active Rate'
      }
    },
    {
      id: 'health',
      title: 'Platform Health',
      value: `${metrics.overview.avgOccupancy}%`,
      icon: Activity,
      gradient: 'from-danger/5 to-danger/10',
      border: 'border-danger/20',
      textColor: 'text-danger',
      sublabel: 'Avg Occupancy',
      badge: {
        label: 'Optimal',
        variant: 'success' as const
      }
    }
  ];

  return (
    <motion.div 
      variants={fadeIn} 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {kpiCards.map((card) => (
        <Card 
          key={card.id}
          className={`modern-card bg-gradient-to-br ${card.gradient} ${card.border} cursor-pointer hover:shadow-luxury transition-all duration-300`}
          onClick={() => onDrillDown?.(card.id)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <card.icon className={`h-4 w-4 ${card.textColor}`} />
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.textColor}`}>
              {card.value}
            </div>
            
            {card.sublabel && (
              <div className="text-sm text-muted-foreground mt-1">
                {card.sublabel}
              </div>
            )}
            
            {card.badge && (
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  className={
                    card.badge.variant === 'success' 
                      ? 'bg-success/10 text-success border-success/20'
                      : card.badge.variant === 'outline'
                      ? 'border-success/30'
                      : ''
                  }
                >
                  {card.badge.icon && <card.badge.icon className="h-3 w-3 mr-1" />}
                  {card.badge.label}
                </Badge>
                {card.badge.sublabel && (
                  <span className="text-xs text-muted-foreground">
                    {card.badge.sublabel}
                  </span>
                )}
              </div>
            )}
            
            {card.progress && (
              <div className="flex items-center gap-2 mt-2">
                <Progress value={card.progress.value} className="flex-1 h-2" />
                <span className="text-xs text-muted-foreground">
                  {card.progress.label}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}