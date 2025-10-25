// @ts-nocheck
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GuestReliabilityData {
  id: string;
  first_name: string;
  last_name: string;
  reliability_score: number;
  total_stays: number;
  successful_stays: number;
  no_show_count: number;
  late_arrival_count: number;
  vip_status: string;
  last_stay_date: string | null;
  total_spent: number;
}

export const useGuestReliability = (tenantId: string) => {
  const { data: guests, isLoading, error } = useQuery({
    queryKey: ['guest-reliability', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('reliability_score', { ascending: false });

      if (error) throw error;
      return data as GuestReliabilityData[];
    },
    enabled: !!tenantId
  });

  const updateGuestReliability = async (guestId: string, outcome: 'successful' | 'no_show' | 'late_arrival') => {
    const { data: guest, error: fetchError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();

    if (fetchError) throw fetchError;

    let updates: any = {
      total_stays: guest.total_stays + 1,
      last_stay_date: new Date().toISOString().split('T')[0]
    };

    switch (outcome) {
      case 'successful':
        updates.successful_stays = guest.successful_stays + 1;
        break;
      case 'no_show':
        updates.no_show_count = guest.no_show_count + 1;
        break;
      case 'late_arrival':
        updates.late_arrival_count = guest.late_arrival_count + 1;
        updates.successful_stays = guest.successful_stays + 1; // Still successful but late
        break;
    }

    // Calculate new reliability score
    const totalStays = updates.total_stays;
    const successRate = updates.successful_stays / totalStays;
    const noShowPenalty = updates.no_show_count * 10; // -10 points per no-show
    const latePenalty = updates.late_arrival_count * 5; // -5 points per late arrival

    updates.reliability_score = Math.max(0, Math.min(100, 
      (successRate * 100) - noShowPenalty - latePenalty
    ));

    // Update VIP status based on spending and reliability
    if (guest.total_spent >= 500000 && updates.reliability_score >= 80) {
      updates.vip_status = 'vip';
    } else if (guest.total_spent >= 200000 && updates.reliability_score >= 70) {
      updates.vip_status = 'gold';
    } else if (guest.total_spent >= 100000 && updates.reliability_score >= 60) {
      updates.vip_status = 'silver';
    } else {
      updates.vip_status = 'regular';
    }

    const { error } = await supabase
      .from('guests')
      .update(updates)
      .eq('id', guestId);

    if (error) throw error;
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getReliabilityBadge = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 60) return { label: 'Good', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Poor', color: 'bg-red-100 text-red-800' };
  };

  const calculateRisk = (guest: GuestReliabilityData) => {
    const recentNoShows = guest.no_show_count > 2;
    const lowScore = guest.reliability_score < 60;
    const newGuest = guest.total_stays === 0;
    
    if (recentNoShows && lowScore) return 'high';
    if (recentNoShows || lowScore) return 'medium';
    if (newGuest) return 'medium';
    return 'low';
  };

  return {
    guests,
    isLoading,
    error,
    updateGuestReliability,
    getReliabilityColor,
    getReliabilityBadge,
    calculateRisk
  };
};