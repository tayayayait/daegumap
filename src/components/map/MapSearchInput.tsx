import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { searchLocations } from "@/data/searchLocations";

const MAX_SUGGESTIONS = 6;
const DAEGU_CENTER = { lat: 35.8714, lng: 128.6014 };
const DEFAULT_ZOOM = 14;

type Bounds = { north: number; south: number; east: number; west: number };

export type MapSearchSelection = {
  label: string;
  center: { lat: number; lng: number };
  zoom?: number;
  bounds?: Bounds;
  source: "preset" | "places";
};

type MapSearchSuggestion = {
  id: string;
  label: string;
  source: "preset" | "places";
  center?: { lat: number; lng: number };
  bounds?: Bounds;
  zoom?: number;
  placeId?: string;
};

export interface MapSearchInputProps {
  onSelect?: (selection: MapSearchSelection) => void;
  className?: string;
  placeholder?: string;
}

export function MapSearchInput({ onSelect, className, placeholder }: MapSearchInputProps) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [placesSuggestions, setPlacesSuggestions] = useState<MapSearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const sessionTokenRef = useRef<any>(null);
  const requestIdRef = useRef(0);

  const presetSuggestions = useMemo(() => {
    const trimmed = query.trim();
    const base = searchLocations.map((location) => ({
      id: location.label,
      label: location.label,
      source: "preset" as const,
      center: location.center,
      bounds: location.bounds,
      zoom: location.zoom ?? DEFAULT_ZOOM,
    }));

    if (!trimmed) return base;
    return base.filter((item) => item.label.includes(trimmed));
  }, [query]);

  const suggestions = useMemo(() => {
    const source = placesSuggestions.length > 0 ? placesSuggestions : presetSuggestions;
    return source.slice(0, MAX_SUGGESTIONS);
  }, [placesSuggestions, presetSuggestions]);

  const showDropdown = isDropdownOpen && (suggestions.length > 0 || isLoading || !!query.trim());
  const activeId = activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined;

  useEffect(() => {
    if (!showDropdown) {
      setActiveIndex(-1);
      return;
    }
    if (activeIndex >= suggestions.length) {
      setActiveIndex(suggestions.length - 1);
    }
  }, [showDropdown, activeIndex, suggestions.length]);

  useEffect(() => {
    if (typeof window === "undefined" || autocompleteServiceRef.current) return;

    const initialize = () => {
      const googleMaps = (window as any).google;
      if (!googleMaps?.maps?.places) return false;
      autocompleteServiceRef.current = new googleMaps.maps.places.AutocompleteService();
      placesServiceRef.current = new googleMaps.maps.places.PlacesService(document.createElement("div"));
      return true;
    };

    if (initialize()) return;

    const interval = window.setInterval(() => {
      if (initialize()) {
        window.clearInterval(interval);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setPlacesSuggestions([]);
      setIsLoading(false);
      return;
    }

    if (!autocompleteServiceRef.current) {
      setPlacesSuggestions([]);
      setIsLoading(false);
      return;
    }

    const googleMaps = (window as any).google;
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    const timeout = window.setTimeout(() => {
      if (!sessionTokenRef.current && googleMaps?.maps?.places?.AutocompleteSessionToken) {
        sessionTokenRef.current = new googleMaps.maps.places.AutocompleteSessionToken();
      }

      const request: any = {
        input: trimmed,
        componentRestrictions: { country: "kr" },
        sessionToken: sessionTokenRef.current ?? undefined,
      };

      if (googleMaps?.maps?.LatLng) {
        request.location = new googleMaps.maps.LatLng(DAEGU_CENTER.lat, DAEGU_CENTER.lng);
        request.radius = 30000;
      }

      autocompleteServiceRef.current.getPlacePredictions(
        request,
        (predictions: any[] | null, status: any) => {
          if (requestId !== requestIdRef.current) return;
          const okStatus = googleMaps?.maps?.places?.PlacesServiceStatus?.OK;
          if (status !== okStatus || !predictions?.length) {
            setPlacesSuggestions([]);
            setIsLoading(false);
            return;
          }

          const nextSuggestions = predictions.map((prediction) => ({
            id: prediction.place_id,
            label: prediction.description,
            source: "places" as const,
            placeId: prediction.place_id,
          }));
          setPlacesSuggestions(nextSuggestions);
          setIsLoading(false);
        }
      );
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const handleSelect = (selection: MapSearchSuggestion) => {
    setQuery(selection.label);
    setIsDropdownOpen(false);
    setActiveIndex(-1);

    if (!onSelect) return;

    if (selection.source === "preset" && selection.center) {
      onSelect({
        label: selection.label,
        center: selection.center,
        zoom: selection.zoom ?? DEFAULT_ZOOM,
        bounds: selection.bounds,
        source: "preset",
      });
      sessionTokenRef.current = null;
      return;
    }

    if (selection.source === "places" && selection.placeId && placesServiceRef.current) {
      const googleMaps = (window as any).google;
      placesServiceRef.current.getDetails(
        {
          placeId: selection.placeId,
          fields: ["geometry", "name", "formatted_address"],
          sessionToken: sessionTokenRef.current ?? undefined,
        },
        (place: any, status: any) => {
          const okStatus = googleMaps?.maps?.places?.PlacesServiceStatus?.OK;
          const location = place?.geometry?.location;
          if (status !== okStatus || !location) return;

          const viewport = place?.geometry?.viewport;
          const bounds = viewport
            ? {
                north: viewport.getNorthEast().lat(),
                south: viewport.getSouthWest().lat(),
                east: viewport.getNorthEast().lng(),
                west: viewport.getSouthWest().lng(),
              }
            : undefined;

          onSelect({
            label: selection.label,
            center: { lat: location.lat(), lng: location.lng() },
            zoom: selection.zoom ?? DEFAULT_ZOOM,
            bounds,
            source: "places",
          });

          sessionTokenRef.current = null;
        }
      );
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setIsDropdownOpen(true);
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) => {
          const next = prev + 1;
          if (next >= suggestions.length) return 0;
          return next;
        });
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((prev) => {
          if (prev <= 0) return suggestions.length - 1;
          return prev - 1;
        });
        break;
      case "Enter": {
        if (suggestions.length === 0) return;
        event.preventDefault();
        const selected = activeIndex >= 0 ? suggestions[activeIndex] : suggestions[0];
        if (selected) handleSelect(selected);
        break;
      }
      case "Escape":
        setIsDropdownOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "relative flex items-center bg-secondary rounded-lg transition-all duration-200",
          isFocused && "ring-2 ring-ring"
        )}
      >
        <Search className="absolute left-3 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder ?? "지역, 상권을 검색하세요"}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setIsDropdownOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => {
              setIsFocused(false);
              setIsDropdownOpen(false);
            }, 150);
          }}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 h-10 border-0 bg-transparent focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setActiveIndex(-1);
              setPlacesSuggestions([]);
            }}
            className="absolute right-3 text-muted-foreground hover:text-foreground"
            aria-label="검색어 지우기"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-9 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && (
        <div
          id={listId}
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-card rounded-lg shadow-lg border border-border overflow-hidden z-dropdown"
        >
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              검색 중입니다.
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">검색 결과가 없습니다.</div>
          ) : (
            suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  "w-full px-4 py-3 text-left text-sm text-foreground hover:bg-secondary focus:bg-secondary focus:outline-none transition-colors",
                  index === activeIndex && "bg-secondary"
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(suggestion)}
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  {suggestion.label}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
