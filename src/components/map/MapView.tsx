import { useCallback, useRef, useEffect } from "react";
import { GoogleMap, MarkerClustererF, MarkerF, useLoadScript } from "@react-google-maps/api";
import { Listing } from "@/types/listing";

interface MapViewProps {
  listings: Listing[];
  highlightedIds?: string[];
  center?: { lat: number; lng: number } | null;
  zoom?: number;
  onPinClick?: (listing: Listing) => void;
  onPinHover?: (id: string | null) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  onClusterClick?: (listingIds: string[]) => void;
}

const DAEGU_CENTER = { lat: 35.8714, lng: 128.6014 };
const DEFAULT_ZOOM = 14;
const GOOGLE_LIBRARIES: ("places")[] = ["places"];

const statusColors: Record<Listing["status"], string> = {
  active: "#1F3A6B",
  negotiation: "#D97706",
  completed: "#D1D5DB",
  archived: "#D1D5DB",
};

const buildPinSvg = (color: string, width: number, height: number) => `
  <svg width="${width}" height="${height}" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 20 14 20s14-9.5 14-20c0-7.732-6.268-14-14-14z" fill="${color}" />
    <circle cx="14" cy="14" r="6" fill="white" />
  </svg>
`;

const createMarkerIcon = (color: string, highlighted: boolean) => {
  const width = highlighted ? 36 : 28;
  const height = highlighted ? 44 : 34;
  const svg = buildPinSvg(color, width, height);
  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  const g = typeof window !== "undefined" ? (window as any).google : null;
  const anchor = g?.maps ? new g.maps.Point(width / 2, height) : undefined;
  const scaledSize = g?.maps ? new g.maps.Size(width, height) : undefined;

  return {
    url,
    anchor,
    scaledSize,
  };
};

export function MapView({
  listings,
  highlightedIds,
  center,
  zoom,
  onPinClick,
  onPinHover,
  onBoundsChange,
  onClusterClick,
}: MapViewProps) {
  const mapRef = useRef<any>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey ?? "",
    libraries: GOOGLE_LIBRARIES,
  });

  const handleIdle = useCallback(() => {
    if (!onBoundsChange || !mapRef.current) return;
    const bounds = mapRef.current.getBounds?.();
    if (!bounds) return;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    onBoundsChange({
      north: ne.lat(),
      south: sw.lat(),
      east: ne.lng(),
      west: sw.lng(),
    });
  }, [onBoundsChange]);

  const handleLoad = useCallback(
    (map: any) => {
      mapRef.current = map;
      handleIdle();
    },
    [handleIdle]
  );

  const handleUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    if (!center || !mapRef.current) return;
    mapRef.current.panTo(center);
    if (typeof zoom === "number") {
      mapRef.current.setZoom(zoom);
    }
  }, [center, zoom]);

  const handleClusterClick = useCallback(
    (cluster: any) => {
      const map = mapRef.current;
      if (map) {
        const currentZoom = map.getZoom?.() ?? DEFAULT_ZOOM;
        map.setZoom(Math.min(currentZoom + 1, 20));
        const centerPosition = cluster.getCenter?.() ?? cluster.position;
        if (centerPosition) {
          map.panTo(centerPosition);
        }
      }

      if (onClusterClick) {
        const markers = cluster.getMarkers?.() ?? cluster.markers ?? [];
        const markerIds = markers
          .map((marker: any) => marker.getTitle?.())
          .filter(Boolean) as string[];
        onClusterClick(markerIds);
      }
    },
    [onClusterClick]
  );

  if (!apiKey) {
    return (
      <div className="relative w-full h-full bg-muted flex items-center justify-center">
        <span className="text-sm text-muted-foreground">
          Set VITE_GOOGLE_MAPS_API_KEY to enable the map.
        </span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="relative w-full h-full bg-muted flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Map failed to load.</span>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative w-full h-full bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" role="application" aria-label="Daegu listings map">
      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={center ?? DAEGU_CENTER}
        zoom={zoom ?? DEFAULT_ZOOM}
        onLoad={handleLoad}
        onIdle={handleIdle}
        onUnmount={handleUnmount}
        options={{
          clickableIcons: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
      >
        <MarkerClustererF
          onClick={handleClusterClick}
          options={{
            minimumClusterSize: 10,
          }}
        >
          {(clusterer) =>
            listings.map((listing) => {
              const isHighlighted = highlightedIds?.includes(listing.id) ?? false;
              return (
                <MarkerF
                  key={listing.id}
                  position={{ lat: listing.lat, lng: listing.lng }}
                  icon={createMarkerIcon(statusColors[listing.status], isHighlighted)}
                  onClick={() => onPinClick?.(listing)}
                  onMouseOver={() => onPinHover?.(listing.id)}
                  onMouseOut={() => onPinHover?.(null)}
                  zIndex={isHighlighted ? 10 : 1}
                  title={listing.id}
                  clusterer={clusterer}
                />
              );
            })
          }
        </MarkerClustererF>
      </GoogleMap>
    </div>
  );
}
