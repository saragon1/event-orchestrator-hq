
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

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
  selectedEventId: null,
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
        set((state) => ({
          selectedEventId: state.selectedEventId || data[0].id
        }));
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  setSelectedEventId: (id) => set({ selectedEventId: id }),
}));
