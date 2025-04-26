import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEventStore } from "@/stores/event-store";
import { useOnClickOutside } from "@/hooks/use-on-click-outside";

// Interface for address suggestion
interface AddressSuggestion {
  place_id: number;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    suburb?: string;
  };
}

const formSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  departureLocation: z.string().min(1, "Departure location is required"),
  arrivalLocation: z.string().min(1, "Arrival location is required"),
  departureTime: z.string().min(1, "Departure time is required"),
  arrivalTime: z.string().min(1, "Arrival time is required"),
  capacity: z.string().min(1, "Capacity is required"),
});

type FormValues = z.infer<typeof formSchema>;

const BusForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  
  // Address suggestion states for departure location
  const [departureSuggestions, setDepartureSuggestions] = useState<AddressSuggestion[]>([]);
  const [isDepartureSearching, setIsDepartureSearching] = useState(false);
  const [showDepartureSuggestions, setShowDepartureSuggestions] = useState(false);
  const departureRef = useRef<HTMLDivElement>(null);
  const departureDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Address suggestion states for arrival location
  const [arrivalSuggestions, setArrivalSuggestions] = useState<AddressSuggestion[]>([]);
  const [isArrivalSearching, setIsArrivalSearching] = useState(false);
  const [showArrivalSuggestions, setShowArrivalSuggestions] = useState(false);
  const arrivalRef = useRef<HTMLDivElement>(null);
  const arrivalDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Close suggestions when clicking outside
  useOnClickOutside(departureRef, () => setShowDepartureSuggestions(false));
  useOnClickOutside(arrivalRef, () => setShowArrivalSuggestions(false));
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: "",
      departureLocation: "",
      arrivalLocation: "",
      departureTime: "",
      arrivalTime: "",
      capacity: "",
    },
  });

  // Fetch address suggestions
  const fetchAddressSuggestions = async (
    query: string,
    setSearching: (value: boolean) => void,
    setSuggestions: (suggestions: AddressSuggestion[]) => void,
    setShow: (show: boolean) => void
  ) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&limit=5`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShow(data.length > 0);
      }
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
    } finally {
      setSearching(false);
    }
  };

  // Debounced fetch for address suggestions
  const debouncedFetchSuggestions = (
    query: string, 
    debounceRef: React.MutableRefObject<NodeJS.Timeout | null>,
    setSearching: (value: boolean) => void,
    setSuggestions: (suggestions: AddressSuggestion[]) => void,
    setShow: (show: boolean) => void
  ) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchAddressSuggestions(query, setSearching, setSuggestions, setShow);
    }, 800);
  };

  // Format full address from suggestion
  const formatFullAddress = (address: AddressSuggestion['address']): string => {
    const parts = [
      address.house_number,
      address.road,
      address.suburb,
      address.city || address.town || address.village,
      address.county,
      address.state,
      address.postcode,
      address.country
    ].filter(Boolean);
    
    return parts.join(", ");
  };

  // Handle selecting a departure suggestion
  const handleSelectDepartureSuggestion = (suggestion: AddressSuggestion) => {
    form.setValue("departureLocation", formatFullAddress(suggestion.address));
    setShowDepartureSuggestions(false);
  };

  // Handle selecting an arrival suggestion
  const handleSelectArrivalSuggestion = (suggestion: AddressSuggestion) => {
    form.setValue("arrivalLocation", formatFullAddress(suggestion.address));
    setShowArrivalSuggestions(false);
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (departureDebounceRef.current) {
        clearTimeout(departureDebounceRef.current);
      }
      if (arrivalDebounceRef.current) {
        clearTimeout(arrivalDebounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchBus = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("buses")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            company: data.company,
            departureLocation: data.departure_location,
            arrivalLocation: data.arrival_location,
            departureTime: new Date(data.departure_time).toISOString().slice(0, 16),
            arrivalTime: new Date(data.arrival_time).toISOString().slice(0, 16),
            capacity: data.capacity.toString(),
          });
        }
      } catch (error) {
        console.error("Error fetching bus:", error);
        toast({
          title: "Error",
          description: "Could not fetch bus details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBus();
  }, [id, form, toast]);

  const onSubmit = async (values: FormValues) => {
    if (!selectedEventId) {
      toast({
        title: "Error",
        description: "Please select an event first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const busData = {
        company: values.company,
        departure_location: values.departureLocation,
        arrival_location: values.arrivalLocation,
        departure_time: values.departureTime,
        arrival_time: values.arrivalTime,
        capacity: parseInt(values.capacity),
        event_id: selectedEventId,
      };

      let response;
      if (id) {
        response = await supabase
          .from("buses")
          .update(busData)
          .eq("id", id);
      } else {
        response = await supabase
          .from("buses")
          .insert([busData]);
      }

      if (response.error) throw response.error;

      toast({
        title: id ? "Bus updated" : "Bus created",
        description: id
          ? "Bus has been successfully updated"
          : "New bus has been successfully created",
      });

      navigate("/buses");
    } catch (error) {
      console.error("Error saving bus:", error);
      toast({
        title: "Error",
        description: `Could not ${id ? "update" : "create"} bus`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title={id ? "Edit Bus" : "Create Bus"}>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Greyhound" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="departureLocation"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel>Departure Location</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="New York" 
                          {...field} 
                          disabled={isLoading}
                          onChange={(e) => {
                            field.onChange(e);
                            debouncedFetchSuggestions(
                              e.target.value,
                              departureDebounceRef,
                              setIsDepartureSearching,
                              setDepartureSuggestions,
                              setShowDepartureSuggestions
                            );
                          }}
                          onFocus={() => {
                            if (departureSuggestions.length > 0) {
                              setShowDepartureSuggestions(true);
                            }
                          }}
                        />
                      </FormControl>
                      {showDepartureSuggestions && (
                        <div 
                          ref={departureRef}
                          className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-sm max-h-[200px] overflow-auto"
                        >
                          {isDepartureSearching ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              Searching...
                            </div>
                          ) : departureSuggestions.length > 0 ? (
                            departureSuggestions.map((suggestion) => (
                              <div
                                key={suggestion.place_id}
                                className="p-2 text-sm hover:bg-muted cursor-pointer"
                                onClick={() => handleSelectDepartureSuggestion(suggestion)}
                              >
                                {suggestion.display_name}
                              </div>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">
                              No suggestions found
                            </div>
                          )}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arrivalLocation"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel>Arrival Location</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Boston" 
                          {...field} 
                          disabled={isLoading}
                          onChange={(e) => {
                            field.onChange(e);
                            debouncedFetchSuggestions(
                              e.target.value,
                              arrivalDebounceRef,
                              setIsArrivalSearching,
                              setArrivalSuggestions,
                              setShowArrivalSuggestions
                            );
                          }}
                          onFocus={() => {
                            if (arrivalSuggestions.length > 0) {
                              setShowArrivalSuggestions(true);
                            }
                          }}
                        />
                      </FormControl>
                      {showArrivalSuggestions && (
                        <div 
                          ref={arrivalRef}
                          className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-sm max-h-[200px] overflow-auto"
                        >
                          {isArrivalSearching ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              Searching...
                            </div>
                          ) : arrivalSuggestions.length > 0 ? (
                            arrivalSuggestions.map((suggestion) => (
                              <div
                                key={suggestion.place_id}
                                className="p-2 text-sm hover:bg-muted cursor-pointer"
                                onClick={() => handleSelectArrivalSuggestion(suggestion)}
                              >
                                {suggestion.display_name}
                              </div>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">
                              No suggestions found
                            </div>
                          )}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="departureTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arrivalTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="50"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/buses")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : id ? "Update Bus" : "Create Bus"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default BusForm;
