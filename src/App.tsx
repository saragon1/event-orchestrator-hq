import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Persons from "./pages/Persons";
import PersonForm from "./pages/PersonForm";
import PersonDetails from "./pages/PersonDetails";
import Hotels from "./pages/Hotels";
import HotelForm from "./pages/HotelForm";
import Flights from "./pages/Flights";
import Buses from "./pages/Buses";
import Events from "./pages/Events";
import EventForm from "./pages/EventForm";
import FlightForm from "./pages/FlightForm";
import BusForm from "./pages/BusForm";
import NotFound from "./pages/NotFound";
import FlightDetails from "./pages/FlightDetails";
import BusDetails from "./pages/BusDetails";
import HotelReservations from "./pages/HotelReservations";
import Cars from "./pages/Cars";
import CarForm from "./pages/CarForm";
import CarDetails from "./pages/CarDetails";
import Trains from "./pages/Trains";
import TrainForm from "./pages/TrainForm";
import TrainDetails from "./pages/TrainDetails";
import EventSchedule from "./pages/EventSchedule";
import EventMap from "./pages/EventMap";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/new" element={<EventForm />} />
          <Route path="/events/:id" element={<EventForm />} />
          <Route path="/event-schedule" element={<EventSchedule />} />
          <Route path="/event-map" element={<EventMap />} />
          <Route path="/persons" element={<Persons />} />
          <Route path="/persons/new" element={<PersonForm />} />
          <Route path="/persons/:id" element={<PersonForm />} />
          <Route path="/persons/details/:id" element={<PersonDetails />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/hotels/new" element={<HotelForm />} />
          <Route path="/hotels/:id" element={<HotelForm />} />
          <Route path="/flights" element={<Flights />} />
          <Route path="/flights/new" element={<FlightForm />} />
          <Route path="/flights/:id" element={<FlightForm />} />
          <Route path="/flights/details/:id" element={<FlightDetails />} />
          <Route path="/buses" element={<Buses />} />
          <Route path="/buses/new" element={<BusForm />} />
          <Route path="/buses/:id" element={<BusForm />} />
          <Route path="/buses/details/:id" element={<BusDetails />} />
          <Route path="/hotel-reservations" element={<HotelReservations />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/cars/new" element={<CarForm />} />
          <Route path="/cars/:id" element={<CarForm />} />
          <Route path="/cars/details/:id" element={<CarDetails />} />
          <Route path="/trains" element={<Trains />} />
          <Route path="/trains/new" element={<TrainForm />} />
          <Route path="/trains/:id" element={<TrainForm />} />
          <Route path="/trains/details/:id" element={<TrainDetails />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
