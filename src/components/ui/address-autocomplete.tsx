import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  AddressSuggestion, 
  fetchAddressSuggestions, 
  formatFullAddress,
  cacheAddressCoordinates,
  getCacheKey
} from "@/lib/geocoding";
import { useOnClickOutside } from "@/hooks/use-on-click-outside";
import { cn } from "@/lib/utils";

export interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  onCoordinatesFound?: (lat: number, lon: number) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  onCoordinatesFound,
  label,
  placeholder = "Enter an address",
  disabled = false,
  required = false,
  className,
  error
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close suggestions when clicking outside
  useOnClickOutside(suggestionsRef, () => setShowSuggestions(false));

  // Debounced fetch suggestions
  const debouncedFetchSuggestions = (query: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (!query || query.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      const results = await fetchAddressSuggestions(query);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsSearching(false);
    }, 800);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSelectSuggestion = async (suggestion: AddressSuggestion) => {
    // Use display_name from OpenStreetMap for consistency
    const exactDisplayName = suggestion.display_name;
    onChange(exactDisplayName);
    
    // Store in cache with exact display name
    console.log(`Selected address: "${exactDisplayName}"`);
    
    // Make a copy of the suggestion to ensure we don't modify it
    const suggestionWithExactName = {
      ...suggestion,
      display_name: exactDisplayName // Ensure the exact display name is used
    };
    
    // Store in cache
    await cacheAddressCoordinates(suggestionWithExactName);
    
    // Notify parent components with the full suggestion data
    if (onSelect) {
      onSelect(suggestionWithExactName);
    }
    
    // Also provide coordinates if callback exists
    if (onCoordinatesFound) {
      onCoordinatesFound(parseFloat(suggestion.lat), parseFloat(suggestion.lon));
    }
    
    setShowSuggestions(false);
  };

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <Label 
          htmlFor="address-input"
          className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}
        >
          {label}
        </Label>
      )}
      
      <div className="relative">
        <Input
          id="address-input"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            debouncedFetchSuggestions(e.target.value);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(error && "border-red-500 focus-visible:ring-red-500")}
          onFocus={() => {
            if (value.length >= 3 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        
        {showSuggestions && (
          <div 
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-md max-h-[200px] overflow-auto"
          >
            {isSearching ? (
              <div className="p-2 text-sm text-muted-foreground">
                Searching...
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <div
                  key={`${suggestion.osm_type}-${suggestion.osm_id}`}
                  className="p-2 text-sm hover:bg-muted cursor-pointer"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion.display_name}
                </div>
              ))
            ) : (
              <div className="p-2 text-sm text-muted-foreground">
                No suggestions found
              </div>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
} 