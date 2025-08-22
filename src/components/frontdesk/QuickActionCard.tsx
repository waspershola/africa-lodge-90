import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  subtitle?: string;
  isLoading?: boolean;
}

const variantStyles = {
  default: {
    card: 'border-border hover:border-border/80',
    icon: 'text-muted-foreground',
    value: 'text-foreground',
    button: 'bg-background hover:bg-muted'
  },
  primary: {
    card: 'border-primary/20 hover:border-primary/30 bg-primary/5',
    icon: 'text-primary',
    value: 'text-primary',
    button: 'bg-primary/10 hover:bg-primary/20 text-primary'
  },
  success: {
    card: 'border-success/20 hover:border-success/30 bg-success/5',
    icon: 'text-success',
    value: 'text-success',
    button: 'bg-success/10 hover:bg-success/20 text-success'
  },
  warning: {
    card: 'border-warning/20 hover:border-warning/30 bg-warning/5',
    icon: 'text-warning',
    value: 'text-warning',
    button: 'bg-warning/10 hover:bg-warning/20 text-warning'
  },
  destructive: {
    card: 'border-destructive/20 hover:border-destructive/30 bg-destructive/5',
    icon: 'text-destructive',
    value: 'text-destructive',
    button: 'bg-destructive/10 hover:bg-destructive/20 text-destructive'
  }
};

export default function QuickActionCard({
  title,
  value,
  icon: Icon,
  actionLabel,
  onAction,
  disabled = false,
  variant = 'default',
  subtitle,
  isLoading = false
}: QuickActionCardProps) {
  const styles = variantStyles[variant];

  const cardVariants = {
    idle: { scale: 1, y: 0 },
    hover: { scale: 1.02, y: -2 },
    tap: { scale: 0.98, y: 0 }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      transition={{ duration: 0.2 }}
    >
      <Card className={cn('modern-card cursor-pointer transition-all duration-300', styles.card)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Icon className={cn('h-4 w-4', styles.icon)} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Main Value */}
          <div className={cn('text-3xl font-bold', styles.value)}>
            {isLoading ? (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="h-8 w-16 bg-muted rounded"
              />
            ) : (
              value
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div className="text-xs text-muted-foreground">
              {subtitle}
            </div>
          )}

          {/* Action Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onAction}
            disabled={disabled || isLoading}
            className={cn('w-full justify-center font-medium', styles.button)}
          >
            {actionLabel}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}