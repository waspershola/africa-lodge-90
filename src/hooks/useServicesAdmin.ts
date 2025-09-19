import { useState, useEffect } from 'react';
import { 
  GlobalService, 
  ServicePricingTemplate, 
  ServicePlanMapping, 
  TenantServiceConfig, 
  ServiceAuditLog, 
  SubscriptionPlan,
  DEFAULT_SERVICES,
  DEFAULT_PRICING_TEMPLATES,
  PLAN_SERVICE_MAPPINGS
} from '@/types/services';

export const useServicesAdmin = () => {
  const [services, setServices] = useState<GlobalService[]>([]);
  const [pricingTemplates, setPricingTemplates] = useState<ServicePricingTemplate[]>([]);
  const [planMappings, setPlanMappings] = useState<ServicePlanMapping[]>([]);
  const [tenantConfigs, setTenantConfigs] = useState<TenantServiceConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<ServiceAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data initialization
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Initialize with default services
        const mockServices: GlobalService[] = DEFAULT_SERVICES.map((service, index) => ({
          ...service,
          id: `service-${index + 1}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'system'
        }));

        const mockPricingTemplates: ServicePricingTemplate[] = DEFAULT_PRICING_TEMPLATES.map((template, index) => ({
          ...template,
          id: `template-${index + 1}`
        }));

        const mockPlanMappings: ServicePlanMapping[] = PLAN_SERVICE_MAPPINGS.map((mapping, index) => ({
          ...mapping,
          id: `mapping-${index + 1}`,
          created_at: new Date().toISOString()
        }));

        // Mock tenant configurations
        const mockTenantConfigs: TenantServiceConfig[] = [
          {
            id: 'config-1',
            tenant_id: 'hotel-1',
            service_code: 'SERVICE_RS',
            enabled: true,
            plan: 'pro',
            trial_mode: false,
            custom_pricing: [],
            restrictions: {},
            usage_stats: {
              total_requests: 1250,
              monthly_requests: 180,
              peak_usage_date: '2025-01-15',
              average_response_time: 4.2,
              customer_satisfaction: 4.8,
              revenue_generated: 125000
            },
            activated_at: '2025-01-01T00:00:00Z',
            activated_by: 'owner-1'
          },
          {
            id: 'config-2',
            tenant_id: 'hotel-2',
            service_code: 'SERVICE_HK',
            enabled: true,
            plan: 'basic',
            trial_mode: true,
            trial_expires_at: '2025-02-01T00:00:00Z',
            custom_pricing: [],
            restrictions: { max_requests_per_day: 10 },
            usage_stats: {
              total_requests: 45,
              monthly_requests: 45,
              peak_usage_date: '2025-01-20',
              average_response_time: 2.1,
              customer_satisfaction: 4.5,
              revenue_generated: 0
            },
            activated_at: '2025-01-15T00:00:00Z',
            activated_by: 'owner-2'
          }
        ];

        // Mock audit logs
        const mockAuditLogs: ServiceAuditLog[] = [
          {
            id: 'audit-1',
            action: 'service_created',
            service_code: 'SERVICE_AI_CONCIERGE',
            performed_by: 'super-admin-1',
            performed_at: '2025-01-18T10:30:00Z',
            details: { service_name: 'AI Concierge', status: 'beta' },
            ip_address: '192.168.1.1'
          },
          {
            id: 'audit-2',
            action: 'pricing_updated',
            service_code: 'SERVICE_RS',
            performed_by: 'super-admin-1',
            performed_at: '2025-01-19T14:15:00Z',
            details: { item: 'Delivery Fee' },
            old_values: { baseline_price: 500 },
            new_values: { baseline_price: 600 },
            ip_address: '192.168.1.1'
          },
          {
            id: 'audit-3',
            action: 'tenant_enabled',
            service_code: 'SERVICE_EVENTS',
            tenant_id: 'hotel-1',
            performed_by: 'super-admin-1',
            performed_at: '2025-01-19T16:45:00Z',
            details: { plan: 'pro', trial_mode: false },
            ip_address: '192.168.1.1'
          }
        ];

        setServices(mockServices);
        setPricingTemplates(mockPricingTemplates);
        setPlanMappings(mockPlanMappings);
        setTenantConfigs(mockTenantConfigs);
        setAuditLogs(mockAuditLogs);
        
        setError(null);
      } catch (err) {
        setError('Failed to load services data');
        console.error('Error loading services:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const createService = async (serviceData: Omit<GlobalService, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const newService: GlobalService = {
        ...serviceData,
        id: `service-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'current-user'
      };

      setServices(prev => [...prev, newService]);
      
      // Add audit log
      const auditLog: ServiceAuditLog = {
        id: `audit-${Date.now()}`,
        action: 'service_created',
        service_code: newService.code,
        performed_by: 'current-user',
        performed_at: new Date().toISOString(),
        details: { service_name: newService.name, status: newService.status }
      };
      setAuditLogs(prev => [auditLog, ...prev]);

      return newService;
    } catch (err) {
      setError('Failed to create service');
      throw err;
    }
  };

  const updateService = async (serviceId: string, updates: Partial<GlobalService>) => {
    try {
      const oldService = services.find(s => s.id === serviceId);
      if (!oldService) throw new Error('Service not found');

      const updatedService = {
        ...oldService,
        ...updates,
        updated_at: new Date().toISOString()
      };

      setServices(prev => prev.map(s => s.id === serviceId ? updatedService : s));

      // Add audit log
      const auditLog: ServiceAuditLog = {
        id: `audit-${Date.now()}`,
        action: 'service_updated',
        service_code: oldService.code,
        performed_by: 'current-user',
        performed_at: new Date().toISOString(),
        details: { updated_fields: Object.keys(updates) },
        old_values: updates,
        new_values: updates
      };
      setAuditLogs(prev => [auditLog, ...prev]);

      return updatedService;
    } catch (err) {
      setError('Failed to update service');
      throw err;
    }
  };

  const updatePricingTemplate = async (templateId: string, updates: Partial<ServicePricingTemplate>) => {
    try {
      const oldTemplate = pricingTemplates.find(t => t.id === templateId);
      if (!oldTemplate) throw new Error('Template not found');

      const updatedTemplate = { ...oldTemplate, ...updates };
      setPricingTemplates(prev => prev.map(t => t.id === templateId ? updatedTemplate : t));

      // Add audit log
      const auditLog: ServiceAuditLog = {
        id: `audit-${Date.now()}`,
        action: 'pricing_updated',
        service_code: oldTemplate.service_code,
        performed_by: 'current-user',
        performed_at: new Date().toISOString(),
        details: { item: oldTemplate.item_name },
        old_values: { baseline_price: oldTemplate.baseline_price },
        new_values: { baseline_price: updates.baseline_price }
      };
      setAuditLogs(prev => [auditLog, ...prev]);

      return updatedTemplate;
    } catch (err) {
      setError('Failed to update pricing template');
      throw err;
    }
  };

  const toggleServiceForTenant = async (tenantId: string, serviceCode: string, enabled: boolean) => {
    try {
      const existingConfig = tenantConfigs.find(
        config => config.tenant_id === tenantId && config.service_code === serviceCode
      );

      if (existingConfig) {
        const updatedConfig = { ...existingConfig, enabled };
        setTenantConfigs(prev => prev.map(c => 
          c.tenant_id === tenantId && c.service_code === serviceCode ? updatedConfig : c
        ));
      } else {
        // Create new config
        const newConfig: TenantServiceConfig = {
          id: `config-${Date.now()}`,
          tenant_id: tenantId,
          service_code: serviceCode,
          enabled,
          plan: 'basic',
          trial_mode: false,
          custom_pricing: [],
          restrictions: {},
          usage_stats: {
            total_requests: 0,
            monthly_requests: 0,
            peak_usage_date: '',
            average_response_time: 0,
            customer_satisfaction: 0,
            revenue_generated: 0
          },
          activated_at: new Date().toISOString(),
          activated_by: 'current-user'
        };
        setTenantConfigs(prev => [...prev, newConfig]);
      }

      // Add audit log
      const auditLog: ServiceAuditLog = {
        id: `audit-${Date.now()}`,
        action: enabled ? 'tenant_enabled' : 'tenant_disabled',
        service_code: serviceCode,
        tenant_id: tenantId,
        performed_by: 'current-user',
        performed_at: new Date().toISOString(),
        details: { action: enabled ? 'enabled' : 'disabled' }
      };
      setAuditLogs(prev => [auditLog, ...prev]);

    } catch (err) {
      setError(`Failed to ${enabled ? 'enable' : 'disable'} service for tenant`);
      throw err;
    }
  };

  const getServicesByPlan = (plan: SubscriptionPlan) => {
    const planServiceCodes = planMappings
      .filter(mapping => mapping.plan === plan && mapping.included)
      .map(mapping => mapping.service_code);
    
    return services.filter(service => planServiceCodes.includes(service.code));
  };

  const getTenantServices = (tenantId: string) => {
    return tenantConfigs.filter(config => config.tenant_id === tenantId);
  };

  return {
    // Data
    services,
    pricingTemplates,
    planMappings,
    tenantConfigs,
    auditLogs,
    
    // State
    isLoading,
    error,
    
    // Actions
    createService,
    updateService,
    updatePricingTemplate,
    toggleServiceForTenant,
    
    // Helpers
    getServicesByPlan,
    getTenantServices
  };
};