
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useEventManagement(eventId: string) {
  const [availablePersons, setAvailablePersons] = useState<any[]>([]);
  const [assignedPersons, setAssignedPersons] = useState<any[]>([]);
  const [availableHotels, setAvailableHotels] = useState<any[]>([]);
  const [assignedHotels, setAssignedHotels] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchAvailablePersons = async () => {
    const { data: assigned } = await supabase
      .from('event_persons')
      .select('person_id')
      .eq('event_id', eventId);

    const assignedIds = assigned?.map(ep => ep.person_id) || [];

    const { data } = await supabase
      .from('persons')
      .select('*')
      .not('id', 'in', assignedIds);
    
    if (data) setAvailablePersons(data);
  };

  const fetchAssignedPersons = async () => {
    const { data } = await supabase
      .from('event_persons')
      .select('persons:person_id(*)')
      .eq('event_id', eventId);
    
    if (data) setAssignedPersons(data.map(item => item.persons));
  };

  const assignPersonToEvent = async (personId: string) => {
    const { error } = await supabase
      .from('event_persons')
      .insert({ event_id: eventId, person_id: personId });
    
    if (!error) {
      await fetchAvailablePersons();
      await fetchAssignedPersons();
      toast({
        title: "Success",
        description: "Person assigned to event",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to assign person to event",
        variant: "destructive",
      });
    }
  };

  const removePersonFromEvent = async (personId: string) => {
    const { error } = await supabase
      .from('event_persons')
      .delete()
      .eq('event_id', eventId)
      .eq('person_id', personId);
    
    if (!error) {
      await fetchAvailablePersons();
      await fetchAssignedPersons();
      toast({
        title: "Success",
        description: "Person removed from event",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to remove person from event",
        variant: "destructive",
      });
    }
  };

  const fetchAvailableHotels = async () => {
    const { data: assigned } = await supabase
      .from('event_hotels')
      .select('hotel_id')
      .eq('event_id', eventId);

    const assignedIds = assigned?.map(eh => eh.hotel_id) || [];

    const { data } = await supabase
      .from('hotels')
      .select('*')
      .not('id', 'in', assignedIds);
    
    if (data) setAvailableHotels(data);
  };

  const fetchAssignedHotels = async () => {
    const { data } = await supabase
      .from('event_hotels')
      .select('hotels:hotel_id(*)')
      .eq('event_id', eventId);
    
    if (data) setAssignedHotels(data.map(item => item.hotels));
  };

  const assignHotelToEvent = async (hotelId: string) => {
    const { error } = await supabase
      .from('event_hotels')
      .insert({ event_id: eventId, hotel_id: hotelId });
    
    if (!error) {
      await fetchAvailableHotels();
      await fetchAssignedHotels();
      toast({
        title: "Success",
        description: "Hotel assigned to event",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to assign hotel to event",
        variant: "destructive",
      });
    }
  };

  const removeHotelFromEvent = async (hotelId: string) => {
    const { error } = await supabase
      .from('event_hotels')
      .delete()
      .eq('event_id', eventId)
      .eq('hotel_id', hotelId);
    
    if (!error) {
      await fetchAvailableHotels();
      await fetchAssignedHotels();
      toast({
        title: "Success",
        description: "Hotel removed from event",
      });
    } else {
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
