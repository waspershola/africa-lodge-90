// Pricing Control System Types
export interface PricingChange {
  id: string;
  serviceType: 'room-service' | 'housekeeping' | 'maintenance' | 'spa' | 'transport' | 'events';
  itemName: string;
  currentPrice: number;
  proposedPrice: number;
  changePercentage: number;
  changeAmount: number;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto-approved';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  effectiveDate: string;
  hotelId: string;
  roomType?: string[];
}

export interface DelegationRule {
  id: string;
  hotelId: string;
  serviceType: 'room-service' | 'housekeeping' | 'maintenance' | 'spa' | 'transport' | 'events' | 'all';
  itemCategory?: string;
  maxPercentageIncrease: number;
  maxPercentageDecrease: number;
  maxAmountIncrease: number;
  maxAmountDecrease: number;
  requiresApproval: boolean;
  autoApprovalEnabled: boolean;
  createdBy: string;
  updatedAt: string;
}

export interface ServicePricing {
  id: string;
  serviceType: string;
  itemName: string;
  basePrice: number;
  currentPrice: number;
  currency: 'NGN' | 'USD' | 'EUR';
  pricingModel: 'fixed' | 'dynamic' | 'tiered' | 'free';
  surchargeRules: SurchargeRule[];
  availability: AvailabilityRule;
  roomTypeRestrictions: string[];
  lastUpdated: string;
  updatedBy: string;
  status: 'active' | 'inactive' | 'pending-approval';
}

export interface SurchargeRule {
  type: 'time-based' | 'seasonal' | 'demand-based' | 'room-type' | 'bulk-discount';
  name: string;
  percentage: number;
  fixedAmount?: number;
  conditions: {
    timeRange?: { start: string; end: string };
    days?: string[];
    seasons?: string[];
    roomTypes?: string[];
    minimumQuantity?: number;
  };
  active: boolean;
}

export interface AvailabilityRule {
  enabled: boolean;
  timeRestrictions: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    days: string[];
  };
  seasonalAvailability: {
    enabled: boolean;
    seasons: Array<{
      name: string;
      startDate: string;
      endDate: string;
      available: boolean;
    }>;
  };
  roomTypeAvailability: string[];
  maxRequestsPerDay: number;
  advanceNoticeRequired: number; // minutes
  staffApprovalRequired: boolean;
}

export interface PricingAuditLog {
  id: string;
  action: 'price-change' | 'approval' | 'rejection' | 'delegation-rule-change' | 'auto-approval';
  entityType: 'service' | 'item' | 'rule';
  entityId: string;
  oldValue: any;
  newValue: any;
  performedBy: string;
  performedAt: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RevenueImpact {
  serviceType: string;
  itemName: string;
  oldPrice: number;
  newPrice: number;
  projectedImpact: number;
  actualImpact?: number;
  period: string;
  calculatedAt: string;
}

export interface ApprovalWorkflowState {
  pendingChanges: PricingChange[];
  delegationRules: DelegationRule[];
  auditLogs: PricingAuditLog[];
  revenueImpacts: RevenueImpact[];
}