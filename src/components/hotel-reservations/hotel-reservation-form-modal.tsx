import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Person {
  id: string;
  name: string;
}

interface Hotel {
  id: string;
  name: string;
}

interface HotelReservationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId?: string;
  eventId: string;
  onSuccess: () => void;
}

const formSchema = z.object({
  person_id: z.string().min(1, "Person is required"),
  hotel_id: z.string().min(1, "Hotel is required"),
  check_in: z.date({ required_error: "Check-in date is required" }),
  check_out: z.date({ required_error: "Check-out date is required" }),
  room_type: z.string().optional(),
  confirmation_number: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function HotelReservationFormModal({
  isOpen,
  onClose,
  reservationId,
  eventId,
  onSuccess,
}: HotelReservationFormModalProps) {
  const [persons, setPersons] = useState<Person[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      person_id: "",
      hotel_id: "",
      check_in: undefined,
      check_out: undefined,
      room_type: "",
      confirmation_number: "",
      notes: "",
    },
  });

  useEffect(() => {
    // Reset loading state whenever modal opens
    if (isOpen) {
      setIsLoading(true);
    }
  }, [isOpen]);

  useEffect(() => {
    const loadFormData = async () => {
      if (!isOpen) return;

      try {
        // Step 1: Fetch persons and hotels first
        await Promise.all([fetchPersons(), fetchHotels()]);
        
        // Step 2: If we're editing, fetch the reservation data
        if (reservationId) {
          await fetchReservation();
        } else {
          // For new reservations, reset the form
          form.reset({
            person_id: "",
            hotel_id: "",
            check_in: undefined,
            check_out: undefined,
            room_type: "",
            confirmation_number: "",
            notes: "",
          });
        }
      } catch (error) {
        console.error('Error loading form data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPersons = async () => {
      // Fetch persons associated with the event
      const { data, error } = await supabase
        .from('event_persons')
        .select('person_id, persons:person_id(id, name)')
        .eq('event_id', eventId);
      
      if (error) {
        toast({
          title: "Error",
          description: "Could not fetch persons",
          variant: "destructive",
        });
        throw error;
      }
      
      // Transform the data to get a clean array of persons
      const personsData = data?.map(item => ({
        id: item.persons.id,
        name: item.persons.name
      })) || [];
      
      setPersons(personsData);
    };

    const fetchHotels = async () => {
      try {
        // First try to fetch hotels associated with the event
        const { data: eventHotels, error: eventHotelsError } = await supabase
          .from('event_hotels')
          .select('hotel_id, hotels:hotel_id(id, name)')
          .eq('event_id', eventId);
        
        // If there's an error or no hotels are found via event_hotels, fetch all hotels
        if (eventHotelsError || (eventHotels && eventHotels.length === 0)) {
          console.log('No hotels found via event_hotels, fetching all hotels');
          
          const { data: allHotels, error: allHotelsError } = await supabase
            .from('hotels')
            .select('id, name');
          
          if (allHotelsError) {
            throw allHotelsError;
          }
          
          setHotels(allHotels || []);
          return;
        }
        
        // Transform the data to get a clean array of hotels
        const hotelsData = eventHotels?.map(item => ({
          id: item.hotels.id,
          name: item.hotels.name
        })) || [];
        
        setHotels(hotelsData);
      } catch (error) {
        console.error('Error fetching hotels:', error);
        toast({
          title: "Error",
          description: "Could not fetch hotels",
          variant: "destructive",
        });
        throw error;
      }
    };

    const fetchReservation = async () => {
      if (!reservationId) return;
      
      try {
        const { data, error } = await supabase
          .from('hotel_reservations')
          .select('*')
          .eq('id', reservationId)
          .single();
        
        if (error) throw error;

        if (data) {
          console.log('Loading reservation data:', data);
          
          // Important: setValue instead of reset to avoid overriding already loaded selection options
          form.setValue("person_id", data.person_id);
          form.setValue("hotel_id", data.hotel_id);
          form.setValue("check_in", data.check_in ? new Date(data.check_in) : undefined);
          form.setValue("check_out", data.check_out ? new Date(data.check_out) : undefined);
          form.setValue("room_type", data.room_type || "");
          form.setValue("confirmation_number", data.confirmation_number || "");
          form.setValue("notes", data.notes || "");
        }
      } catch (error) {
        console.error('Error fetching reservation:', error);
        toast({
          title: "Error",
          description: "Could not fetch reservation details",
          variant: "destructive",
        });
        throw error;
      }
    };

    loadFormData();
  }, [isOpen, reservationId, eventId, form, toast]);

  // Add a debug log to see the form values and selected values
  useEffect(() => {
    if (isOpen && reservationId) {
      console.log('Form values:', {
        person_id: form.watch('person_id'),
        hotel_id: form.watch('hotel_id'),
        persons: persons,
        hotels: hotels
      });
    }
  }, [form.watch('person_id'), form.watch('hotel_id'), persons, hotels, isOpen, reservationId]);

  const onSubmit = async (values: FormValues) => {
    if (!eventId) return;
    
    setIsLoading(true);
    
    try {
      const reservationData = {
        event_id: eventId,
        person_id: values.person_id,
        hotel_id: values.hotel_id,
        check_in: values.check_in.toISOString().split('T')[0],
        check_out: values.check_out.toISOString().split('T')[0],
        room_type: values.room_type || null,
        confirmation_number: values.confirmation_number || null,
        notes: values.notes || null,
      };

      let response;

      if (reservationId) {
        // Update existing reservation
        response = await supabase
          .from('hotel_reservations')
          .update(reservationData)
          .eq('id', reservationId);
      } else {
        // Create new reservation
        response = await supabase
          .from('hotel_reservations')
          .insert([reservationData]);
      }

      const { error } = response;
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: reservationId 
          ? "Hotel reservation updated successfully" 
          : "Hotel reservation created successfully",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving hotel reservation:', error);
      toast({
        title: "Error",
        description: "Failed to save hotel reservation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {reservationId ? "Edit" : "Add"} Hotel Reservation
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="person">Guest</Label>
              <Select
                onValueChange={(value) => form.setValue("person_id", value)}
                value={form.watch("person_id") || ""}
                disabled={isLoading}
              >
                <SelectTrigger id="person">
                  <SelectValue placeholder="Select a guest" />
                </SelectTrigger>
                <SelectContent>
                  {persons.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No guests available</div>
                  ) : (
                    persons.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.person_id && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.person_id.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="hotel">Hotel</Label>
              <Select
                onValueChange={(value) => form.setValue("hotel_id", value)}
                value={form.watch("hotel_id") || ""}
                disabled={isLoading}
              >
                <SelectTrigger id="hotel">
                  <SelectValue placeholder="Select a hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No hotels available</div>
                  ) : (
                    hotels.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        {hotel.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.hotel_id && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.hotel_id.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="check_in">Check-in Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="check_in"
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !form.watch("check_in") && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("check_in") ? (
                        format(form.watch("check_in"), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch("check_in")}
                      onSelect={(date) => form.setValue("check_in", date as Date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.check_in && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.check_in.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="check_out">Check-out Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="check_out"
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !form.watch("check_out") && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("check_out") ? (
                        format(form.watch("check_out"), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch("check_out")}
                      onSelect={(date) => form.setValue("check_out", date as Date)}
                      disabled={(date) => 
                        date < (form.watch("check_in") || new Date())
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.check_out && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.check_out.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="room_type">Room Type</Label>
              <Input
                id="room_type"
                placeholder="e.g., Standard, Deluxe, Suite"
                {...form.register("room_type")}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmation_number">Confirmation Number</Label>
              <Input
                id="confirmation_number"
                placeholder="e.g., CONF123456"
                {...form.register("confirmation_number")}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information..."
                {...form.register("notes")}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : reservationId ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 