export interface Flight {
  id: string;
  airline: string;
  departure_airport: string;
  arrival_airport: string;
}

export interface Train {
  id: string;
  company: string;
  departure_station: string;
  arrival_station: string;
}

export interface Bus {
  id: string;
  company: string;
  departure_location: string;
  arrival_location: string;
}

export interface Car {
  id: string;
  company: string;
  departure_location: string;
  arrival_location: string;
}

export interface Hotel {
  id: string;
  name: string;
}

export type Resource = Flight | Train | Bus | Car | Hotel;

export interface Person {
  id: string;
  name: string;
} 