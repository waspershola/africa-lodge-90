import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { subMonths, format } from 'date-fns';

export function usePowerLogs(period: 'day' | 'week' | 'month' = 'month') {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: ['power-logs', tenantId, period],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      const now = new Date();
      const daysAgo = period === 'day' ? 1 : period === 'week' ? 7 : 30;
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('power_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('reading_date', format(startDate, 'yyyy-MM-dd'))
        .order('reading_date', { ascending: true });

      if (error) throw error;

      const totalConsumption = data?.reduce((sum, log) => sum + (log.consumption_kwh || 0), 0) || 0;
      const totalCost = data?.reduce((sum, log) => sum + (log.total_cost || 0), 0) || 0;
      const avgConsumption = data?.length ? totalConsumption / data.length : 0;
      const peakDemand = Math.max(...(data?.map(log => log.consumption_kwh || 0) || [0]));

      return {
        logs: data || [],
        stats: {
          currentLoad: data?.[data.length - 1]?.consumption_kwh || 0,
          totalConsumption,
          totalCost,
          avgConsumption,
          peakDemand,
          powerFactor: 0.92,
        },
      };
    },
    enabled: !!tenantId,
  });
}

export function useFuelLogs(months = 3) {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: ['fuel-logs', tenantId, months],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      const startDate = subMonths(new Date(), months);
      const { data, error } = await supabase
        .from('fuel_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('log_date', format(startDate, 'yyyy-MM-dd'))
        .order('log_date', { ascending: false });

      if (error) throw error;

      const totalQuantity = data?.reduce((sum, log) => sum + (log.quantity_liters || 0), 0) || 0;
      const totalCost = data?.reduce((sum, log) => sum + (log.total_cost || 0), 0) || 0;
      const avgCostPerLiter = totalQuantity > 0 ? totalCost / totalQuantity : 0;

      const dieselLogs = data?.filter(log => log.fuel_type === 'diesel') || [];
      const gasLogs = data?.filter(log => log.fuel_type === 'gas') || [];
      const latestDiesel = dieselLogs[0]?.quantity_liters || 0;
      const latestGas = gasLogs[0]?.quantity_liters || 0;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyUsage = data?.filter(log => new Date(log.log_date) >= thirtyDaysAgo)
        .reduce((sum, log) => sum + (log.quantity_liters || 0), 0) || 0;

      const dailyConsumptionRate = monthlyUsage / 30 || 10;
      const daysRemaining = Math.floor((latestDiesel + latestGas) / dailyConsumptionRate);

      return {
        logs: data || [],
        stats: { dieselLevel: latestDiesel, gasLevel: latestGas, monthlyUsage, daysRemaining, totalCost, avgCostPerLiter },
      };
    },
    enabled: !!tenantId,
  });
}

export function useUtilityCosts(months = 12) {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: ['utility-costs', tenantId, months],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      const startDate = subMonths(new Date(), months);
      const { data, error } = await supabase
        .from('utility_costs')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('cost_month', format(startDate, 'yyyy-MM-dd'))
        .order('cost_month', { ascending: false });

      if (error) throw error;

      const currentMonth = data?.[0] || null;
      const totalMonthly = currentMonth?.total_cost || 0;
      const powerCost = currentMonth?.electricity_cost || 0;
      const fuelCost = currentMonth?.fuel_cost || 0;
      const waterCost = currentMonth?.water_cost || 0;

      const yearStart = new Date(new Date().getFullYear(), 0, 1);
      const ytdData = data?.filter(cost => new Date(cost.cost_month) >= yearStart) || [];
      const ytdTotal = ytdData.reduce((sum, cost) => sum + (cost.total_cost || 0), 0);

      const breakdown = [
        { category: 'Electricity', amount: powerCost, percentage: (powerCost / totalMonthly) * 100 },
        { category: 'Fuel', amount: fuelCost, percentage: (fuelCost / totalMonthly) * 100 },
        { category: 'Water', amount: waterCost, percentage: (waterCost / totalMonthly) * 100 },
      ].filter(item => item.amount > 0);

      return {
        costs: data || [],
        stats: { totalMonthly, powerCost, fuelCost, waterCost, ytdTotal, breakdown },
      };
    },
    enabled: !!tenantId,
  });
}

export function useEnergyEfficiency() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;
  const { data: powerData } = usePowerLogs('month');
  const { data: costData } = useUtilityCosts(12);

  return useQuery({
    queryKey: ['energy-efficiency', tenantId, powerData, costData],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data: rooms } = await supabase.from('rooms').select('id').eq('tenant_id', tenantId);
      const totalRooms = rooms?.length || 1;
      const totalConsumption = powerData?.stats.totalConsumption || 0;
      const totalCost = costData?.stats.totalMonthly || 0;
      const energyIntensity = totalConsumption / totalRooms;
      const costPerRoom = totalCost / totalRooms;
      const baselineIntensity = 150;
      const efficiencyScore = Math.min(100, Math.max(0, 100 - ((energyIntensity - baselineIntensity) / baselineIntensity) * 100));
      const carbonFootprint = totalConsumption * 0.5;

      return {
        efficiencyScore: Math.round(efficiencyScore),
        energyIntensity: Math.round(energyIntensity * 10) / 10,
        costPerRoom: Math.round(costPerRoom),
        carbonFootprint: Math.round(carbonFootprint),
        renewablePercentage: 0,
        monthlyTrends: costData?.costs.slice(0, 6).reverse().map(cost => ({
          month: format(new Date(cost.cost_month), 'MMM yyyy'),
          efficiency: Math.round((1 - (cost.total_cost / (costData.stats.totalMonthly || 1))) * 100 + 70),
          baseline: 70,
          target: 85,
        })) || [],
      };
    },
    enabled: !!tenantId && !!powerData && !!costData,
  });
}

// Combined hook for utility components
export function useUtilitiesData() {
  const powerLogsQuery = usePowerLogs('month');
  const fuelLogsQuery = useFuelLogs(3);
  const utilityCostsQuery = useUtilityCosts(12);
  const energyEfficiencyQuery = useEnergyEfficiency();

  return {
    powerLogs: powerLogsQuery.data?.logs || [],
    powerStats: powerLogsQuery.data?.stats,
    fuelLogs: fuelLogsQuery.data?.logs || [],
    fuelStats: fuelLogsQuery.data?.stats,
    utilityCosts: utilityCostsQuery.data?.costs || [],
    costStats: utilityCostsQuery.data?.stats,
    energyMetrics: energyEfficiencyQuery.data || {},
    isLoading: powerLogsQuery.isLoading || fuelLogsQuery.isLoading || 
               utilityCostsQuery.isLoading || energyEfficiencyQuery.isLoading,
    error: powerLogsQuery.error || fuelLogsQuery.error || 
           utilityCostsQuery.error || energyEfficiencyQuery.error,
  };
}
