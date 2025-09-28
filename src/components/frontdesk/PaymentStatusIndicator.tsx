import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, AlertTriangle, CheckCircle, Clock, Ban } from "lucide-react";
import { usePaymentStatusManager, type PaymentStatusInfo, type PaymentStatus } from "@/hooks/usePaymentStatusManager";

interface PaymentStatusIndicatorProps {
  reservationId: string;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onPaymentClick?: () => void;
}

export const PaymentStatusIndicator = ({ 
  reservationId, 
  showDetails = false, 
  size = 'md',
  onPaymentClick 
}: PaymentStatusIndicatorProps) => {
  const { getPaymentStatus, getPaymentStatusBadge, checkPaymentRequired } = usePaymentStatusManager();
  const { data: paymentInfo, isLoading } = getPaymentStatus(reservationId);

  if (isLoading || !paymentInfo) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <Clock className="h-3 w-3 mr-1" />
        Loading...
      </Badge>
    );
  }

  const badgeProps = getPaymentStatusBadge(paymentInfo.status);
  const Icon = getStatusIcon(paymentInfo.status);

  if (!showDetails) {
    return (
      <Badge variant={badgeProps.variant} className={`${size === 'sm' ? 'text-xs' : ''} ${badgeProps.color}`}>
        <Icon className={`${size === 'sm' ? 'h-2 w-2' : 'h-3 w-3'} mr-1`} />
        {badgeProps.label}
      </Badge>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Badge variant={badgeProps.variant} className={badgeProps.color}>
            <Icon className="h-3 w-3 mr-1" />
            {badgeProps.label}
          </Badge>
          {paymentInfo.isOverdue && (
            <Badge variant="destructive" className="text-xs">
              {paymentInfo.daysSinceCheckout} days overdue
            </Badge>
          )}
        </div>
        
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Total Amount:</span>
            <span className="font-medium">₦{paymentInfo.totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Payments:</span>
            <span className="font-medium">₦{paymentInfo.totalPayments.toLocaleString()}</span>
          </div>
          {paymentInfo.balance > 0 && (
            <div className="flex justify-between border-t pt-1">
              <span className="font-medium">Balance:</span>
              <span className={`font-bold ${paymentInfo.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₦{paymentInfo.balance.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {paymentInfo.balance > 0 && onPaymentClick && (
          <Button 
            onClick={onPaymentClick}
            size="sm" 
            className="w-full mt-2"
            variant={paymentInfo.isOverdue ? "destructive" : "default"}
          >
            <CreditCard className="h-3 w-3 mr-1" />
            {paymentInfo.isOverdue ? 'Collect Overdue Payment' : 'Collect Payment'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const getStatusIcon = (status: PaymentStatus) => {
  switch (status) {
    case 'PAID':
      return CheckCircle;
    case 'PARTIAL':
      return AlertTriangle;
    case 'UNPAID':
      return CreditCard;
    case 'PAY_LATER':
      return Clock;
    case 'OVERDUE':
      return Ban;
    default:
      return AlertTriangle;
  }
};