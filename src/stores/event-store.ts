import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

const EVENT_STORAGE_KEY = 'selectedEventId';

interface Event {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  description: string | null;
}

interface EventStore {
  events: Event[];
  selectedEventId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  setSelectedEventId: (id: string | null) => void;
}

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  selectedEventId: localStorage.getItem(EVENT_STORAGE_KEY),
  isLoading: false,
  error: null,
  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      
      set({ events: data, isLoading: false });
      // Select the first event by default if none is selected
      if (data.length > 0) {
        set((state) => {
          const eventId = state.selectedEventId || data[0].id;
          if (!state.selectedEventId) {
            localStorage.setItem(EVENT_STORAGE_KEY, eventId);
          }
          return { selectedEventId: eventId };
        });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  setSelectedEventId: (id) => {
    if (id) {
      localStorage.setItem(EVENT_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(EVENT_STORAGE_KEY);
    }
    set({ selectedEventId: id });
  },
}));
