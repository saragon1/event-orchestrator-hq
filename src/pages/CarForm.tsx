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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEventStore } from "@/stores/event-store";

const formSchema = z.object({
  type: z.enum(["private", "ncc", "taxi"]).refine((val) => val !== undefined, "Car type is required"),
  company: z.string().optional(),
  driverName: z.string().min(1, "Driver name is required"),
  driverPhone: z.string().min(1, "Driver phone is required"),
  licensePlate: z.string().min(1, "License plate is required"),
  departureLocation: z.string().min(1, "Pickup location is required"),
  arrivalLocation: z.string().min(1, "Dropoff location is required"),
  departureTime: z.string().min(1, "Pickup time is required"),
  arrivalTime: z.string().min(1, "Dropoff time is required"),
  capacity: z.string().min(1, "Capacity is required"),
});

type FormValues = z.infer<typeof formSchema>;

const CarForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "private",
      company: "",
      driverName: "",
      driverPhone: "",
      licensePlate: "",
      departureLocation: "",
      arrivalLocation: "",
      departureTime: "",
      arrivalTime: "",
      capacity: "4",
    },
  });

  useEffect(() => {
    const fetchCar = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("cars")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            type: data.type,
            company: data.company || "",
            driverName: data.driver_name,
            driverPhone: data.driver_phone,
            licensePlate: data.license_plate,
            departureLocation: data.departure_location,
            arrivalLocation: data.arrival_location,
            departureTime: new Date(data.departure_time).toISOString().slice(0, 16),
            arrivalTime: new Date(data.departure_time).toISOString().slice(0, 16),
            capacity: data.capacity.toString(),
          });
        }
      } catch (error) {
        console.error("Error fetching car:", error);
        toast({
          title: "Error",
          description: "Could not fetch car details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCar();
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
      const carData = {
        type: values.type,
        company: values.company,
        driver_name: values.driverName,
        driver_phone: values.driverPhone,
        license_plate: values.licensePlate,
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
          .from("cars")
          .update(carData)
          .eq("id", id);
      } else {
        response = await supabase
          .from("cars")
          .insert(carData);
      }

      if (response.error) throw response.error;

      toast({
        title: id ? "Car updated" : "Car created",
        description: id
          ? "Car has been successfully updated"
          : "New car has been successfully created",
      });

      navigate("/cars");
    } catch (error) {
      console.error("Error saving car:", error);
      toast({
        title: "Error",
        description: `Could not ${id ? "update" : "create"} car`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title={id ? "Edit Car" : "Create Car"}>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Car Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select car type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="ncc">NCC</SelectItem>
                          <SelectItem value="taxi">Taxi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Company name" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="driverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="driverPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="123-456-7890" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Plate</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC123" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          placeholder="4"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="departureLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Airport" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arrivalLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dropoff Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Hotel" {...field} disabled={isLoading} />
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
                      <FormLabel>Pickup Time</FormLabel>
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
                      <FormLabel>Dropoff Time</FormLabel>
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
                  onClick={() => navigate("/cars")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : id ? "Update Car" : "Create Car"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default CarForm; 