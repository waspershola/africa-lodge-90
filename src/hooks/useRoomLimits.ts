import { usePricingPlans } from './usePricingPlans';

export const useRoomLimits = (planId: string) => {
  const { plans } = usePricingPlans();
  
  const selectedPlan = plans.find(plan => plan.id === planId);
  
  return {
    minRooms: selectedPlan?.room_capacity_min || 1,
    maxRooms: selectedPlan?.room_capacity_max || 9999,
    planName: selectedPlan?.name || 'Unknown Plan',
    canAddRoom: (currentRoomCount: number) => {
      if (!selectedPlan) return false;
      return currentRoomCount < selectedPlan.room_capacity_max;
    },
    roomLimitMessage: selectedPlan 
      ? `This plan allows ${selectedPlan.room_capacity_min}-${selectedPlan.room_capacity_max === 9999 ? '∞' : selectedPlan.room_capacity_max} rooms`
      : 'Room limits unavailable'
  };
};