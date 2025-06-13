import { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EventRegistration } from "@/components/EventRegistration/EventRegistration";

// Auth Pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Logout from "@/pages/Logout";

// Main App Pages
import Dashboard from "@/pages/Dashboard";
import Events from "@/pages/Events";
import EventForm from "@/pages/EventForm";
import Statistics from "@/pages/Statistics";
import EventSchedule from "@/pages/EventSchedule";
import EventMap from "@/pages/EventMap";
import Persons from "@/pages/Persons";
import PersonForm from "@/pages/PersonForm";
import PersonDetails from "@/pages/PersonDetails";
import Hotels from "@/pages/Hotels";
import HotelForm from "@/pages/HotelForm";
import Flights from "@/pages/Flights";
import FlightForm from "@/pages/FlightForm";
import FlightDetails from "@/pages/FlightDetails";
import Buses from "@/pages/Buses";
import BusForm from "@/pages/BusForm";
import BusDetails from "@/pages/BusDetails";
import HotelReservations from "@/pages/HotelReservations";
import Cars from "@/pages/Cars";
import CarForm from "@/pages/CarForm";
import CarDetails from "@/pages/CarDetails";
import Trains from "@/pages/Trains";
import TrainForm from "@/pages/TrainForm";
import TrainDetails from "@/pages/TrainDetails";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import { EventExpenses } from "@/pages/EventExpenses";
import EventDocuments from "@/pages/EventDocuments";

// Public routes (no auth required)
export const publicRoutes: RouteObject[] = [
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/logout", element: <Logout /> },
];

// Protected routes (auth required)
// These will be wrapped with the ProtectedRoute component
export const protectedRoutes: RouteObject[] = [
  { 
    path: "/",
    element: <Dashboard />
  },
  { 
    path: "/dashboard",
    element: <Dashboard />
  },
  { 
    path: "/events",
    element: <Events />
  },
  { 
    path: "/events/new",
    element: <EventForm />
  },
  { 
    path: "/events/:id",
    element: <EventForm />
  },
  { 
    path: "/expenses",
    element: <EventExpenses />
  },
  { 
    path: "/statistics",
    element: <Statistics />
  },
  { 
    path: "/event-schedule",
    element: <EventSchedule />
  },
  { 
    path: "/event-map",
    element: <EventMap />
  },
  { 
    path: "/persons",
    element: <Persons />
  },
  { 
    path: "/persons/new",
    element: <PersonForm />
  },
  { 
    path: "/persons/:id",
    element: <PersonForm />
  },
  { 
    path: "/persons/details/:id",
    element: <PersonDetails />
  },
  { 
    path: "/hotels",
    element: <Hotels />
  },
  { 
    path: "/hotels/new",
    element: <HotelForm />
  },
  { 
    path: "/hotels/:id",
    element: <HotelForm />
  },
  { 
    path: "/flights",
    element: <Flights />
  },
  { 
    path: "/flights/new",
    element: <FlightForm />
  },
  { 
    path: "/flights/:id",
    element: <FlightForm />
  },
  { 
    path: "/flights/details/:id",
    element: <FlightDetails />
  },
  { 
    path: "/buses",
    element: <Buses />
  },
  { 
    path: "/buses/new",
    element: <BusForm />
  },
  { 
    path: "/buses/:id",
    element: <BusForm />
  },
  { 
    path: "/buses/details/:id",
    element: <BusDetails />
  },
  { 
    path: "/hotel-reservations",
    element: <HotelReservations />
  },
  { 
    path: "/cars",
    element: <Cars />
  },
  { 
    path: "/cars/new",
    element: <CarForm />
  },
  { 
    path: "/cars/:id",
    element: <CarForm />
  },
  { 
    path: "/cars/details/:id",
    element: <CarDetails />
  },
  { 
    path: "/trains",
    element: <Trains />
  },
  { 
    path: "/trains/new",
    element: <TrainForm />
  },
  { 
    path: "/trains/:id",
    element: <TrainForm />
  },
  { 
    path: "/trains/details/:id",
    element: <TrainDetails />
  },
  { 
    path: "/profile",
    element: <Profile />
  },
  { 
    path: "/events/:id/documents",
    element: <EventDocuments />
  },
  { 
    path: "/event-registration",
    element: <EventRegistration />
  },
];

// All routes combined
export const routes: RouteObject[] = [
  ...publicRoutes,
  // Wrap protected routes with ProtectedRoute component
  ...protectedRoutes.map((route) => ({
    ...route,
    element: <ProtectedRoute>{route.element}</ProtectedRoute>,
  })),
  // Not found route
  { path: "*", element: <NotFound /> },
]; 