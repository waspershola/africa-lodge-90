import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TouchOptimizedButtonProps extends ButtonProps {
  touchFeedback?: boolean;
}

export const TouchOptimizedButton = ({ 
  children, 
  className, 
  touchFeedback = true,
  ...props 
}: TouchOptimizedButtonProps) => {
  return (
    <Button
      className={cn(
        // Touch-friendly sizing
        "min-h-[44px] min-w-[44px] px-4 py-2",
        // Enhanced touch feedback
        touchFeedback && "active:scale-95 transition-transform duration-100",
        // Better contrast for mobile screens
        "text-base font-medium",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};