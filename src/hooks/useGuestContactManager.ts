// @ts-nocheck
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GuestContactData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  address?: string;
  dateOfBirth?: string;
  vipStatus?: string;
  preferences?: Record<string, any>;
  source: 'create_user' | 'check_in' | 'assign_room' | 'walk_in' | 'transfer' | 'reservation' | 'manual';
}

export interface GuestSearchOptions {
  query: string;
  searchBy?: 'name' | 'phone' | 'email' | 'all';
  includeInactive?: boolean;
  limit?: number;
}

export const useGuestContactManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-save or update guest contact information from any source
  const saveGuestContact = useMutation({
    mutationFn: async (contactData: GuestContactData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const tenantId = user.user_metadata?.tenant_id;
      if (!tenantId) throw new Error('No tenant ID found');

      // Prepare guest data for database
      const guestData = {
        first_name: contactData.firstName.trim(),
        last_name: contactData.lastName.trim(),
        email: contactData.email?.trim().toLowerCase() || null,
        phone: contactData.phone?.trim() || null,
        nationality: contactData.nationality || null,
        id_type: contactData.idType || null,
        id_number: contactData.idNumber || null,
        address: contactData.address || null,
        date_of_birth: contactData.dateOfBirth || null,
        vip_status: contactData.vipStatus || 'regular',
        preferences: contactData.preferences || {},
        tenant_id: tenantId,
        updated_at: new Date().toISOString()
      };

      // Try to find existing guest by email or phone (prioritizing email)
      let existingGuest = null;
      
      if (contactData.email) {
        const { data: emailGuest } = await supabase
          .from('guests')
          .select('id, first_name, last_name, total_stays, successful_stays')
          .eq('tenant_id', tenantId)
          .eq('email', contactData.email.toLowerCase())
          .maybeSingle();
        
        existingGuest = emailGuest;
      }

      // If no email match, try phone
      if (!existingGuest && contactData.phone) {
        const { data: phoneGuest } = await supabase
          .from('guests')
          .select('id, first_name, last_name, total_stays, successful_stays')
          .eq('tenant_id', tenantId)
          .eq('phone', contactData.phone)
          .maybeSingle();
        
        existingGuest = phoneGuest;
      }

      let result;
      
      if (existingGuest) {
        // Update existing guest - merge data intelligently
        const updateData = { ...guestData };
        
        // Don't overwrite existing data with empty values
        if (!contactData.email && existingGuest.first_name) delete updateData.email;
        if (!contactData.phone) delete updateData.phone;
        if (!contactData.nationality) delete updateData.nationality;
        if (!contactData.address) delete updateData.address;
        
        const { data: updatedGuest, error } = await supabase
          .from('guests')
          .update(updateData)
          .eq('id', existingGuest.id)
          .select(`
            id,
            first_name,
            last_name,
            email,
            phone,
            nationality,
            total_stays,
            last_stay_date,
            vip_status
          `)
          .single();

        if (error) throw error;
        result = { guest: updatedGuest, isNew: false };
      } else {
        // Create new guest
        const { data: newGuest, error } = await supabase
          .from('guests')
          .insert([guestData])
          .select(`
            id,
            first_name,
            last_name,
            email,
            phone,
            nationality,
            total_stays,
            last_stay_date,
            vip_status
          `)
          .single();

        if (error) throw error;
        result = { guest: newGuest, isNew: true };
      }

      // Log the contact save event for audit
      await supabase.from('audit_log').insert([{
        action: 'GUEST_CONTACT_SAVED',
        resource_type: 'GUEST',
        resource_id: result.guest.id,
        actor_id: user.id,
        tenant_id: tenantId,
        description: `Guest contact ${result.isNew ? 'created' : 'updated'} from ${contactData.source}`,
        metadata: {
          source: contactData.source,
          isNew: result.isNew,
          guestName: `${contactData.firstName} ${contactData.lastName}`,
          contactMethod: contactData.email ? 'email' : contactData.phone ? 'phone' : 'name'
        }
      }]);

      return result;
    },
    onSuccess: (data) => {
      // Invalidate guest-related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['guest-search'] });
      queryClient.invalidateQueries({ queryKey: ['recent-guests'] });
      
      toast({
        title: "Guest Contact Saved",
        description: `${data.guest.first_name} ${data.guest.last_name} contact information ${data.isNew ? 'created' : 'updated'} successfully.`,
      });
    },
    onError: (error) => {
      console.error('Error saving guest contact:', error);
      toast({
        title: "Error",
        description: "Failed to save guest contact information. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Enhanced search with multiple contact methods
  const searchGuestContacts = async (options: GuestSearchOptions) => {
    const { query, searchBy = 'all', includeInactive = false, limit = 20 } = options;
    
    if (!query || query.length < 2) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let searchQuery = supabase
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
        successful_stays,
        vip_status,
        preferences,
        is_blacklisted,
        reservations(
          id,
          status,
          check_in_date,
          check_out_date,
          room_id,
          rooms!reservations_room_id_fkey(room_number)
        )
      `)
      .eq('tenant_id', user.user_metadata?.tenant_id);

    // Apply search filters based on searchBy parameter
    switch (searchBy) {
      case 'phone':
        searchQuery = searchQuery.ilike('phone', `%${query}%`);
        break;
      case 'email':
        searchQuery = searchQuery.ilike('email', `%${query}%`);
        break;
      case 'name':
        searchQuery = searchQuery.or(
          `first_name.ilike.%${query}%,last_name.ilike.%${query}%`
        );
        break;
      default: // 'all'
        searchQuery = searchQuery.or(
          `first_name.ilike.%${query}%,` +
          `last_name.ilike.%${query}%,` +
          `email.ilike.%${query}%,` +
          `phone.ilike.%${query}%`
        );
    }

    if (!includeInactive) {
      searchQuery = searchQuery.eq('is_blacklisted', false);
    }

    const { data, error } = await searchQuery
      .order('last_stay_date', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw error;

    return data?.map(guest => {
      const currentReservation = guest.reservations?.find(
        res => res.status === 'checked_in' || res.status === 'confirmed'
      );

      return {
        id: guest.id,
        name: `${guest.first_name} ${guest.last_name}`,
        firstName: guest.first_name,
        lastName: guest.last_name,
        phone: guest.phone || '',
        email: guest.email || '',
        nationality: guest.nationality,
        id_type: guest.id_type,
        id_number: guest.id_number,
        last_stay_date: guest.last_stay_date,
        total_stays: guest.total_stays || 0,
        successful_stays: guest.successful_stays || 0,
        vip_status: guest.vip_status || 'regular',
        preferences: guest.preferences || {},
        is_blacklisted: guest.is_blacklisted,
        current_room: currentReservation?.rooms?.room_number,
        reservation_status: currentReservation?.status,
        // Reliability scoring
        reliability_score: guest.successful_stays && guest.total_stays 
          ? Math.round((guest.successful_stays / guest.total_stays) * 100)
          : 100
      };
    }) || [];
  };

  // Quick contact lookup for auto-fill scenarios
  const quickContactLookup = async (identifier: string, type: 'email' | 'phone') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('guests')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        nationality,
        vip_status,
        preferences
      `)
      .eq('tenant_id', user.user_metadata?.tenant_id)
      .eq(type, identifier)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      nationality: data.nationality,
      vip_status: data.vip_status,
      preferences: data.preferences
    };
  };

  return {
    saveGuestContact: saveGuestContact.mutate,
    saveGuestContactAsync: saveGuestContact.mutateAsync,
    isLoading: saveGuestContact.isPending,
    searchGuestContacts,
    quickContactLookup
  };
};