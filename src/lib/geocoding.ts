import { supabase } from "@/integrations/supabase/client";

export interface AddressSuggestion {
  place_id: number;
  osm_id: number;
  licence: string;
  osm_type: string;
  lat: string;
  lon: string;
  class: string;
  type: string;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    suburb?: string;
    neighbourhood?: string;
    [key: string]: string | undefined;
  };
  boundingbox: string[];
}

/**
 * Fetch address suggestions from OpenStreetMap
 */
export async function fetchAddressSuggestions(query: string, limit = 5): Promise<AddressSuggestion[]> {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&addressdetails=1&limit=${limit}`,
      {
        headers: {
          "Accept-Language": "en",
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      // Filter out suggestions without valid coordinates
      return data.filter(
        (item: AddressSuggestion) => 
          item.lat && 
          item.lon && 
          !isNaN(parseFloat(item.lat)) && 
          !isNaN(parseFloat(item.lon))
      );
    }
    return [];
  } catch (error) {
    console.error("Error fetching address suggestions:", error);
    return [];
  }
}

/**
 * Format a full address from address components
 */
export function formatFullAddress(address: AddressSuggestion['address']): string {
  // Start with the most specific parts
  const parts = [];
  
  // Add street details
  if (address.house_number && address.road) {
    parts.push(`${address.road}, ${address.house_number}`);
  } else if (address.road) {
    parts.push(address.road);
  }
  
  // Add neighborhood if available
  if (address.neighbourhood) {
    parts.push(address.neighbourhood);
  }
  
  // Add suburb if available
  if (address.suburb) {
    parts.push(address.suburb);
  }
  
  // Add city/town/village (use the first available)
  const locality = address.city || address.town || address.village;
  if (locality) {
    parts.push(locality);
  }
  
  // Add county and state if available
  if (address.county) {
    parts.push(address.county);
  }
  if (address.state) {
    parts.push(address.state);
  }
  
  // Add postcode if available
  if (address.postcode) {
    parts.push(address.postcode);
  }
  
  // Always include country
  if (address.country) {
    parts.push(address.country);
  }
  
  return parts.join(", ");
}

/**
 * Get a unique cache key for an address using its OpenStreetMap ID
 */
export function getCacheKey(suggestion: AddressSuggestion): string {
  return `osm:${suggestion.osm_type}:${suggestion.osm_id}`;
}

/**
 * Cache the coordinates of an address in the geocoding_cache table
 */
export async function cacheAddressCoordinates(suggestion: AddressSuggestion): Promise<boolean> {
  try {
    const latitude = parseFloat(suggestion.lat);
    const longitude = parseFloat(suggestion.lon);
    const cacheKey = getCacheKey(suggestion);
    
    // Important: Use the exact display_name without any modifications
    const exactDisplayName = suggestion.display_name;
    
    console.log(`Caching address: "${exactDisplayName}"`);

    // First, try to save with the OSM ID as the key
    try {
      const { data: existingData } = await supabase
        .from("geocoding_cache")
        .select("id")
        .eq("address", cacheKey)
        .maybeSingle();
        
      if (existingData) {
        // Update the existing entry
        await supabase
          .from("geocoding_cache")
          .update({
            latitude,
            longitude,
            updated_at: new Date().toISOString()
          })
          .eq("address", cacheKey);
      } else {
        // Insert a new entry
        await supabase
          .from("geocoding_cache")
          .insert({
            address: cacheKey,
            latitude,
            longitude
          });
      }
    } catch (error) {
      console.error("Error caching by OSM ID:", error);
    }
    
    // Second, cache using the exact display name as the key
    try {
      // Check if this exact address string already exists in the cache
      const { data: existingNameData } = await supabase
        .from("geocoding_cache")
        .select("id")
        .eq("address", exactDisplayName)
        .maybeSingle();
        
      if (existingNameData) {
        // Update the existing entry
        await supabase
          .from("geocoding_cache")
          .update({
            latitude,
            longitude,
            updated_at: new Date().toISOString()
          })
          .eq("address", exactDisplayName);
        
        console.log(`Updated existing cache entry for: "${exactDisplayName}"`);
      } else {
        // Insert a new entry with the exact display name
        const { error } = await supabase
          .from("geocoding_cache")
          .insert({
            address: exactDisplayName,
            latitude,
            longitude
          });
        
        if (error) {
          console.error(`Error inserting cache for "${exactDisplayName}":`, error);
        } else {
          console.log(`Created new cache entry for: "${exactDisplayName}"`);
        }
      }
    } catch (error) {
      console.error(`Error caching by display name "${exactDisplayName}":`, error);
      // If this fails, we still may have the OSM ID entry, so don't return false yet
    }
    
    return true;
  } catch (error) {
    console.error("Error caching address coordinates:", error);
    return false;
  }
}

/**
 * Get coordinates from the cache or geocode if not found
 */
export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  if (!address || address.trim() === '') {
    console.warn("Empty address provided for geocoding");
    return null;
  }
  
  // Use the exact address as provided, without normalization
  const exactAddress = address;
  console.log(`Looking up address: "${exactAddress}"`);
  
  try {
    // First check if this is an OSM ID key
    if (exactAddress.startsWith('osm:')) {
      const { data: cacheData, error: cacheError } = await supabase
        .from("geocoding_cache")
        .select("latitude, longitude")
        .eq("address", exactAddress)
        .maybeSingle();
      
      if (cacheData && !cacheError && cacheData.latitude && cacheData.longitude) {
        console.log(`Using cached coordinates for OSM ID: ${exactAddress}`);
        return [cacheData.latitude, cacheData.longitude];
      }
    }
    
    // Try to find the exact address in the cache, without any normalization
    const { data: directCacheData, error: directCacheError } = await supabase
      .from("geocoding_cache")
      .select("latitude, longitude")
      .eq("address", exactAddress)
      .maybeSingle();
    
    if (directCacheData && !directCacheError && directCacheData.latitude && directCacheData.longitude) {
      console.log(`Using cached coordinates for exact match: "${exactAddress}"`);
      return [directCacheData.latitude, directCacheData.longitude];
    }
    
    // Normalized address for the API query (only for the API call, not for caching)
    const normalizedAddress = exactAddress.trim();
    
    // If not found in cache, call the geocoding API
    console.log(`Geocoding address: "${normalizedAddress}"`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalizedAddress)}&limit=1`,
      {
        headers: {
          "Accept-Language": "en",
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0] as AddressSuggestion;
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        
        // Cache with both the OSM ID and the original address
        const osmKey = result.osm_type && result.osm_id 
          ? getCacheKey(result) 
          : null;
          
        // Cache using the exact original query text
        try {
          await supabase
            .from("geocoding_cache")
            .insert({
              address: exactAddress, // Use the exact address as provided
              latitude,
              longitude
            })
            .select();
            
          console.log(`Cached coordinates for original address: "${exactAddress}"`);
        } catch (insertError) {
          // Update if already exists
          await supabase
            .from("geocoding_cache")
            .update({
              latitude,
              longitude,
              updated_at: new Date().toISOString()
            })
            .eq("address", exactAddress);
            
          console.log(`Updated cache for address: "${exactAddress}"`);
        }
        
        // Also cache with OSM ID if available
        if (osmKey) {
          try {
            await supabase
              .from("geocoding_cache")
              .insert({
                address: osmKey,
                latitude,
                longitude
              })
              .select();
              
            console.log(`Cached coordinates with OSM key: ${osmKey}`);
          } catch (osmError) {
            // Update if already exists
            await supabase
              .from("geocoding_cache")
              .update({
                latitude,
                longitude,
                updated_at: new Date().toISOString()
              })
              .eq("address", osmKey);
          }
        }
        
        // Also cache the exact result display name if different from our query
        if (result.display_name && result.display_name !== exactAddress) {
          try {
            await supabase
              .from("geocoding_cache")
              .insert({
                address: result.display_name,
                latitude,
                longitude
              })
              .select();
          } catch (displayError) {
            // Ignore errors for this extra caching
          }
        }
        
        return [latitude, longitude];
      } else {
        console.warn(`No geocoding results for address: "${normalizedAddress}"`);
      }
    } else {
      console.error(`Geocoding API error for: "${normalizedAddress}"`, response.status);
    }
    return null;
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
} 