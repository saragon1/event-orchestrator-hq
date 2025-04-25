
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define proper types for our resources
interface Person {
  id: string;
  name: string;
  email: string;
  role: string | null;
  phone: string | null;
}

interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
  rating: number | null;
  address: string;
  phone: string | null;
  website: string | null;
}

export function useEventManagement(eventId: string) {
  const [availablePersons, setAvailablePersons] = useState<Person[]>([]);
  const [assignedPersons, setAssignedPersons] = useState<Person[]>([]);
  const [availableHotels, setAvailableHotels] = useState<Hotel[]>([]);
  const [assignedHotels, setAssignedHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState({
    persons: false,
    hotels: false
  });
  const { toast } = useToast();

  // Effect to load initial data when eventId changes
  useEffect(() => {
    if (eventId) {
      fetchAvailablePersons();
      fetchAssignedPersons();
      fetchAvailableHotels();
      fetchAssignedHotels();
    }
  }, [eventId]);

  const fetchAvailablePersons = async () => {
    if (!eventId) return;
    
    setIsLoading(prev => ({ ...prev, persons: true }));
    try {
      // First get all assigned person IDs for this event
      const { data: eventPersons, error: eventPersonsError } = await supabase
        .from('event_persons')
        .select('person_id')
        .eq('event_id', eventId);
      
      if (eventPersonsError) {
        throw eventPersonsError;
      }

      // Extract the IDs or use empty array if none found
      const assignedIds = eventPersons?.map(ep => ep.person_id) || [];

      // Now fetch all persons
      let query = supabase.from('persons').select('*');
      
      // Only apply the filter if there are assigned IDs
      if (assignedIds.length > 0) {
        // Fix: We need to pass the array directly, not as a comma-separated string
        query = query.not('id', 'in', `(${assignedIds.map(id => `"${id}"`).join(',')})`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      console.log('Available persons:', data);
      setAvailablePersons(data || []);
    } catch (error) {
      console.error('Error fetching available persons:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available persons",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, persons: false }));
    }
  };

  const fetchAssignedPersons = async () => {
    if (!eventId) return;
    
    setIsLoading(prev => ({ ...prev, persons: true }));
    try {
      const { data, error } = await supabase
        .from('event_persons')
        .select('persons:person_id(*)')
        .eq('event_id', eventId);
      
      if (error) {
        throw error;
      }
      
      const assignedPersonsData = data?.map(item => item.persons) || [];
      console.log('Assigned persons:', assignedPersonsData);
      setAssignedPersons(assignedPersonsData);
    } catch (error) {
      console.error('Error fetching assigned persons:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assigned persons",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, persons: false }));
    }
  };

  const assignPersonToEvent = async (personId: string) => {
    if (!eventId) return;
    
    try {
      const { error } = await supabase
        .from('event_persons')
        .insert({ event_id: eventId, person_id: personId });
      
      if (error) {
        throw error;
      }
      
      await Promise.all([
        fetchAvailablePersons(),
        fetchAssignedPersons()
      ]);
      
      toast({
        title: "Success",
        description: "Person assigned to event",
      });
    } catch (error) {
      console.error('Error assigning person to event:', error);
      toast({
        title: "Error",
        description: "Failed to assign person to event",
        variant: "destructive",
      });
    }
  };

  const removePersonFromEvent = async (personId: string) => {
    if (!eventId) return;
    
    try {
      const { error } = await supabase
        .from('event_persons')
        .delete()
        .eq('event_id', eventId)
        .eq('person_id', personId);
      
      if (error) {
        throw error;
      }
      
      await Promise.all([
        fetchAvailablePersons(),
        fetchAssignedPersons()
      ]);
      
      toast({
        title: "Success",
        description: "Person removed from event",
      });
    } catch (error) {
      console.error('Error removing person from event:', error);
      toast({
        title: "Error",
        description: "Failed to remove person from event",
        variant: "destructive",
      });
    }
  };

  const fetchAvailableHotels = async () => {
    if (!eventId) return;
    
    setIsLoading(prev => ({ ...prev, hotels: true }));
    try {
      // First get all assigned hotel IDs for this event
      const { data: eventHotels, error: eventHotelsError } = await supabase
        .from('event_hotels')
        .select('hotel_id')
        .eq('event_id', eventId);
      
      if (eventHotelsError) {
        throw eventHotelsError;
      }

      // Extract the IDs or use empty array if none found
      const assignedIds = eventHotels?.map(eh => eh.hotel_id) || [];

      // Now fetch all hotels
      let query = supabase.from('hotels').select('*');
      
      // Only apply the filter if there are assigned IDs
      if (assignedIds.length > 0) {
        // Fix: We need to pass the array directly, not as a comma-separated string
        query = query.not('id', 'in', `(${assignedIds.map(id => `"${id}"`).join(',')})`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      console.log('Available hotels:', data);
      setAvailableHotels(data || []);
    } catch (error) {
      console.error('Error fetching available hotels:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available hotels",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, hotels: false }));
    }
  };

  const fetchAssignedHotels = async () => {
    if (!eventId) return;
    
    setIsLoading(prev => ({ ...prev, hotels: true }));
    try {
      const { data, error } = await supabase
        .from('event_hotels')
        .select('hotels:hotel_id(*)')
        .eq('event_id', eventId);
      
      if (error) {
        throw error;
      }
      
      const assignedHotelsData = data?.map(item => item.hotels) || [];
      console.log('Assigned hotels:', assignedHotelsData);
      setAssignedHotels(assignedHotelsData);
    } catch (error) {
      console.error('Error fetching assigned hotels:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assigned hotels",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, hotels: false }));
    }
  };

  const assignHotelToEvent = async (hotelId: string) => {
    if (!eventId) return;
    
    try {
      const { error } = await supabase
        .from('event_hotels')
        .insert({ event_id: eventId, hotel_id: hotelId });
      
      if (error) {
        throw error;
      }
      
      await Promise.all([
        fetchAvailableHotels(),
        fetchAssignedHotels()
      ]);
      
      toast({
        title: "Success",
        description: "Hotel assigned to event",
      });
    } catch (error) {
      console.error('Error assigning hotel to event:', error);
      toast({
        title: "Error",
        description: "Failed to assign hotel to event",
        variant: "destructive",
      });
    }
  };

  const removeHotelFromEvent = async (hotelId: string) => {
    if (!eventId) return;
    
    try {
      const { error } = await supabase
        .from('event_hotels')
        .delete()
        .eq('event_id', eventId)
        .eq('hotel_id', hotelId);
      
      if (error) {
        throw error;
      }
      
      await Promise.all([
        fetchAvailableHotels(),
        fetchAssignedHotels()
      ]);
      
      toast({
        title: "Success",
        description: "Hotel removed from event",
      });
    } catch (error) {
      console.error('Error removing hotel from event:', error);
      toast({
        title: "Error",
        description: "Failed to remove hotel from event",
        variant: "destructive",
      });
    }
  };

  return {
    availablePersons,
    assignedPersons,
    availableHotels,
    assignedHotels,
    isLoading,
    fetchAvailablePersons,
    fetchAssignedPersons,
    assignPersonToEvent,
    removePersonFromEvent,
    fetchAvailableHotels,
    fetchAssignedHotels,
    assignHotelToEvent,
    removeHotelFromEvent,
  };
}
