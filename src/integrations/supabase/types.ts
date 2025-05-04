export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bus_tickets: {
        Row: {
          bus_id: string
          confirmation_number: string | null
          created_at: string | null
          event_id: string
          id: string
          notes: string | null
          person_id: string
          seat: string | null
        }
        Insert: {
          bus_id: string
          confirmation_number?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          person_id: string
          seat?: string | null
        }
        Update: {
          bus_id?: string
          confirmation_number?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          person_id?: string
          seat?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bus_tickets_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_tickets_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      buses: {
        Row: {
          arrival_location: string
          arrival_time: string
          capacity: number
          company: string
          created_at: string | null
          departure_location: string
          departure_time: string
          event_id: string
          id: string
        }
        Insert: {
          arrival_location: string
          arrival_time: string
          capacity: number
          company: string
          created_at?: string | null
          departure_location: string
          departure_time: string
          event_id: string
          id?: string
        }
        Update: {
          arrival_location?: string
          arrival_time?: string
          capacity?: number
          company?: string
          created_at?: string | null
          departure_location?: string
          departure_time?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      car_reservations: {
        Row: {
          car_id: string
          confirmation_number: string | null
          created_at: string | null
          event_id: string
          id: string
          is_driver: boolean | null
          notes: string | null
          person_id: string
        }
        Insert: {
          car_id: string
          confirmation_number?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          is_driver?: boolean | null
          notes?: string | null
          person_id: string
        }
        Update: {
          car_id?: string
          confirmation_number?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          is_driver?: boolean | null
          notes?: string | null
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_reservations_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_reservations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_reservations_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          arrival_location: string | null
          arrival_time: string | null
          capacity: number | null
          car_type: Database["public"]["Enums"]["car_type"] | null
          company: string | null
          created_at: string | null
          departure_location: string | null
          departure_time: string | null
          driver_name: string | null
          driver_phone: string | null
          event_id: string
          id: string
          license_plate: string | null
          notes: string | null
        }
        Insert: {
          arrival_location?: string | null
          arrival_time?: string | null
          capacity?: number | null
          car_type?: Database["public"]["Enums"]["car_type"] | null
          company?: string | null
          created_at?: string | null
          departure_location?: string | null
          departure_time?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          event_id: string
          id?: string
          license_plate?: string | null
          notes?: string | null
        }
        Update: {
          arrival_location?: string | null
          arrival_time?: string | null
          capacity?: number | null
          car_type?: Database["public"]["Enums"]["car_type"] | null
          company?: string | null
          created_at?: string | null
          departure_location?: string | null
          departure_time?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          event_id?: string
          id?: string
          license_plate?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cars_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_expenses: {
        Row: {
          amount: number
          category:
            | Database["public"]["Enums"]["event_expenses_category"]
            | null
          created_at: string | null
          date: string
          description: string | null
          event_id: string
          id: string
          resource_id: string | null
          type: string
        }
        Insert: {
          amount: number
          category?:
            | Database["public"]["Enums"]["event_expenses_category"]
            | null
          created_at?: string | null
          date?: string
          description?: string | null
          event_id: string
          id?: string
          resource_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?:
            | Database["public"]["Enums"]["event_expenses_category"]
            | null
          created_at?: string | null
          date?: string
          description?: string | null
          event_id?: string
          id?: string
          resource_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_hotels: {
        Row: {
          created_at: string | null
          event_id: string
          hotel_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          hotel_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          hotel_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_hotels_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_hotels_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      event_persons: {
        Row: {
          created_at: string | null
          event_id: string
          event_role: Database["public"]["Enums"]["event_role"] | null
          id: string
          invite_status: Database["public"]["Enums"]["invite_status"] | null
          person_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          event_role?: Database["public"]["Enums"]["event_role"] | null
          id?: string
          invite_status?: Database["public"]["Enums"]["invite_status"] | null
          person_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          event_role?: Database["public"]["Enums"]["event_role"] | null
          id?: string
          invite_status?: Database["public"]["Enums"]["invite_status"] | null
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_persons_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_persons_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      event_schedules: {
        Row: {
          capacity: number | null
          color: string | null
          created_at: string | null
          description: string | null
          end_time: string
          event_id: string | null
          id: string
          is_public: boolean | null
          location: string | null
          materials: Json | null
          schedule_type: string
          speaker_ids: string[] | null
          start_time: string
          status: string
          tags: string[] | null
          title: string
          track: string | null
          updated_at: string | null
          virtual_meeting_url: string | null
        }
        Insert: {
          capacity?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          event_id?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          materials?: Json | null
          schedule_type: string
          speaker_ids?: string[] | null
          start_time: string
          status?: string
          tags?: string[] | null
          title: string
          track?: string | null
          updated_at?: string | null
          virtual_meeting_url?: string | null
        }
        Update: {
          capacity?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          event_id?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          materials?: Json | null
          schedule_type?: string
          speaker_ids?: string[] | null
          start_time?: string
          status?: string
          tags?: string[] | null
          title?: string
          track?: string | null
          updated_at?: string | null
          virtual_meeting_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_schedules_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          location: string
          name: string
          start_date: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          location: string
          name: string
          start_date: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          location?: string
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      flight_tickets: {
        Row: {
          confirmation_number: string | null
          created_at: string | null
          event_id: string
          flight_id: string
          id: string
          notes: string | null
          person_id: string
          seat: string | null
        }
        Insert: {
          confirmation_number?: string | null
          created_at?: string | null
          event_id: string
          flight_id: string
          id?: string
          notes?: string | null
          person_id: string
          seat?: string | null
        }
        Update: {
          confirmation_number?: string | null
          created_at?: string | null
          event_id?: string
          flight_id?: string
          id?: string
          notes?: string | null
          person_id?: string
          seat?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_tickets_flight_id_fkey"
            columns: ["flight_id"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flight_tickets_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      flights: {
        Row: {
          airline: string
          arrival_airport: string
          arrival_time: string
          created_at: string | null
          departure_airport: string
          departure_time: string
          event_id: string
          flight_number: string
          id: string
        }
        Insert: {
          airline: string
          arrival_airport: string
          arrival_time: string
          created_at?: string | null
          departure_airport: string
          departure_time: string
          event_id: string
          flight_number: string
          id?: string
        }
        Update: {
          airline?: string
          arrival_airport?: string
          arrival_time?: string
          created_at?: string | null
          departure_airport?: string
          departure_time?: string
          event_id?: string
          flight_number?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flights_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      geocoding_cache: {
        Row: {
          address: string
          created_at: string | null
          id: string
          latitude: number
          longitude: number
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          id?: string
          latitude: number
          longitude: number
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: string
          latitude?: number
          longitude?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      hotel_reservations: {
        Row: {
          check_in: string
          check_out: string
          confirmation_number: string | null
          created_at: string | null
          event_id: string
          hotel_id: string
          id: string
          notes: string | null
          person_id: string
          room_type: string | null
        }
        Insert: {
          check_in: string
          check_out: string
          confirmation_number?: string | null
          created_at?: string | null
          event_id: string
          hotel_id: string
          id?: string
          notes?: string | null
          person_id: string
          room_type?: string | null
        }
        Update: {
          check_in?: string
          check_out?: string
          confirmation_number?: string | null
          created_at?: string | null
          event_id?: string
          hotel_id?: string
          id?: string
          notes?: string | null
          person_id?: string
          room_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_reservations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_reservations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_reservations_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          address: string
          city: string
          country: string
          created_at: string | null
          id: string
          name: string
          phone: string | null
          rating: number | null
          website: string | null
        }
        Insert: {
          address: string
          city: string
          country: string
          created_at?: string | null
          id?: string
          name: string
          phone?: string | null
          rating?: number | null
          website?: string | null
        }
        Update: {
          address?: string
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          rating?: number | null
          website?: string | null
        }
        Relationships: []
      }
      persons: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      train_tickets: {
        Row: {
          confirmation_number: string | null
          created_at: string | null
          event_id: string
          id: string
          notes: string | null
          person_id: string
          seat: string | null
          train_id: string
        }
        Insert: {
          confirmation_number?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          person_id: string
          seat?: string | null
          train_id: string
        }
        Update: {
          confirmation_number?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          person_id?: string
          seat?: string | null
          train_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "train_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "train_tickets_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "train_tickets_train_id_fkey"
            columns: ["train_id"]
            isOneToOne: false
            referencedRelation: "trains"
            referencedColumns: ["id"]
          },
        ]
      }
      trains: {
        Row: {
          arrival_station: string
          arrival_time: string
          capacity: number
          company: string
          created_at: string | null
          departure_station: string
          departure_time: string
          event_id: string
          id: string
          notes: string | null
          train_number: string
        }
        Insert: {
          arrival_station: string
          arrival_time: string
          capacity?: number
          company: string
          created_at?: string | null
          departure_station: string
          departure_time: string
          event_id: string
          id?: string
          notes?: string | null
          train_number: string
        }
        Update: {
          arrival_station?: string
          arrival_time?: string
          capacity?: number
          company?: string
          created_at?: string | null
          departure_station?: string
          departure_time?: string
          event_id?: string
          id?: string
          notes?: string | null
          train_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "trains_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
    }
    Enums: {
      car_type: "private" | "ncc" | "taxi"
      event_expenses_category:
        | "transportation"
        | "accomodation"
        | "food"
        | "services"
        | "materials"
        | "other"
      event_role: "vip" | "attendee" | "speaker" | "staff" | "other"
      invite_status: "waiting_invite" | "invited" | "confirmed" | "declined"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      car_type: ["private", "ncc", "taxi"],
      event_expenses_category: [
        "transportation",
        "accomodation",
        "food",
        "services",
        "materials",
        "other",
      ],
      event_role: ["vip", "attendee", "speaker", "staff", "other"],
      invite_status: ["waiting_invite", "invited", "confirmed", "declined"],
    },
  },
} as const
