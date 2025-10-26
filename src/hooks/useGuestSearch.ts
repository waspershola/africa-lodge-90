// @ts-nocheck
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface GuestSearchResult {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationality?: string;
  id_type?: string;
  id_number?: string;
  last_stay_date?: string;
  total_stays: number;
  vip_status?: string;
  current_room?: string;
  reservation_status?: string;
}

export const useGuestSearch = (searchTerm: string) => {
  // G.3: Get tenant context for proper filtering
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  const query = useQuery({
    queryKey: ['guest-search', tenantId, searchTerm], // G.3: Include tenant in key
    meta: { 
      priority: 'high',
      maxAge: 60000 // 1 minute
    },
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      // G.3: Early return if no tenant
      if (!tenantId) {
        console.warn('[Guest Search] No tenant ID, skipping search');
        return [];
      }

      const { data, error } = await supabase
        .from('guests')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          nationality,
          id_type,
          id_number,
          last_stay_date,
          total_stays,
          vip_status,
          reservations(
            id,
            room_id,
            status,
            rooms!reservations_room_id_fkey(room_number)
          )
        `)
        .eq('tenant_id', tenantId) // G.3: ADD TENANT FILTER
        .or(
          `first_name.ilike.%${searchTerm}%,` +
          `last_name.ilike.%${searchTerm}%,` +
          `email.ilike.%${searchTerm}%,` +
          `phone.ilike.%${searchTerm}%`
        )
        .order('last_stay_date', { ascending: false, nullsFirst: false });

      if (error) throw error;

      return data?.map(guest => {
        const currentReservation = guest.reservations?.find(
          res => res.status === 'checked_in' || res.status === 'confirmed'
        );

        return {
          id: guest.id,
          name: `${guest.first_name} ${guest.last_name}`,
          phone: guest.phone || '',
          email: guest.email || '',
          nationality: guest.nationality,
          id_type: guest.id_type,
          id_number: guest.id_number,
          last_stay_date: guest.last_stay_date,
          total_stays: guest.total_stays || 0,
          vip_status: guest.vip_status,
          current_room: currentReservation?.rooms?.room_number,
          reservation_status: currentReservation?.status
        };
      }) || [];
    },
    enabled: searchTerm.length >= 2 && !!tenantId, // G.3: Require tenant
    staleTime: 30000, // 30 seconds - shorter for fresher results
    gcTime: 2 * 60 * 1000, // 2 minutes cache
    refetchOnWindowFocus: true, // Always refetch on tab return for fresh data
    refetchOnMount: false, // Don't refetch on mount to use cache
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // G++.3: Refetch on visibility change for fresh data
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && searchTerm.length >= 2 && tenantId) {
        console.log('[Guest Search] Tab visible, refetching guest search...');
        query.refetch();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [searchTerm, tenantId]);

  return query;
};

export const useRecentGuests = () => {
  // G.3: Get tenant context for proper filtering
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  return useQuery({
    queryKey: ['recent-guests', tenantId], // G.3: Include tenant in key
    meta: { 
      priority: 'high',
      maxAge: 60000 // 1 minute
    },
    queryFn: async () => {
      // G.3: Early return if no tenant
      if (!tenantId) {
        console.warn('[Recent Guests] No tenant ID, skipping query');
        return [];
      }

      const { data, error } = await supabase
        .from('guests')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          nationality,
          id_type,
          id_number,
          last_stay_date,
          total_stays,
          vip_status
        `)
        .eq('tenant_id', tenantId) // G.3: ADD TENANT FILTER
        .not('last_stay_date', 'is', null)
        .order('last_stay_date', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data?.map(guest => ({
        id: guest.id,
        name: `${guest.first_name} ${guest.last_name}`,
        phone: guest.phone || '',
        email: guest.email || '',
        nationality: guest.nationality,
        id_type: guest.id_type,
        id_number: guest.id_number,
        last_stay_date: guest.last_stay_date,
        total_stays: guest.total_stays || 0,
        vip_status: guest.vip_status,
        current_room: undefined,
        reservation_status: undefined
      })) || [];
    },
    enabled: !!tenantId, // G.3: Require tenant
    staleTime: 60000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: true, // Refetch on tab return
    refetchOnMount: false, // Use cache on mount
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};