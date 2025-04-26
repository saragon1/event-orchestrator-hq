import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import { supabase } from "@/integrations/supabase/client";
import { useEventStore } from "@/stores/event-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EmptyPlaceholder } from "@/components/ui/empty-placeholder";
import { Map, Search, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { geocodeAddress } from "@/lib/geocoding";

// Fix Leaflet icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Create the MapUpdater component to update the map when props change
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

type Person = Tables<"persons">;

// Ticket types with associated person data
type BusTicket = Tables<"bus_tickets"> & { person: Person };
type CarReservation = Tables<"car_reservations"> & { person: Person };
type TrainTicket = Tables<"train_tickets"> & { person: Person };
type FlightTicket = Tables<"flight_tickets"> & { person: Person };

type EventMapData = {
  event: Tables<"events"> | null;
  persons: Person[];
  hotels: Array<Tables<"hotels"> & { position: [number, number] | null }>;
  buses: Array<Tables<"buses"> & { 
    departurePosition: [number, number] | null;
    arrivalPosition: [number, number] | null;
    tickets: BusTicket[];
  }>;
  cars: Array<Tables<"cars"> & { 
    departurePosition: [number, number] | null;
    arrivalPosition: [number, number] | null;
    reservations: CarReservation[];
  }>;
  trains: Array<Tables<"trains"> & { 
    departurePosition: [number, number] | null;
    arrivalPosition: [number, number] | null;
    tickets: TrainTicket[];
  }>;
  flights: Array<Tables<"flights"> & { 
    departurePosition: [number, number] | null;
    arrivalPosition: [number, number] | null;
    tickets: FlightTicket[];
  }>;
};

const EventMap = () => {
  const { toast } = useToast();
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  const [isLoading, setIsLoading] = useState(true);
  const [mapData, setMapData] = useState<EventMapData>({
    event: null,
    persons: [],
    hotels: [],
    buses: [],
    cars: [],
    trains: [],
    flights: [],
  });
  const [center, setCenter] = useState<[number, number]>([45.4642, 9.1900]); // Default: Milan
  const [zoom, setZoom] = useState(12);
  
  // Person filter
  const [personFilterOpen, setPersonFilterOpen] = useState(false);
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  
  // Visibility toggles
  const [showHotels, setShowHotels] = useState(true);
  const [showBuses, setShowBuses] = useState(true);
  const [showCars, setShowCars] = useState(true);
  const [showTrains, setShowTrains] = useState(true);
  const [showFlights, setShowFlights] = useState(true);
  
  // Path colors
  const pathColors = {
    hotel: "#3b82f6", // Blue
    bus: "#10b981", // Green
    car: "#f59e0b", // Amber
    train: "#ef4444", // Red
    flight: "#8b5cf6", // Purple
    event: "#000000", // Black
  };

  useEffect(() => {
    if (!selectedEventId) {
      setIsLoading(false);
      return;
    }
    
    const fetchEventData = async () => {
      setIsLoading(true);
      try {
        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", selectedEventId)
          .single();
          
        if (eventError) throw eventError;
        
        // Fetch all persons associated with this event
        const { data: personsData, error: personsError } = await supabase
          .from("event_persons")
          .select(`
            person_id,
            persons (*)
          `)
          .eq("event_id", selectedEventId);
          
        if (personsError) throw personsError;
        
        const persons = personsData.map(item => item.persons as Person);
        
        // Fetch hotels
        const { data: eventHotels, error: hotelsError } = await supabase
          .from("event_hotels")
          .select(`
            hotel_id,
            hotels (*)
          `)
          .eq("event_id", selectedEventId);
          
        if (hotelsError) throw hotelsError;
        
        // Fetch buses with tickets
        const { data: busesData, error: busesError } = await supabase
          .from("buses")
          .select("*")
          .eq("event_id", selectedEventId);
          
        if (busesError) throw busesError;
        
        // Fetch bus tickets
        const busesWithTickets = await Promise.all((busesData || []).map(async (bus) => {
          const { data: ticketsData, error: ticketsError } = await supabase
            .from("bus_tickets")
            .select(`
              *,
              person:person_id (*)
            `)
            .eq("bus_id", bus.id);
            
          if (ticketsError) throw ticketsError;
          
          return {
            ...bus,
            tickets: ticketsData || []
          };
        }));
        
        // Fetch cars with reservations
        const { data: carsData, error: carsError } = await supabase
          .from("cars")
          .select("*")
          .eq("event_id", selectedEventId);
          
        if (carsError) throw carsError;
        
        // Fetch car reservations
        const carsWithReservations = await Promise.all((carsData || []).map(async (car) => {
          const { data: reservationsData, error: reservationsError } = await supabase
            .from("car_reservations")
            .select(`
              *,
              person:person_id (*)
            `)
            .eq("car_id", car.id);
            
          if (reservationsError) throw reservationsError;
          
          return {
            ...car,
            reservations: reservationsData || []
          };
        }));
        
        // Fetch trains with tickets
        const { data: trainsData, error: trainsError } = await supabase
          .from("trains")
          .select("*")
          .eq("event_id", selectedEventId);
          
        if (trainsError) throw trainsError;
        
        // Fetch train tickets
        const trainsWithTickets = await Promise.all((trainsData || []).map(async (train) => {
          const { data: ticketsData, error: ticketsError } = await supabase
            .from("train_tickets")
            .select(`
              *,
              person:person_id (*)
            `)
            .eq("train_id", train.id);
            
          if (ticketsError) throw ticketsError;
          
          return {
            ...train,
            tickets: ticketsData || []
          };
        }));
        
        // Fetch flights with tickets
        const { data: flightsData, error: flightsError } = await supabase
          .from("flights")
          .select("*")
          .eq("event_id", selectedEventId);
          
        if (flightsError) throw flightsError;
        
        // Fetch flight tickets
        const flightsWithTickets = await Promise.all((flightsData || []).map(async (flight) => {
          const { data: ticketsData, error: ticketsError } = await supabase
            .from("flight_tickets")
            .select(`
              *,
              person:person_id (*)
            `)
            .eq("flight_id", flight.id);
            
          if (ticketsError) throw ticketsError;
          
          return {
            ...flight,
            tickets: ticketsData || []
          };
        }));
        
        // Get coordinates for event location
        const eventPosition = await geocodeAddress(eventData.address || eventData.location);
        if (eventPosition) {
          setCenter(eventPosition);
        }
        
        // Get coordinates for hotels
        const hotels = await Promise.all((eventHotels || []).map(async (item) => {
          const hotel = item.hotels as Tables<"hotels">;
          const address = `${hotel.address}, ${hotel.city}, ${hotel.country}`.trim();
          console.log(`Processing hotel address: ${address}`);
          const position = await geocodeAddress(address);
          return { ...hotel, position };
        }));
        
        // Get coordinates for buses
        const buses = await Promise.all(busesWithTickets.map(async (bus) => {
          const departurePosition = await geocodeAddress(bus.departure_location);
          const arrivalPosition = await geocodeAddress(bus.arrival_location);
          return { ...bus, departurePosition, arrivalPosition };
        }));
        
        // Get coordinates for cars
        const cars = await Promise.all(carsWithReservations.map(async (car) => {
          const departurePosition = car.departure_location ? 
            await geocodeAddress(car.departure_location) : null;
          const arrivalPosition = car.arrival_location ? 
            await geocodeAddress(car.arrival_location) : null;
          return { ...car, departurePosition, arrivalPosition };
        }));
        
        // Get coordinates for trains
        const trains = await Promise.all(trainsWithTickets.map(async (train) => {
          const departurePosition = await geocodeAddress(train.departure_station);
          const arrivalPosition = await geocodeAddress(train.arrival_station);
          return { ...train, departurePosition, arrivalPosition };
        }));
        
        // Get coordinates for flights
        const flights = await Promise.all(flightsWithTickets.map(async (flight) => {
          const departurePosition = await geocodeAddress(flight.departure_airport);
          const arrivalPosition = await geocodeAddress(flight.arrival_airport);
          return { ...flight, departurePosition, arrivalPosition };
        }));
        
        setMapData({
          event: eventData,
          persons,
          hotels,
          buses,
          cars,
          trains,
          flights,
        });
      } catch (error) {
        console.error("Error fetching map data:", error);
        toast({
          title: "Error",
          description: "Failed to load map data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventData();
  }, [selectedEventId, toast]);
  
  // Person filter functions
  const togglePersonFilter = (personId: string) => {
    setSelectedPersons(prev => {
      if (prev.includes(personId)) {
        return prev.filter(id => id !== personId);
      } else {
        return [...prev, personId];
      }
    });
  };

  // Filter data based on selected persons
  const filteredData = useMemo(() => {
    if (selectedPersons.length === 0) {
      return mapData;
    }

    return {
      ...mapData,
      buses: mapData.buses.filter(bus => 
        bus.tickets.some(ticket => selectedPersons.includes(ticket.person_id))
      ),
      cars: mapData.cars.filter(car => 
        car.reservations.some(res => selectedPersons.includes(res.person_id))
      ),
      trains: mapData.trains.filter(train => 
        train.tickets.some(ticket => selectedPersons.includes(ticket.person_id))
      ),
      flights: mapData.flights.filter(flight => 
        flight.tickets.some(ticket => selectedPersons.includes(ticket.person_id))
      ),
    };
  }, [mapData, selectedPersons]);
  
  // Check if we have valid coordinates for an event
  const hasValidEventLocation = () => {
    return mapData.event && center;
  };
  
  if (!selectedEventId) {
    return (
      <DashboardLayout title="Event Map">
        <EmptyPlaceholder
          title="No event selected"
          description="Please select an event from the dropdown to view the map"
          icon={<Map className="h-8 w-8 text-muted-foreground" />}
        />
      </DashboardLayout>
    );
  }
  
  if (isLoading) {
    return (
      <DashboardLayout title="Event Map">
        <Card>
          <CardHeader>
            <CardTitle>Loading map data...</CardTitle>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Event Map">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {mapData.event?.name} - Map View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-between gap-4 mb-4">
            <div className="w-64">
              <Popover open={personFilterOpen} onOpenChange={setPersonFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={personFilterOpen}
                    className="w-full justify-between"
                  >
                    {selectedPersons.length > 0
                      ? `${selectedPersons.length} person${selectedPersons.length > 1 ? 's' : ''} selected`
                      : "Filter by person"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 z-[1000]">
                  <Command>
                    <CommandInput placeholder="Search person..." />
                    <CommandList>
                      <CommandEmpty>No person found.</CommandEmpty>
                      <CommandGroup className="max-h-[300px] overflow-auto">
                        {mapData.persons && mapData.persons.map((person) => (
                          <CommandItem
                            key={person.id}
                            value={person.id}
                            onSelect={() => togglePersonFilter(person.id)}
                            className="flex items-center"
                          >
                            <div className={cn(
                              "mr-2 h-4 w-4 rounded-sm border flex items-center justify-center", 
                              selectedPersons.includes(person.id) ? "bg-primary border-primary" : "border-input"
                            )}>
                              {selectedPersons.includes(person.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <span>{person.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground">{person.email}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                    {selectedPersons.length > 0 && (
                      <div className="border-t p-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full" 
                          onClick={() => setSelectedPersons([])}
                        >
                          Clear selection
                        </Button>
                      </div>
                    )}
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedPersons.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedPersons.map(id => {
                    const person = mapData.persons.find(p => p.id === id);
                    return person && (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {person.name}
                        <button 
                          onClick={() => togglePersonFilter(id)} 
                          className="ml-1 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="hotels-toggle"
                  checked={showHotels}
                  onCheckedChange={setShowHotels}
                />
                <Label htmlFor="hotels-toggle" className="flex items-center">
                  <div className="w-3 h-3 mr-1 rounded-full" style={{ backgroundColor: pathColors.hotel }}></div>
                  Hotels
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="buses-toggle"
                  checked={showBuses}
                  onCheckedChange={setShowBuses}
                />
                <Label htmlFor="buses-toggle" className="flex items-center">
                  <div className="w-3 h-3 mr-1 rounded-full" style={{ backgroundColor: pathColors.bus }}></div>
                  Buses
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="cars-toggle"
                  checked={showCars}
                  onCheckedChange={setShowCars}
                />
                <Label htmlFor="cars-toggle" className="flex items-center">
                  <div className="w-3 h-3 mr-1 rounded-full" style={{ backgroundColor: pathColors.car }}></div>
                  Cars
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="trains-toggle"
                  checked={showTrains}
                  onCheckedChange={setShowTrains}
                />
                <Label htmlFor="trains-toggle" className="flex items-center">
                  <div className="w-3 h-3 mr-1 rounded-full" style={{ backgroundColor: pathColors.train }}></div>
                  Trains
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="flights-toggle"
                  checked={showFlights}
                  onCheckedChange={setShowFlights}
                />
                <Label htmlFor="flights-toggle" className="flex items-center">
                  <div className="w-3 h-3 mr-1 rounded-full" style={{ backgroundColor: pathColors.flight }}></div>
                  Flights
                </Label>
              </div>
            </div>
          </div>
          
          {hasValidEventLocation() ? (
            <div style={{ height: "600px", width: "100%", position: "relative" }}>
              <MapContainer 
                style={{ height: "100%", width: "100%" }}
              >
                <MapUpdater center={center} zoom={zoom} />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Event Location Marker */}
                <Marker position={center}>
                  <Popup>
                    <div>
                      <h3 className="font-bold">{mapData.event?.name}</h3>
                      <p>{mapData.event?.location}</p>
                      {mapData.event?.address && (
                        <p className="text-sm text-muted-foreground">{mapData.event.address}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
                
                {/* Hotel Markers */}
                {showHotels && filteredData.hotels.map((hotel) => (
                  hotel.position && (
                    <Marker
                      key={hotel.id}
                      position={hotel.position}
                    >
                      <Popup>
                        <div>
                          <h3 className="font-bold">{hotel.name}</h3>
                          <p>{hotel.address}</p>
                          <p>{hotel.city}, {hotel.country}</p>
                          {hotel.phone && <p>Phone: {hotel.phone}</p>}
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
                
                {/* Bus Routes */}
                {showBuses && filteredData.buses.map((bus) => {
                  if (bus.departurePosition && bus.arrivalPosition) {
                    return (
                      <div key={bus.id}>
                        <Marker position={bus.departurePosition}>
                          <Popup>
                            <div>
                              <h3 className="font-bold">Bus Departure</h3>
                              <p>{bus.departure_location}</p>
                              <p>Company: {bus.company}</p>
                              <p>Departure: {new Date(bus.departure_time).toLocaleString()}</p>
                              {bus.tickets.length > 0 && (
                                <div className="mt-2">
                                  <h4 className="font-semibold">Passengers:</h4>
                                  <ul className="list-disc pl-4">
                                    {bus.tickets.map(ticket => (
                                      <li key={ticket.id}>
                                        {ticket.person.name}
                                        {ticket.seat && <span className="text-xs ml-1">(Seat: {ticket.seat})</span>}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                        
                        <Marker position={bus.arrivalPosition}>
                          <Popup>
                            <div>
                              <h3 className="font-bold">Bus Arrival</h3>
                              <p>{bus.arrival_location}</p>
                              <p>Company: {bus.company}</p>
                              <p>Arrival: {new Date(bus.arrival_time).toLocaleString()}</p>
                              {bus.tickets.length > 0 && (
                                <div className="mt-2">
                                  <h4 className="font-semibold">Passengers:</h4>
                                  <ul className="list-disc pl-4">
                                    {bus.tickets.map(ticket => (
                                      <li key={ticket.id}>
                                        {ticket.person.name}
                                        {ticket.seat && <span className="text-xs ml-1">(Seat: {ticket.seat})</span>}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                        
                        <Polyline
                          pathOptions={{ color: pathColors.bus, weight: 3 }}
                          positions={[bus.departurePosition, bus.arrivalPosition]}
                        />
                      </div>
                    );
                  }
                  return null;
                })}
                
                {/* Car Routes */}
                {showCars && filteredData.cars.map((car) => {
                  if (car.departurePosition && car.arrivalPosition) {
                    return (
                      <div key={car.id}>
                        <Marker position={car.departurePosition}>
                          <Popup>
                            <div>
                              <h3 className="font-bold">Car Pickup</h3>
                              <p>{car.departure_location}</p>
                              <p>Driver: {car.driver_name}</p>
                              <p>Departure: {car.departure_time && new Date(car.departure_time).toLocaleString()}</p>
                              {car.reservations.length > 0 && (
                                <div className="mt-2">
                                  <h4 className="font-semibold">Passengers:</h4>
                                  <ul className="list-disc pl-4">
                                    {car.reservations.map(res => (
                                      <li key={res.id}>
                                        {res.person.name}
                                        {res.is_driver && <span className="text-xs ml-1">(Driver)</span>}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                        
                        <Marker position={car.arrivalPosition}>
                          <Popup>
                            <div>
                              <h3 className="font-bold">Car Dropoff</h3>
                              <p>{car.arrival_location}</p>
                              <p>Driver: {car.driver_name}</p>
                              <p>Arrival: {car.arrival_time && new Date(car.arrival_time).toLocaleString()}</p>
                              {car.reservations.length > 0 && (
                                <div className="mt-2">
                                  <h4 className="font-semibold">Passengers:</h4>
                                  <ul className="list-disc pl-4">
                                    {car.reservations.map(res => (
                                      <li key={res.id}>
                                        {res.person.name}
                                        {res.is_driver && <span className="text-xs ml-1">(Driver)</span>}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                        
                        <Polyline
                          pathOptions={{ color: pathColors.car, weight: 3, dashArray: "5, 5" }}
                          positions={[car.departurePosition, car.arrivalPosition]}
                        />
                      </div>
                    );
                  }
                  return null;
                })}
                
                {/* Train Routes */}
                {showTrains && filteredData.trains.map((train) => {
                  if (train.departurePosition && train.arrivalPosition) {
                    return (
                      <div key={train.id}>
                        <Marker position={train.departurePosition}>
                          <Popup>
                            <div>
                              <h3 className="font-bold">Train Departure</h3>
                              <p>{train.departure_station}</p>
                              <p>Company: {train.company}</p>
                              <p>Train: {train.train_number}</p>
                              <p>Departure: {new Date(train.departure_time).toLocaleString()}</p>
                              {train.tickets.length > 0 && (
                                <div className="mt-2">
                                  <h4 className="font-semibold">Passengers:</h4>
                                  <ul className="list-disc pl-4">
                                    {train.tickets.map(ticket => (
                                      <li key={ticket.id}>
                                        {ticket.person.name}
                                        {ticket.seat && <span className="text-xs ml-1">(Seat: {ticket.seat})</span>}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                        
                        <Marker position={train.arrivalPosition}>
                          <Popup>
                            <div>
                              <h3 className="font-bold">Train Arrival</h3>
                              <p>{train.arrival_station}</p>
                              <p>Company: {train.company}</p>
                              <p>Train: {train.train_number}</p>
                              <p>Arrival: {new Date(train.arrival_time).toLocaleString()}</p>
                              {train.tickets.length > 0 && (
                                <div className="mt-2">
                                  <h4 className="font-semibold">Passengers:</h4>
                                  <ul className="list-disc pl-4">
                                    {train.tickets.map(ticket => (
                                      <li key={ticket.id}>
                                        {ticket.person.name}
                                        {ticket.seat && <span className="text-xs ml-1">(Seat: {ticket.seat})</span>}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                        
                        <Polyline
                          pathOptions={{ color: pathColors.train, weight: 4 }}
                          positions={[train.departurePosition, train.arrivalPosition]}
                        />
                      </div>
                    );
                  }
                  return null;
                })}
                
                {/* Flight Routes */}
                {showFlights && filteredData.flights.map((flight) => {
                  if (flight.departurePosition && flight.arrivalPosition) {
                    return (
                      <div key={flight.id}>
                        <Marker position={flight.departurePosition}>
                          <Popup>
                            <div>
                              <h3 className="font-bold">Flight Departure</h3>
                              <p>{flight.departure_airport}</p>
                              <p>Airline: {flight.airline}</p>
                              <p>Flight: {flight.flight_number}</p>
                              <p>Departure: {new Date(flight.departure_time).toLocaleString()}</p>
                              {flight.tickets.length > 0 && (
                                <div className="mt-2">
                                  <h4 className="font-semibold">Passengers:</h4>
                                  <ul className="list-disc pl-4">
                                    {flight.tickets.map(ticket => (
                                      <li key={ticket.id}>
                                        {ticket.person.name}
                                        {ticket.seat && <span className="text-xs ml-1">(Seat: {ticket.seat})</span>}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                        
                        <Marker position={flight.arrivalPosition}>
                          <Popup>
                            <div>
                              <h3 className="font-bold">Flight Arrival</h3>
                              <p>{flight.arrival_airport}</p>
                              <p>Airline: {flight.airline}</p>
                              <p>Flight: {flight.flight_number}</p>
                              <p>Arrival: {new Date(flight.arrival_time).toLocaleString()}</p>
                              {flight.tickets.length > 0 && (
                                <div className="mt-2">
                                  <h4 className="font-semibold">Passengers:</h4>
                                  <ul className="list-disc pl-4">
                                    {flight.tickets.map(ticket => (
                                      <li key={ticket.id}>
                                        {ticket.person.name}
                                        {ticket.seat && <span className="text-xs ml-1">(Seat: {ticket.seat})</span>}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                        
                        <Polyline
                          pathOptions={{ color: pathColors.flight, weight: 3, dashArray: "10, 10" }}
                          positions={[flight.departurePosition, flight.arrivalPosition]}
                        />
                      </div>
                    );
                  }
                  return null;
                })}
              </MapContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[600px] bg-muted rounded-md">
              <p className="text-muted-foreground">
                No valid location found for this event. Please update the event address.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default EventMap; 