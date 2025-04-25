
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useEventManagement(eventId: string) {
  const [availablePersons, setAvailablePersons] = useState([]);
  const [assignedPersons, setAssignedPersons] = useState([]);
  const [availableHotels, setAvailableHotels] = useState([]);
  const [assignedHotels, setAssignedHotels] = useState([]);

  const fetchAvailablePersons = async () => {
    const { data, error } = await supabase
      .from('persons')
      .select('*')
      .whereNotIn('id', 
        supabase.from('event_persons')
          .select('person_id')
          .eq('event_id', eventId)
      );
    
    if (data) setAvailablePersons(data);
  };

  const fetchAssignedPersons = async () => {
    const { data, error } = await supabase
      .from('event_persons')
      .select('persons(*)')
      .eq('event_id', eventId);
    
    if (data) setAssignedPersons(data.map(item => item.persons));
  };

  const assignPersonToEvent = async (personId: string) => {
    const { data, error } = await supabase
      .from('event_persons')
      .insert({ event_id: eventId, person_id: personId });
    
    if (!error) {
      await fetchAvailablePersons();
      await fetchAssignedPersons();
    }
  };

  const removePersonFromEvent = async (personId: string) => {
    const { data, error } = await supabase
      .from('event_persons')
      .delete()
      .eq('event_id', eventId)
      .eq('person_id', personId);
    
    if (!error) {
      await fetchAvailablePersons();
      await fetchAssignedPersons();
    }
  };

  // Similar methods for hotels...

  return {
    availablePersons,
    assignedPersons,
    availableHotels,
    assignedHotels,
    fetchAvailablePersons,
    fetchAssignedPersons,
    assignPersonToEvent,
    removePersonFromEvent,
  };
}
