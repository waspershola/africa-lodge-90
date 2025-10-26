// @ts-nocheck
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  return useQuery({
    queryKey: ['guest-search', searchTerm],
    meta: { 
      priority: 'high',
      maxAge: 60000 // 1 minute
    },
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
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
    enabled: searchTerm.length >= 2,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

export const useRecentGuests = () => {
  return useQuery({
    queryKey: ['recent-guests'],
    meta: { 
      priority: 'high',
      maxAge: 60000 // 1 minute
    },
    queryFn: async () => {
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
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};