import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEventStore } from "@/stores/event-store";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Database } from "@/integrations/supabase/types";

// Define simpler interfaces to avoid deep type instantiation
interface SimplePerson {
  id: string;
  name: string;
  email: string;
}

type PersonWithEmail = SimplePerson;
type Car = Database["public"]["Tables"]["cars"]["Row"];

// Extended car type with reservations count
interface CarWithReservationsCount extends Car {
  reservations_count: number;
}

interface CarWithReservations extends Omit<Car, "reservations_count"> {
  car_reservations: { id: string }[];
}

const formSchema = z.object({
  car_id: z.string({
    required_error: "Car is required",
  }),
  person_id: z.string({
    required_error: "Person is required",
  }),
  confirmation_number: z.string().optional(),
  is_driver: z.boolean().default(false),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CarReservationForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const personId = searchParams.get("person_id");
  const carId = searchParams.get("car_id");

  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [persons, setPersons] = useState<PersonWithEmail[]>([]);
  const [cars, setCars] = useState<CarWithReservationsCount[]>([]);
  const [selectedCar, setSelectedCar] = useState<CarWithReservationsCount | null>(null);
  const selectedEventId = useEventStore((state) => state.selectedEventId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      car_id: carId || "",
      person_id: personId || "",
      confirmation_number: "",
      is_driver: false,
      notes: "",
    },
  });

  useEffect(() => {
    const fetchPersons = async () => {
      if (!selectedEventId) return;

      try {
        // @ts-expect-error - Bypass deep instantiation error
        const { data, error } = await supabase
          .from("persons")
          .select("id, name, email")
          .eq("event_id", selectedEventId);

        if (error) throw error;

        setPersons(data || []);
      } catch (error) {
        console.error("Error fetching persons:", error);
        toast({
          title: "Error",
          description: "Could not fetch persons",
          variant: "destructive",
        });
      }
    };

    const fetchCars = async () => {
      if (!selectedEventId) return;

      try {
        const { data, error } = await supabase
          .from("cars")
          .select(`
            id, car_type, company, driver_name, departure_location, arrival_location, 
            departure_time, arrival_time, capacity, license_plate, event_id,
            car_reservations:car_reservations(id)
          `)
          .eq("event_id", selectedEventId);

        if (error) throw error;

        const carsWithCount = (data || []).map((car: CarWithReservations) => ({
          ...car,
          reservations_count: car.car_reservations?.length || 0,
        })) as CarWithReservationsCount[];

        setCars(carsWithCount);
      } catch (error) {
        console.error("Error fetching cars:", error);
        toast({
          title: "Error",
          description: "Could not fetch cars",
          variant: "destructive",
        });
      }
    };

    const fetchReservation = async () => {
      if (!id || !selectedEventId) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("car_reservations")
          .select("*")
          .eq("id", id)
          .eq("event_id", selectedEventId)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            car_id: data.car_id || "",
            person_id: data.person_id || "",
            confirmation_number: data.confirmation_number || "",
            is_driver: data.is_driver || false,
            notes: data.notes || "",
          });
          
          // Update the car details
          if (data.car_id) {
            const car = cars.find((c) => c.id === data.car_id);
            if (car) {
              setSelectedCar(car);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching reservation:", error);
        toast({
          title: "Error",
          description: "Could not fetch reservation details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersons();
    fetchCars();

    if (id) {
      fetchReservation();
    }
  }, [id, selectedEventId, toast, form, cars]);

  useEffect(() => {
    // Watch for car_id changes to update the selected car
    const subscription = form.watch((value, { name }) => {
      if (name === "car_id" && value.car_id) {
        const car = cars.find((c) => c.id === value.car_id);
        setSelectedCar(car || null);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, cars]);

  const onSubmit = async (values: FormValues) => {
    if (!selectedEventId) {
      toast({
        title: "No Event Selected",
        description: "Please select an event before adding a reservation",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const reservationData: Database["public"]["Tables"]["car_reservations"]["Insert"] = {
        event_id: selectedEventId,
        car_id: values.car_id,
        person_id: values.person_id,
        confirmation_number: values.confirmation_number || null,
        is_driver: values.is_driver,
        notes: values.notes || null,
      };

      let response;

      if (id) {
        // Update existing reservation
        response = await supabase
          .from("car_reservations")
          .update(reservationData)
          .eq("id", id);
      } else {
        // Create new reservation
        response = await supabase
          .from("car_reservations")
          .insert(reservationData);
      }

      const { error } = response;
      if (error) throw error;

      toast({
        title: "Success",
        description: id
          ? "Reservation updated successfully"
          : "Reservation created successfully",
      });

      navigate("/car-reservations");
    } catch (error) {
      console.error("Error saving reservation:", error);
      toast({
        title: "Error",
        description: `Could not ${id ? "update" : "create"} reservation`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCarOption = (car: Car) => {
    return `${car.car_type.toUpperCase()} - ${car.departure_location} to ${car.arrival_location} (${format(new Date(car.departure_time), "dd/MM/yyyy HH:mm")})`;
  };

  return (
    <DashboardLayout title={id ? "Edit Car Reservation" : "Create Car Reservation"}>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="car_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Car</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a car" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cars.map((car) => (
                            <SelectItem
                              key={car.id}
                              value={car.id}
                              disabled={car.reservations_count >= car.capacity && field.value !== car.id}
                            >
                              {formatCarOption(car)}{" "}
                              {car.reservations_count >= car.capacity && field.value !== car.id && "(Full)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="person_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Person</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a person" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {persons.map((person) => (
                            <SelectItem key={person.id} value={person.id}>
                              {person.name} ({person.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="confirmation_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmation Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Confirmation number" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_driver"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Is Driver</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Check if this person is the driver of the vehicle
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {selectedCar && (
                <div className="border p-4 rounded-md bg-muted/30">
                  <h3 className="font-medium mb-2">Car Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Car Type:</strong> {selectedCar.car_type}</p>
                      <p><strong>Company:</strong> {selectedCar.company || "-"}</p>
                      <p><strong>Driver:</strong> {selectedCar.driver_name}</p>
                      <p><strong>License Plate:</strong> {selectedCar.license_plate || "-"}</p>
                    </div>
                    <div>
                      <p><strong>Pickup:</strong> {selectedCar.departure_location}</p>
                      <p><strong>Pickup Time:</strong> {format(new Date(selectedCar.departure_time), "PPP HH:mm")}</p>
                      <p><strong>Dropoff:</strong> {selectedCar.arrival_location}</p>
                      <p><strong>Dropoff Time:</strong> {format(new Date(selectedCar.arrival_time), "PPP HH:mm")}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p><strong>Capacity:</strong> {selectedCar.reservations_count}/{selectedCar.capacity} seats reserved</p>
                    </div>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional information..."
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/car-reservations")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : id ? "Update Reservation" : "Create Reservation"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default CarReservationForm; 