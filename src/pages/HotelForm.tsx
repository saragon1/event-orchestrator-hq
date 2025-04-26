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
import { cn } from "@/lib/utils";
import { useOnClickOutside } from "@/hooks/use-on-click-outside";

// Define the schema for form validation
const formSchema = z.object({
  name: z.string().min(1, "Hotel name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  rating: z.string().optional(), // Keep as string throughout the form handling
});

// Create a type that represents the form values
type FormValues = z.infer<typeof formSchema>;

// Interface for address suggestion
interface AddressSuggestion {
  place_id: number;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    country?: string;
    postcode?: string;
  };
}

const HotelForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      country: "",
      phone: "",
      website: "",
      rating: "",
    },
  });

  // Close suggestions when clicking outside
  useOnClickOutside(suggestionsRef, () => setShowSuggestions(false));

  // Debounced fetch address suggestions
  const debouncedFetchSuggestions = (query: string) => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set a new timer to execute after 800ms
    debounceTimerRef.current = setTimeout(() => {
      fetchAddressSuggestions(query);
    }, 800);
  };

  // Fetch address suggestions
  const fetchAddressSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setIsSearching(true);
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
        setAddressSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle selecting an address suggestion
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const address = suggestion.address;
    const formattedAddress = [
      address.house_number,
      address.road
    ].filter(Boolean).join(" ");
    
    form.setValue("address", formattedAddress);
    if (address.city) form.setValue("city", address.city);
    if (address.country) form.setValue("country", address.country);
    
    setShowSuggestions(false);
  };

  useEffect(() => {
    const fetchHotel = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("hotels")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            name: data.name,
            address: data.address,
            city: data.city,
            country: data.country,
            phone: data.phone || "",
            website: data.website || "",
            rating: data.rating?.toString() || "",
          });
        }
      } catch (error) {
        console.error("Error fetching hotel:", error);
        toast({
          title: "Error",
          description: "Could not fetch hotel details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotel();
  }, [id, form, toast]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);

    try {
      // Manually transform the rating to a number or null before sending to the database
      const hotelData = {
        name: values.name,
        address: values.address,
        city: values.city,
        country: values.country,
        phone: values.phone || null,
        website: values.website || null,
        rating: values.rating ? parseInt(values.rating, 10) : null, // Convert string to number or null
      };

      let response;

      if (id) {
        response = await supabase
          .from("hotels")
          .update(hotelData)
          .eq("id", id);
      } else {
        response = await supabase
          .from("hotels")
          .insert([hotelData]);
      }

      const { error } = response;
      if (error) throw error;

      toast({
        title: id ? "Hotel updated" : "Hotel created",
        description: id
          ? "Hotel has been successfully updated"
          : "New hotel has been successfully created",
      });

      navigate("/hotels");
    } catch (error) {
      console.error("Error saving hotel:", error);
      toast({
        title: "Error",
        description: `Could not ${id ? "update" : "create"} hotel`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title={id ? "Edit Hotel" : "Create Hotel"}>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hotel Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Grand Hotel" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="123 Main St" 
                        {...field} 
                        disabled={isLoading}
                        onChange={(e) => {
                          field.onChange(e);
                          debouncedFetchSuggestions(e.target.value);
                        }}
                        onFocus={() => {
                          if (addressSuggestions.length > 0) {
                            setShowSuggestions(true);
                          }
                        }}
                      />
                    </FormControl>
                    {showSuggestions && (
                      <div 
                        ref={suggestionsRef}
                        className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-sm max-h-[200px] overflow-auto"
                      >
                        {isSearching ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            Searching...
                          </div>
                        ) : addressSuggestions.length > 0 ? (
                          addressSuggestions.map((suggestion) => (
                            <div
                              key={suggestion.place_id}
                              className="p-2 text-sm hover:bg-muted cursor-pointer"
                              onClick={() => handleSelectSuggestion(suggestion)}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="USA" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234 567 8900" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating (Optional, 1-5)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="5"
                        placeholder="5"
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
                  onClick={() => navigate("/hotels")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : id ? "Update Hotel" : "Create Hotel"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default HotelForm;
