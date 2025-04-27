import { useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client"; // Import supabase client
import { User as SupabaseUser, PostgrestError } from "@supabase/supabase-js"; // Import Supabase User type and PostgrestError
import { Tables } from "@/integrations/supabase/types"; // Import Tables type
// Import context and types from the definition file
import { AuthContext, AuthContextType } from "./AuthContextDefinition";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  // Use AuthContextType from import
  const [user, setUser] = useState<AuthContextType['user']>(null);
  // Start loading true, set to false only after initial session check is complete
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<AuthContextType['user'] | null> => {
    console.log("fetchUserProfile: Fetching profile for user:", supabaseUser.id);
    // Use Partial for the data since we only select specific columns
    let personData: Partial<Tables<"persons">> | null = null;
    let personError: PostgrestError | null = null; // Use PostgrestError type

    try {
      console.log("fetchUserProfile: Executing Supabase query to persons table (without .single())...");
      const { data, error } = await supabase
        .from("persons")
        .select("id, name, role")
        .eq("id", supabaseUser.id);
      
      personData = data?.[0] || null;
      personError = error;

      console.log("fetchUserProfile: Supabase query finished.", { personData: data, personError });

      if (personError) {
        console.error("fetchUserProfile: Error during profile fetch query:", personError);
        return { id: supabaseUser.id, email: supabaseUser.email };
      }

      if (personData) {
        const profile = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: personData.name,
          role: personData.role || undefined,
        };
        console.log("fetchUserProfile: Profile found:", profile);
        return profile;
      }
      
      console.log("fetchUserProfile: No person record found (after query without .single()).");
      return { id: supabaseUser.id, email: supabaseUser.email };

    } catch (queryError) {
      console.error("fetchUserProfile: CRITICAL ERROR during Supabase query execution itself:", queryError);
      // If the await itself fails, log it
      return { id: supabaseUser.id, email: supabaseUser.email };
    }
  };

  useEffect(() => {
    console.log("AuthProvider mounted. Attempting initial getUser().");
    let isMounted = true; // Prevent state updates if component unmounts quickly
    let listenerSubscribed = false;

    const initializeAuth = async () => {
      try {
        // Step 1: Get current user upfront
        const { data: { user: initialUser }, error: initialError } = await supabase.auth.getUser();
        console.log("initializeAuth: getUser() result:", { initialUser, initialError });

        if (initialError) {
          console.error("initializeAuth: Error getting initial user:", initialError);
          if (isMounted) setUser(null);
        } else if (initialUser) {
          console.log("initializeAuth: Initial user found, fetching profile...");
          const profile = await fetchUserProfile(initialUser);
          if (isMounted) {
            console.log("initializeAuth: Setting initial user state with profile:", profile);
            setUser(profile);
          }
        } else {
          console.log("initializeAuth: No initial user found.");
          if (isMounted) setUser(null);
        }
      } catch (error) {
        console.error("initializeAuth: Unexpected error:", error);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) {
          console.log("initializeAuth: Finished. Setting isLoading to false.");
          setIsLoading(false);

          // Step 2: Subscribe to future changes only AFTER initial check is done
          if (!listenerSubscribed) {
            console.log("initializeAuth: Subscribing to onAuthStateChange.");
            listenerSubscribed = true;
            subscribeToAuthStateChanges();
          }
        }
      }
    };

    const subscribeToAuthStateChanges = () => {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("onAuthStateChange triggered (post-initial):", { event, session });
          if (!isMounted) return; // Don't update if unmounted

          // Handle subsequent changes - No need to manage isLoading here anymore
          try {
            if (event === "SIGNED_IN" && session?.user) {
              console.log("onAuthStateChange (SIGNED_IN): Fetching profile...");
              const profile = await fetchUserProfile(session.user);
              if (isMounted) setUser(profile);
            } else if (event === "SIGNED_OUT") {
              console.log("onAuthStateChange (SIGNED_OUT): Setting user null.");
              if (isMounted) setUser(null);
            } else if (event === "TOKEN_REFRESHED" && session?.user) {
              // Optionally re-fetch profile on token refresh if role/name might change
              console.log("onAuthStateChange (TOKEN_REFRESHED): Re-fetching profile...");
              const profile = await fetchUserProfile(session.user);
              if (isMounted) setUser(profile);
            } else if (event === "USER_UPDATED" && session?.user) {
              console.log("onAuthStateChange (USER_UPDATED): Re-fetching profile...");
              const profile = await fetchUserProfile(session.user);
              if (isMounted) setUser(profile);
            }
          } catch (error) {
            console.error("onAuthStateChange: Error handling auth state change:", error);
            if (isMounted) setUser(null);
          }
        }
      );
      return authListener;
    };

    initializeAuth();

    // Cleanup
    return () => {
      isMounted = false;
      console.log("AuthProvider unmounting.");
      // Subscription cleanup handled within subscribeToAuthStateChanges structure implicitly (or add explicit unsubscribe if needed)
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    console.log("AuthContext: login function called.");
    setIsLoading(true); // Set loading true for login operation
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error.message);
        return { error };
      }
      // onAuthStateChange will handle setting the user state after successful login
      console.log("Login successful via signInWithPassword. User data (might be stale):", data?.user);
      return { error: null };
    } catch (error) {
      console.error("Unexpected login error:", error);
      return { error: error instanceof Error ? error : new Error("An unexpected error occurred during login.") };
    } finally {
      // We might set loading false here OR rely on onAuthStateChange's finally block
      // Relying on onAuthStateChange might be safer if profile fetch takes time
      setIsLoading(false);
      console.log("AuthContext: login function finished.");
    }
  };

  // Placeholder for registration
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Register function placeholder:", name, email, password);
      return { error: new Error("Registration not implemented yet.") };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    console.log("AuthContext: logout function called.");
    setIsLoading(true); // Set loading true for logout operation
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
      } else {
        // onAuthStateChange will handle setting user to null
        console.log("Logout successful via signOut.");
      }
    } finally {
      setIsLoading(false); // Set loading false after logout attempt
      console.log("AuthContext: logout function finished.");
    }
  };

  // Provide the context value using AuthContext from import
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 