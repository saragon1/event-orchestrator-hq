
import { useState, useEffect } from "react";
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

const formSchema = z.object({
  airline: z.string().min(1, "Airline name is required"),
  flightNumber: z.string().min(1, "Flight number is required"),
  departureAirport: z.string().min(1, "Departure airport is required"),
  arrivalAirport: z.string().min(1, "Arrival airport is required"),
  departureTime: z.string().min(1, "Departure time is required"),
  arrivalTime: z.string().min(1, "Arrival time is required"),
});

type FormValues = z.infer<typeof formSchema>;

const FlightForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      airline: "",
      flightNumber: "",
      departureAirport: "",
      arrivalAirport: "",
      departureTime: "",
      arrivalTime: "",
    },
  });

  useEffect(() => {
    const fetchFlight = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("flights")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            airline: data.airline,
            flightNumber: data.flight_number,
            departureAirport: data.departure_airport,
            arrivalAirport: data.arrival_airport,
            departureTime: new Date(data.departure_time).toISOString().slice(0, 16),
            arrivalTime: new Date(data.arrival_time).toISOString().slice(0, 16),
          });
        }
      } catch (error) {
        console.error("Error fetching flight:", error);
        toast({
          title: "Error",
          description: "Could not fetch flight details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlight();
  }, [id, form, toast]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);

    try {
      const flightData = {
        airline: values.airline,
        flight_number: values.flightNumber,
        departure_airport: values.departureAirport,
        arrival_airport: values.arrivalAirport,
        departure_time: values.departureTime,
        arrival_time: values.arrivalTime,
        event_id: "00000000-0000-0000-0000-000000000000", // TODO: Get from context
      };

      let response;
      if (id) {
        response = await supabase
          .from("flights")
          .update(flightData)
          .eq("id", id);
      } else {
        response = await supabase
          .from("flights")
          .insert([flightData]);
      }

      if (response.error) throw response.error;

      toast({
        title: id ? "Flight updated" : "Flight created",
        description: id
          ? "Flight has been successfully updated"
          : "New flight has been successfully created",
      });

      navigate("/flights");
    } catch (error) {
      console.error("Error saving flight:", error);
      toast({
        title: "Error",
        description: `Could not ${id ? "update" : "create"} flight`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title={id ? "Edit Flight" : "Create Flight"}>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="airline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Airline</FormLabel>
                      <FormControl>
                        <Input placeholder="American Airlines" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="flightNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flight Number</FormLabel>
                      <FormControl>
                        <Input placeholder="AA123" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="departureAirport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Airport</FormLabel>
                      <FormControl>
                        <Input placeholder="JFK" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arrivalAirport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival Airport</FormLabel>
                      <FormControl>
                        <Input placeholder="LAX" {...field} disabled={isLoading} />
                      </FormControl>
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

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/flights")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : id ? "Update Flight" : "Create Flight"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default FlightForm;
