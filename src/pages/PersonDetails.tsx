import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/layout";
import { supabase } from "@/integrations/supabase/client";
import { useEventStore } from "@/stores/event-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Printer, 
  Hotel, 
  Plane, 
  Train, 
  Bus, 
  Car, 
  Calendar, 
  MapPin, 
  Clock, 
  ArrowLeft,
  Info,
  X 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { QueryData } from "@supabase/supabase-js";

interface Person {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
}

interface Event {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  description: string | null;
}

// Define query types first
const hotelReservationQuery = supabase
  .from("hotel_reservations")
  .select(`*, hotel:hotel_id(*)`);

const flightTicketsQuery = supabase
  .from("flight_tickets")
  .select(`*, flight:flight_id(*)`);

const trainTicketsQuery = supabase
  .from("train_tickets")
  .select(`*, train:train_id(*)`);

const busTicketsQuery = supabase
  .from("bus_tickets")
  .select(`*, bus:bus_id(*)`);

const carReservationsQuery = supabase
  .from("car_reservations")
  .select(`*, car:car_id(*)`);

// Now use QueryData to get the properly typed result with joins
type HotelReservation = QueryData<typeof hotelReservationQuery>[0];
type FlightTicket = QueryData<typeof flightTicketsQuery>[0];
type TrainTicket = QueryData<typeof trainTicketsQuery>[0];
type BusTicket = QueryData<typeof busTicketsQuery>[0];
type CarReservation = QueryData<typeof carReservationsQuery>[0];

type TravelItem = {
  type: 'flight' | 'train' | 'bus' | 'car';
  time: string;
  data: FlightTicket | TrainTicket | BusTicket | CarReservation;
};

const PersonDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [person, setPerson] = useState<Person | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [hotelReservation, setHotelReservation] = useState<HotelReservation | null>(null);
  const [flightTickets, setFlightTickets] = useState<FlightTicket[]>([]);
  const [trainTickets, setTrainTickets] = useState<TrainTicket[]>([]);
  const [busTickets, setBusTickets] = useState<BusTicket[]>([]);
  const [carReservations, setCarReservations] = useState<CarReservation[]>([]);
  const { selectedEventId } = useEventStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [eventRole, setEventRole] = useState<string>('');

  useEffect(() => {
    const fetchPersonDetails = async () => {
      if (!id || !selectedEventId) return;
      
      setIsLoading(true);
      try {
        // Fetch person details
        const { data: personData, error: personError } = await supabase
          .from("persons")
          .select("*")
          .eq("id", id)
          .single();

        if (personError) throw personError;
        setPerson(personData);

        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", selectedEventId)
          .single();

        if (eventError) throw eventError;
        setEvent(eventData);

        // Fetch event role
        const { data: eventRoleData, error: eventRoleError } = await supabase
          .from("event_persons")
          .select("event_role")
          .eq("person_id", id)
          .eq("event_id", selectedEventId)
          .single();

        if (!eventRoleError && eventRoleData) {
          setEventRole(eventRoleData.event_role || 'Attendee');
        }

        // Fetch hotel reservation
        const { data: hotelResData, error: hotelResError } = await supabase
          .from("hotel_reservations")
          .select(`
            *,
            hotel:hotel_id(*)
          `)
          .eq("person_id", id)
          .eq("event_id", selectedEventId)
          .single();

        if (!hotelResError) {
          setHotelReservation(hotelResData);
        }

        // Fetch flight tickets
        const { data: flightData, error: flightError } = await supabase
          .from("flight_tickets")
          .select(`
            *,
            flight:flight_id(*)
          `)
          .eq("person_id", id)
          .eq("event_id", selectedEventId);

        if (!flightError && flightData) {
          setFlightTickets(flightData);
        }

        // Fetch train tickets
        const { data: trainData, error: trainError } = await supabase
          .from("train_tickets")
          .select(`
            *,
            train:train_id(*)
          `)
          .eq("person_id", id)
          .eq("event_id", selectedEventId);

        if (!trainError && trainData) {
          setTrainTickets(trainData);
        }

        // Fetch bus tickets
        const { data: busData, error: busError } = await supabase
          .from("bus_tickets")
          .select(`
            *,
            bus:bus_id(*)
          `)
          .eq("person_id", id)
          .eq("event_id", selectedEventId);

        if (!busError && busData) {
          setBusTickets(busData);
        }

        // Fetch car reservations
        const { data: carData, error: carError } = await supabase
          .from("car_reservations")
          .select(`
            *,
            car:car_id(*)
          `)
          .eq("person_id", id)
          .eq("event_id", selectedEventId);

        if (!carError && carData) {
          setCarReservations(carData);
        }

      } catch (error) {
        console.error("Error fetching person details:", error);
        toast({
          title: "Error",
          description: "Could not fetch person details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersonDetails();
  }, [id, selectedEventId, toast]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Travel Itinerary - ${person?.name}</title>
          <style>
            @page {
              size: A4;
              margin: 27mm 16mm 27mm 16mm;
            }
            * {
              box-sizing: border-box;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            body {
              margin: 0;
              padding: 0;
              color: #333;
              font-size: 12pt;
              line-height: 1.5;
              background: white;
            }
            .document {
              max-width: 100%;
              margin: 0 auto;
              padding: 1.5cm 2.5cm;
            }
            .header {
              text-align: center;
              padding-bottom: 12pt;
              margin-bottom: 36pt;
              border-bottom: 1pt solid #000;
            }
            .header h1 {
              font-size: 24pt;
              font-weight: 700;
              margin: 0 0 12pt 0;
              color: #000;
            }
            .header p {
              margin: 0 0 8pt 0;
              font-size: 14pt;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 48pt;
            }
            table.info-table {
              border: 1pt solid #ddd;
              margin-left: 0;
              margin-right: 0;
              width: 100%;
            }
            table.info-table th {
              text-align: left;
              background-color: #f3f3f3;
              border-bottom: 1pt solid #ddd;
              padding: 10pt;
              width: 30%;
              font-weight: 600;
              vertical-align: top;
            }
            table.info-table td {
              padding: 10pt;
              border-bottom: 1pt solid #ddd;
              vertical-align: top;
              word-wrap: break-word;
              word-break: break-word;
              max-width: 70%;
              overflow-wrap: break-word;
              hyphens: auto;
            }
            table.info-table tr:last-child th, 
            table.info-table tr:last-child td {
              border-bottom: none;
            }
            
            .section {
              margin-bottom: 48pt;
              page-break-inside: avoid;
              margin-left: 0;
              margin-right: 0;
              width: 100%;
            }
            
            .section-header {
              font-size: 18pt;
              font-weight: 600;
              margin: 40pt 0 20pt 0;
              padding-bottom: 10pt;
              border-bottom: 1pt solid #000;
              position: relative;
              page-break-after: avoid;
            }
            .section-header::before {
              content: '';
              width: 24pt;
              height: 24pt;
              display: inline-block;
              margin-right: 10pt;
              background-repeat: no-repeat;
              background-position: center;
              background-size: contain;
              vertical-align: middle;
            }
            .section-header.travel::before {
              content: '✈';
            }
            .section-header.accommodation::before {
              content: '🏨';
            }
            
            .travel-list {
              width: 100%;
            }
            
            .travel-item {
              border: 1pt solid #ddd;
              padding: 20pt;
              margin-bottom: 30pt;
              page-break-inside: avoid;
              position: relative;
              border-radius: 6pt;
              box-shadow: 0 1pt 3pt rgba(0,0,0,0.05);
              width: 100%;
              margin-left: 0;
              margin-right: 0;
            }
            .travel-item:last-child {
              margin-bottom: 20pt;
            }
            .travel-item-header {
              display: flex;
              align-items: center;
              font-weight: bold;
              margin-bottom: 16pt;
              font-size: 16pt;
              border-bottom: 1pt solid #eee;
              padding-bottom: 12pt;
            }
            .travel-item-header::before {
              font-size: 18pt;
              margin-right: 12pt;
            }
            .flight-item .travel-item-header::before {
              content: '✈';
            }
            .train-item .travel-item-header::before {
              content: '🚄';
            }
            .bus-item .travel-item-header::before {
              content: '🚌';
            }
            .car-item .travel-item-header::before {
              content: '🚗';
            }
            .travel-item-body {
              display: flex;
              justify-content: space-between;
            }
            .travel-route {
              display: flex;
              justify-content: space-between;
              margin-bottom: 16pt;
              padding: 0 10pt;
              width: 100%;
            }
            .travel-route-separator {
              flex-grow: 1;
              border-bottom: 1pt dashed #ccc;
              margin: 0 20pt;
              position: relative;
              top: -8pt;
            }
            .travel-route-separator::after {
              content: '→';
              position: absolute;
              top: 18pt;
              left: 50%;
              transform: translateX(-50%);
              color: #999;
            }
            .travel-endpoint {
              text-align: center;
              white-space: normal;
              max-width: 40%;
              word-wrap: break-word;
              overflow-wrap: break-word;
              hyphens: auto;
              padding: 8pt;
            }
            
            .travel-location {
              font-weight: 600;
              margin-bottom: 8pt;
              word-wrap: break-word;
              overflow-wrap: break-word;
              text-overflow: ellipsis;
              hyphens: auto;
            }
            .travel-time {
              font-size: 12pt;
              color: #666;
            }
            
            .hotel-info {
              border: 1pt solid #ddd;
              padding: 24pt;
              margin-bottom: 30pt;
              border-radius: 6pt;
              box-shadow: 0 1pt 3pt rgba(0,0,0,0.05);
              width: 100%;
              margin-left: 0;
              margin-right: 0;
            }
            .hotel-name {
              font-weight: 700;
              font-size: 16pt;
              margin-bottom: 12pt;
            }
            .hotel-address {
              margin-bottom: 20pt;
              color: #666;
              word-wrap: break-word;
              overflow-wrap: break-word;
              white-space: normal;
              hyphens: auto;
              line-height: 1.5;
              padding-right: 10pt;
            }
            .hotel-dates {
              display: flex;
              margin-bottom: 20pt;
              padding: 16pt 0;
              border-top: 1pt solid #eee;
              border-bottom: 1pt solid #eee;
            }
            .hotel-date-group {
              width: 50%;
              text-align: center;
              padding: 0 10pt;
            }
            .hotel-date-group:first-child {
              border-right: 1pt solid #eee;
            }
            .hotel-date-label {
              font-weight: 600;
              margin-bottom: 8pt;
            }
            .hotel-details {
              display: flex;
              flex-wrap: wrap;
              margin: 0 -10pt;
            }
            .hotel-detail-item {
              width: 50%;
              margin-bottom: 16pt;
              padding: 0 10pt;
            }
            .hotel-detail-label {
              font-weight: 600;
              font-size: 12pt;
              color: #666;
              margin-bottom: 6pt;
            }
            .hotel-detail-value {
              word-wrap: break-word;
              overflow-wrap: break-word;
              hyphens: auto;
            }
            
            .travel-detail {
              margin-top: 20pt;
              border-top: 1pt solid #eee;
              padding-top: 16pt;
              display: flex;
              flex-wrap: wrap;
            }
            .travel-detail-item {
              margin-right: 30pt;
              margin-bottom: 10pt;
            }
            .travel-detail-label {
              font-weight: 600;
              font-size: 12pt;
              color: #666;
              margin-bottom: 6pt;
            }
            .travel-detail-value {
              word-wrap: break-word;
              overflow-wrap: break-word;
              hyphens: auto;
            }
            
            .notice {
              background-color: #f8f8f8;
              padding: 20pt;
              border: 1pt solid #ddd;
              border-radius: 6pt;
              margin-bottom: 30pt;
              text-align: center;
              color: #666;
              width: 100%;
              margin-left: 0;
              margin-right: 0;
            }
            
            .footer {
              margin-top: 40pt;
              padding-top: 16pt;
              border-top: 1pt solid #eee;
              text-align: center;
              font-size: 10pt;
              color: #999;
              width: 100%;
            }
            
            @media print {
              body {
                background: white;
              }
              .document {
                padding: 0 1.5cm;
              }
              .section {
                page-break-inside: avoid;
                margin-bottom: 40pt;
                margin-top: 2cm;
              }
              
              /* Force each travel item to have appropriate spacing if it appears at the top of a page */
              .travel-item {
                page-break-inside: avoid;
                page-break-before: auto;
                margin-top: 2cm;
              }
              
              /* Only apply top margin to travel items that come after another travel item with a page break */
              .travel-item + .travel-item {
                margin-top: 1.5cm;
              }
              
              /* First travel item after the section header should not have extra margin */
              .section-header.travel + .travel-list .travel-item:first-child {
                margin-top: 20pt;
              }
              
              .section-header {
                padding-top: 2cm;
                margin-top: 0;
              }
              
              /* Ensure any section that gets printed at the top of a page has proper spacing */
              .section:first-of-type {
                margin-top: 0;
              }
              
              /* Apply top margin to the travel section regardless of page position */
              .section-header.travel {
                padding-top: 2cm;
                margin-top: 0;
              }
              
              /* Ensure all page breaks maintain proper spacing */
              .pagebreak {
                page-break-before: always;
                margin-top: 2cm;
              }
              
              /* Make sure each page has content at a consistent position */
              @page {
                margin-top: 2cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="document">
            <div class="header">
              <h1>Travel Itinerary</h1>
              <p>${event?.name || ''}</p>
              <p>${event ? `${formatDate(event.start_date)} to ${formatDate(event.end_date)}` : ''}</p>
            </div>
            
            <div class="section">
              <table class="info-table">
                <tr>
                  <th>Name</th>
                  <td>${person?.name || ''}</td>
                </tr>
                <tr>
                  <th>Email</th>
                  <td>${person?.email || ''}</td>
                </tr>
                <tr>
                  <th>Phone</th>
                  <td>${person?.phone || ''}</td>
                </tr>
                <tr>
                  <th>Event Role</th>
                  <td>${eventRole || 'Attendee'}</td>
                </tr>
              </table>
            </div>
            
            <div class="section">
              <div class="section-header accommodation">Accommodation</div>
              ${!hotelReservation ? `
              <div class="notice">
                <p>No hotel reservation found for this traveler.</p>
              </div>` : `
              <div class="hotel-info">
                <div class="hotel-name">${hotelReservation.hotel?.name || ''}</div>
                <div class="hotel-address">${hotelReservation.hotel?.address || ''}</div>
                
                ${hotelReservation.hotel?.phone ? `
                <div class="hotel-detail-item">
                  <div class="hotel-detail-label">Hotel Phone</div>
                  <div class="hotel-detail-value">${hotelReservation.hotel.phone}</div>
                </div>` : ''}
                
                <div class="hotel-dates">
                  <div class="hotel-date-group">
                    <div class="hotel-date-label">Check-in</div>
                    <div class="hotel-date-value">${formatDate(hotelReservation.check_in)}</div>
                  </div>
                  <div class="hotel-date-group">
                    <div class="hotel-date-label">Check-out</div>
                    <div class="hotel-date-value">${formatDate(hotelReservation.check_out)}</div>
                  </div>
                </div>
                
                <div class="hotel-details">
                  ${hotelReservation.confirmation_number ? `
                  <div class="hotel-detail-item">
                    <div class="hotel-detail-label">Confirmation Number</div>
                    <div class="hotel-detail-value">${hotelReservation.confirmation_number}</div>
                  </div>` : ''}
                  
                  ${hotelReservation.room_type ? `
                  <div class="hotel-detail-item">
                    <div class="hotel-detail-label">Room Type</div>
                    <div class="hotel-detail-value">${hotelReservation.room_type}</div>
                  </div>` : ''}
                </div>
              </div>`}
            </div>
            
            <div class="section">
              <div class="section-header travel">Travel Timeline</div>
              ${getTravelTimeline().length === 0 ? `
              <div class="notice">
                <p>No travel arrangements found for this traveler.</p>
              </div>` : `
              <div class="travel-list">
                ${getTravelTimeline().map((item, index) => {
                  if (item.type === 'flight') {
                    const ticket = item.data as FlightTicket;
                    return `
                    <div class="travel-item flight-item">
                      <div class="travel-item-header">
                        ${ticket.flight?.airline || ''} Flight ${ticket.flight?.flight_number || ''}
                        ${ticket.seat ? `<span style="margin-left: auto; font-size: 10pt; background: #eee; padding: 2pt 6pt; border-radius: 4pt;">Seat ${ticket.seat}</span>` : ''}
                      </div>
                      <div class="travel-route">
                        <div class="travel-endpoint">
                          <div class="travel-location">${ticket.flight?.departure_airport || ''}</div>
                          <div class="travel-time">${formatDateTime(ticket.flight?.departure_time || '')}</div>
                        </div>
                        <div class="travel-route-separator"></div>
                        <div class="travel-endpoint">
                          <div class="travel-location">${ticket.flight?.arrival_airport || ''}</div>
                          <div class="travel-time">${formatDateTime(ticket.flight?.arrival_time || '')}</div>
                        </div>
                      </div>
                      ${ticket.confirmation_number ? `
                      <div class="travel-detail">
                        <div class="travel-detail-item">
                          <div class="travel-detail-label">Confirmation</div>
                          <div class="travel-detail-value">${ticket.confirmation_number}</div>
                        </div>
                      </div>` : ''}
                    </div>`;
                  } else if (item.type === 'train') {
                    const ticket = item.data as TrainTicket;
                    return `
                    <div class="travel-item train-item">
                      <div class="travel-item-header">
                        ${ticket.train?.company || ''} Train ${ticket.train?.train_number || ''}
                        ${ticket.seat ? `<span style="margin-left: auto; font-size: 10pt; background: #eee; padding: 2pt 6pt; border-radius: 4pt;">Seat ${ticket.seat}</span>` : ''}
                      </div>
                      <div class="travel-route">
                        <div class="travel-endpoint">
                          <div class="travel-location">${ticket.train?.departure_station || ''}</div>
                          <div class="travel-time">${formatDateTime(ticket.train?.departure_time || '')}</div>
                        </div>
                        <div class="travel-route-separator"></div>
                        <div class="travel-endpoint">
                          <div class="travel-location">${ticket.train?.arrival_station || ''}</div>
                          <div class="travel-time">${formatDateTime(ticket.train?.arrival_time || '')}</div>
                        </div>
                      </div>
                      ${ticket.confirmation_number ? `
                      <div class="travel-detail">
                        <div class="travel-detail-item">
                          <div class="travel-detail-label">Confirmation</div>
                          <div class="travel-detail-value">${ticket.confirmation_number}</div>
                        </div>
                      </div>` : ''}
                    </div>`;
                  } else if (item.type === 'bus') {
                    const ticket = item.data as BusTicket;
                    return `
                    <div class="travel-item bus-item">
                      <div class="travel-item-header">
                        ${ticket.bus?.company || ''} Bus ${ /*ticket.bus?.bus_number || ''} */ ''}
                        ${ticket.seat ? `<span style="margin-left: auto; font-size: 10pt; background: #eee; padding: 2pt 6pt; border-radius: 4pt;">Seat ${ticket.seat}</span>` : ''}
                      </div>
                      <div class="travel-route">
                        <div class="travel-endpoint">
                          <div class="travel-location">${ticket.bus?.departure_location || ''}</div>
                          <div class="travel-time">${formatDateTime(ticket.bus?.departure_time || '')}</div>
                        </div>
                        <div class="travel-route-separator"></div>
                        <div class="travel-endpoint">
                          <div class="travel-location">${ticket.bus?.arrival_location || ''}</div>
                          <div class="travel-time">${formatDateTime(ticket.bus?.arrival_time || '')}</div>
                        </div>
                      </div>
                      ${ticket.confirmation_number ? `
                      <div class="travel-detail">
                        <div class="travel-detail-item">
                          <div class="travel-detail-label">Confirmation</div>
                          <div class="travel-detail-value">${ticket.confirmation_number}</div>
                        </div>
                      </div>` : ''}
                    </div>`;
                  } else if (item.type === 'car') {
                    const reservation = item.data as CarReservation;
                    const licensePlate = reservation.car?.license_plate ? ` (${reservation.car.license_plate})` : '';
                    const carType = reservation.car?.car_type ? `${reservation.car.car_type}` : '';
                    const driver_name = reservation.car?.driver_name ? `${reservation.car.driver_name}` : '';
                    const driver_phone = reservation.car?.driver_phone ? `${reservation.car.driver_phone}` : '';
                    const car_notes = reservation.notes ? `${reservation.notes}` : '';
                    const car_company = reservation.car?.company ? `${reservation.car.company}` : '';

                    return `
                    <div class="travel-item car-item">
                      <div class="travel-item-header">
                        ${carType === 'private' ? 'Private Car' : `${carType ? carType.toUpperCase() : 'Car'}`}
                        ${licensePlate ? ` ${licensePlate}` : ''}
                        ${carType ? `<span style="margin-left: auto; font-size: 10pt; background: #eee; padding: 2pt 6pt; border-radius: 4pt; text-transform: capitalize;">${carType}</span>` : ''}
                      </div>
                      ${(driver_name || driver_phone || car_company) ? `
                      <div class="travel-driver-info" style="margin-bottom: 16pt; color: #666;">
                        ${driver_name ? `<div><strong>Driver:</strong> ${driver_name}</div>` : ''}
                        ${driver_phone ? `<div><strong>Phone:</strong> ${driver_phone}</div>` : ''}
                        ${car_company ? `<div><strong>Company:</strong> ${car_company}</div>` : ''}
                      </div>` : ''}
                      <div class="travel-route">
                        <div class="travel-endpoint">
                          <div class="travel-location">Pickup</div>
                          <div class="travel-location">${ reservation.car?.departure_location || ''}</div>
                          <div class="travel-time">${formatDateTime( reservation.car?.departure_time || '')}</div>
                        </div>
                        <div class="travel-route-separator"></div>
                        <div class="travel-endpoint">
                          <div class="travel-location">Drop-off</div>
                          <div class="travel-location">${ reservation.car?.arrival_location || ''}</div>
                          <div class="travel-time">${formatDateTime( reservation.car?.arrival_time || '')}</div>
                        </div>
                      </div>
                      ${reservation.confirmation_number ? `
                      <div class="travel-detail">
                        <div class="travel-detail-item">
                          <div class="travel-detail-label">Confirmation</div>
                          <div class="travel-detail-value">${reservation.confirmation_number}</div>
                        </div>
                      </div>` : ''}
                      ${car_notes ? `
                      <div class="travel-detail">
                        <div class="travel-detail-item">
                          <div class="travel-detail-label">Notes</div>
                          <div class="travel-detail-value">${car_notes}</div>
                        </div>
                      </div>` : ''}
                    </div>`;
                  }
                  return '';
                }).join('')}
              </div>`}
            </div>
            
            <div class="footer">
              <p>Generated by Event Orchestrator HQ on ${format(new Date(), "MMMM d, yyyy")} • All times are local</p>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      return format(new Date(dateTimeStr), "MMM d, yyyy h:mm a");
    } catch (error) {
      return dateTimeStr || '';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch (error) {
      return dateStr || '';
    }
  };

  // Sort travel components by date
  const getTravelTimeline = () => {
    const timeline: TravelItem[] = [
      ...flightTickets.map(ticket => ({
        type: 'flight' as const,
        time: ticket.flight?.departure_time || '',
        data: ticket
      })),
      ...trainTickets.map(ticket => ({
        type: 'train' as const,
        time: ticket.train?.departure_time || '',
        data: ticket
      })),
      ...busTickets.map(ticket => ({
        type: 'bus' as const,
        time: ticket.bus?.departure_time || '',
        data: ticket
      })),
      ...carReservations.map(reservation => ({
        type: 'car' as const,
        time: reservation.car?.departure_time || '',
        data: reservation
      }))
    ].sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return new Date(a.time).getTime() - new Date(b.time).getTime();
    });
    
    return timeline;
  };

  if (!selectedEventId) {
    return (
      <DashboardLayout title="Person Itinerary">
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 p-4 rounded-lg">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Info className="h-5 w-5" />
            No Event Selected
          </h2>
          <p className="mt-1">
            Please select an event from the dropdown to view this person's itinerary.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Person Itinerary">
      <div className="mb-4 flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print Itinerary
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <div className="space-y-6" ref={printRef}>
          <div className="print-header text-center py-4 hidden print:block">
            <h1 className="text-2xl font-bold">Travel Itinerary</h1>
            <p className="text-muted-foreground">{event?.name}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Participant Information</span>
                {eventRole && (
                  <Badge variant="outline">{eventRole}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{person?.name}</h3>
                <p className="text-muted-foreground">{person?.email}</p>
                {person?.phone && (
                  <p className="text-muted-foreground">{person.phone}</p>
                )}
              </div>

              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Event Details
                </h4>
                <p className="font-medium">{event?.name}</p>
                <p className="text-muted-foreground">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  {event?.location}
                </p>
                <p className="text-muted-foreground">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {event ? `${formatDate(event.start_date)} to ${formatDate(event.end_date)}` : ''}
                </p>
              </div>
            </CardContent>
          </Card>

                    {/* Hotel Information */}
                    <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <Hotel className="h-5 w-5" />
                  <span>Accommodation</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hotelReservation ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <X className="h-4 w-4 mr-2" />
                  No hotel reservation found
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">{hotelReservation.hotel?.name}</h3>
                    <p className="text-muted-foreground">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      {hotelReservation.hotel?.address}
                    </p>
                    {hotelReservation.hotel?.phone && (
                      <p className="text-muted-foreground">
                        Phone: {hotelReservation.hotel.phone}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Check-in</p>
                      <p>{formatDate(hotelReservation.check_in)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Check-out</p>
                      <p>{formatDate(hotelReservation.check_out)}</p>
                    </div>
                  </div>
                  
                  {hotelReservation.confirmation_number && (
                    <div>
                      <p className="font-medium">Confirmation Number</p>
                      <p>{hotelReservation.confirmation_number}</p>
                    </div>
                  )}

                  {hotelReservation.room_type && (
                    <div>
                      <p className="font-medium">Room Type</p>
                      <p>{hotelReservation.room_type}</p>
                    </div>
                  )}

                  {hotelReservation.confirmation_number && (
                    <div>
                      <p className="font-medium">Confirmation Number</p>
                      <p>{hotelReservation.confirmation_number}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Travel Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Travel Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {getTravelTimeline().length === 0 ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <X className="h-4 w-4 mr-2" />
                  No travel arrangements found
                </div>
              ) : (
                <div className="space-y-4">
                  {getTravelTimeline().map((item, index) => {
                    if (item.type === 'flight') {
                      const ticket = item.data as FlightTicket;
                      return (
                        <div key={`flight-${ticket.id}`} className="border rounded-md p-4">
                          <div className="flex items-center gap-2 font-medium mb-2">
                            <Plane className="h-5 w-5 text-blue-500" />
                            <span>{ticket.flight?.airline} Flight {ticket.flight?.flight_number}</span>
                            {ticket.seat && <Badge variant="outline">Seat {ticket.seat}</Badge>}
                          </div>
                          <div className="grid gap-2">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">{ticket.flight?.departure_airport}</p>
                                <p className="text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {formatDateTime(ticket.flight?.departure_time)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{ticket.flight?.arrival_airport}</p>
                                <p className="text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {formatDateTime(ticket.flight?.arrival_time)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    } else if (item.type === 'train') {
                      const ticket = item.data as TrainTicket;
                      return (
                        <div key={`train-${ticket.id}`} className="border rounded-md p-4">
                          <div className="flex items-center gap-2 font-medium mb-2">
                            <Train className="h-5 w-5 text-green-500" />
                            <span>{ticket.train?.company} Train {ticket.train?.train_number}</span>
                            {ticket.seat && <Badge variant="outline">Seat {ticket.seat}</Badge>}
                          </div>
                          <div className="grid gap-2">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">{ticket.train?.departure_station}</p>
                                <p className="text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {formatDateTime(ticket.train?.departure_time)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{ticket.train?.arrival_station}</p>
                                <p className="text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {formatDateTime(ticket.train?.arrival_time)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    } else if (item.type === 'bus') {
                      const ticket = item.data as BusTicket;
                      return (
                        <div key={`bus-${ticket.id}`} className="border rounded-md p-4">
                          <div className="flex items-center gap-2 font-medium mb-2">
                            <Bus className="h-5 w-5 text-orange-500" />
                            <span>{ticket.bus?.company} Bus {/*ticket.bus?.bus_number*/ }</span>
                            {ticket.seat && <Badge variant="outline">Seat {ticket.seat}</Badge>}
                          </div>
                          <div className="grid gap-2">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">{ticket.bus?.departure_location}</p>
                                <p className="text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {formatDateTime(ticket.bus?.departure_time)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{ticket.bus?.arrival_location}</p>
                                <p className="text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {formatDateTime(ticket.bus?.arrival_time)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    } else if (item.type === 'car') {
                      const reservation = item.data as CarReservation;
                      return (
                        <div key={`car-${reservation.id}`} className="border rounded-md p-4">
                          <div className="flex items-center gap-2 font-medium mb-2">
                            <Car className="h-5 w-5 text-purple-500" />
                            <span>
                              {reservation.car?.license_plate && ` (${reservation.car.license_plate})`} -
                            </span>
                            {reservation.car?.car_type && <Badge variant="outline">{reservation.car.car_type}</Badge>}
                          </div>
                          <div className="grid gap-2">
                            <div className="mb-2">
                              <p className="font-medium">Pickup</p>
                              <p>{reservation.car?.departure_location || ''}</p>
                              <p className="text-sm text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {formatDateTime(reservation.car?.departure_time || '')}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium">Drop-off</p>
                              <p>{reservation.car?.arrival_location || ''}</p>
                              <p className="text-sm text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {formatDateTime(reservation.car?.arrival_time || '')}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      )}
    </DashboardLayout>
  );
};

export default PersonDetails; 