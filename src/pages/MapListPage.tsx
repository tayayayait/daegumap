import { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import { TopBar } from "@/components/layout/TopBar";
import type { MapSearchSelection } from "@/components/map/MapSearchInput";
import { MapView } from "@/components/map/MapView";
import { FilterPanel } from "@/components/listing/FilterPanel";
import { ListingList } from "@/components/listing/ListingList";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { allListings } from "@/data/mockListings";
import { Listing, ListingFilter, UserRole } from "@/types/listing";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

type MapBounds = { north: number; south: number; east: number; west: number };

const DetailView = lazy(() =>
  import("@/components/listing/DetailView").then((module) => ({ default: module.DetailView }))
);

const buildListingQuery = (filters: ListingFilter, bounds: MapBounds | null) => {
  const params = new URLSearchParams();
  if (bounds) {
    params.set("north", bounds.north.toString());
    params.set("south", bounds.south.toString());
    params.set("east", bounds.east.toString());
    params.set("west", bounds.west.toString());
  }

  if (filters.premiumMin !== undefined) params.set("premiumMin", String(filters.premiumMin));
  if (filters.premiumMax !== undefined) params.set("premiumMax", String(filters.premiumMax));
  if (filters.depositMin !== undefined) params.set("depositMin", String(filters.depositMin));
  if (filters.depositMax !== undefined) params.set("depositMax", String(filters.depositMax));
  if (filters.monthlyRentMin !== undefined) {
    params.set("monthlyRentMin", String(filters.monthlyRentMin));
  }
  if (filters.monthlyRentMax !== undefined) {
    params.set("monthlyRentMax", String(filters.monthlyRentMax));
  }
  if (filters.areaMin !== undefined) params.set("areaMin", String(filters.areaMin));
  if (filters.areaMax !== undefined) params.set("areaMax", String(filters.areaMax));
  if (filters.categories && filters.categories.length > 0) {
    params.set("categories", filters.categories.join(","));
  }
  if (filters.sort) params.set("sort", filters.sort);

  return params;
};

const filterListings = (
  listings: Listing[],
  filters: ListingFilter,
  bounds: MapBounds | null
) => {
  let result = [...listings];

  if (bounds) {
    result = result.filter(
      (listing) =>
        listing.lat <= bounds.north &&
        listing.lat >= bounds.south &&
        listing.lng <= bounds.east &&
        listing.lng >= bounds.west
    );
  }

  if (filters.premiumMin !== undefined) {
    result = result.filter((listing) => listing.premium >= filters.premiumMin!);
  }
  if (filters.premiumMax !== undefined) {
    result = result.filter((listing) => listing.premium <= filters.premiumMax!);
  }

  if (filters.depositMin !== undefined) {
    result = result.filter((listing) => listing.deposit >= filters.depositMin!);
  }
  if (filters.depositMax !== undefined) {
    result = result.filter((listing) => listing.deposit <= filters.depositMax!);
  }

  if (filters.monthlyRentMin !== undefined) {
    result = result.filter((listing) => listing.monthlyRent >= filters.monthlyRentMin!);
  }
  if (filters.monthlyRentMax !== undefined) {
    result = result.filter((listing) => listing.monthlyRent <= filters.monthlyRentMax!);
  }

  if (filters.areaMin !== undefined) {
    result = result.filter((listing) => listing.areaM2 >= filters.areaMin!);
  }
  if (filters.areaMax !== undefined) {
    result = result.filter((listing) => listing.areaM2 <= filters.areaMax!);
  }

  if (filters.categories && filters.categories.length > 0) {
    result = result.filter((listing) => filters.categories!.includes(listing.category));
  }

  result = result.filter(
    (listing) => listing.status === "active" || listing.status === "negotiation"
  );

  switch (filters.sort) {
    case "rent_low":
      result.sort((a, b) => a.monthlyRent - b.monthlyRent);
      break;
    case "premium_low":
      result.sort((a, b) => a.premium - b.premium);
      break;
    case "latest":
    default:
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
  }

  return result;
};

export default function MapListPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const userRole: UserRole = "guest";
  const [filters, setFilters] = useState<ListingFilter>({ sort: "latest" });
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [clusterListingIds, setClusterListingIds] = useState<string[]>([]);
  const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pendingBounds, setPendingBounds] = useState<MapBounds | null>(null);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [searchZoom, setSearchZoom] = useState<number | undefined>(undefined);

  const filterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeListing = useMemo(
    () => listings.find((item) => item.id === activeListingId) ?? null,
    [listings, activeListingId]
  );

  useEffect(() => {
    return () => {
      if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    };
  }, []);

  const highlightedIds = hoveredListingId
    ? [hoveredListingId]
    : activeListingId
      ? [activeListingId]
      : clusterListingIds.length > 0
        ? clusterListingIds
        : undefined;

  useEffect(() => {
    if (!pendingBounds) return;
    const timer = window.setTimeout(() => {
      setBounds(pendingBounds);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [pendingBounds]);

  useEffect(() => {
    let isActive = true;
    const query = buildListingQuery(filters, bounds).toString();

    setIsLoading(true);

    // Replace with API call: fetch(`/api/listings?${query}`)
    const nextListings = filterListings(allListings, filters, bounds);

    Promise.resolve(nextListings).then((data) => {
      if (!isActive) return;
      setListings(data);
      setIsLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [filters, bounds]);

  useEffect(() => {
    if (activeListingId && !listings.some((listing) => listing.id === activeListingId)) {
      setActiveListingId(null);
    }
    if (hoveredListingId && !listings.some((listing) => listing.id === hoveredListingId)) {
      setHoveredListingId(null);
    }
    if (clusterListingIds.length > 0) {
      const hasClusterListing = clusterListingIds.some((id) =>
        listings.some((listing) => listing.id === id)
      );
      if (!hasClusterListing) {
        setClusterListingIds([]);
      }
    }
  }, [activeListingId, clusterListingIds, listings]);

  const handleFilterChange = useCallback((newFilters: ListingFilter) => {
    if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    filterDebounceRef.current = setTimeout(() => {
      setFilters(newFilters);
    }, 150);
  }, []);

  const handleHover = useCallback(
    (id: string | null) => {
      if (isMobile) return;
      setHoveredListingId(id);
    },
    [isMobile]
  );

  const handleListingSelect = useCallback(
    (listing: Listing) => {
      if (isMobile) {
        navigate(`/listing/${listing.id}`);
        return;
      }
      setActiveListingId(listing.id);
      setHoveredListingId(null);
      setClusterListingIds([]);
    },
    [isMobile, navigate]
  );

  const handlePinClick = useCallback(
    (listing: Listing) => {
      if (isMobile) {
        navigate(`/listing/${listing.id}`);
        return;
      }
      setActiveListingId(listing.id);
      setHoveredListingId(null);
      setClusterListingIds([]);
      setScrollTargetId(listing.id);
    },
    [isMobile, navigate]
  );

  const handleClusterClick = useCallback(
    (listingIds: string[]) => {
      if (!listingIds || listingIds.length === 0) return;
      setClusterListingIds(listingIds);
      setActiveListingId(null);
      setHoveredListingId(null);
      const firstVisible = listingIds.find((id) => listings.some((listing) => listing.id === id));
      setScrollTargetId(firstVisible ?? listingIds[0]);
    },
    [listings]
  );

  const handleBoundsChange = useCallback((nextBounds: MapBounds) => {
    setPendingBounds(nextBounds);
  }, []);

  const handleSearchSelect = useCallback((selection: MapSearchSelection) => {
    setSearchCenter(selection.center);
    setSearchZoom(selection.zoom ?? 14);
    if (selection.bounds) {
      setPendingBounds(selection.bounds);
      setBounds(selection.bounds);
    }
    setActiveListingId(null);
    setClusterListingIds([]);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        onFilterClick={() => setIsFilterOpen(true)}
        onSearchSelect={handleSearchSelect}
        userRole={userRole}
      />

      <main className="pt-header h-screen flex flex-col">
        {isMobile ? (
          <div className="flex-1 relative min-h-0">
            <div className="absolute inset-0">
              <MapView
                listings={listings}
                highlightedIds={highlightedIds}
                center={searchCenter}
                zoom={searchCenter ? searchZoom : undefined}
                onPinClick={handlePinClick}
                onPinHover={handleHover}
                onBoundsChange={handleBoundsChange}
                onClusterClick={handleClusterClick}
              />
            </div>

            <BottomSheet defaultSnap={0.4} maxSnap={0.9} minSnap={0.15}>
              <ListingList
                listings={listings}
                userRole={userRole}
                highlightedIds={highlightedIds}
                scrollToId={scrollTargetId}
                onCardHover={handleHover}
                onCardClick={handleListingSelect}
                isLoading={isLoading}
              />
            </BottomSheet>

            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetContent side="left" className="p-0 w-full sm:max-w-md">
                <SheetHeader className="sr-only">
                  <SheetTitle>필터</SheetTitle>
                  <SheetDescription>매물 조건을 선택해 검색 결과를 좁힐 수 있습니다.</SheetDescription>
                </SheetHeader>
                <FilterPanel
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClose={() => setIsFilterOpen(false)}
                  isMobile={true}
                  resultCount={listings.length}
                />
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex">
            <div className="w-7/12 h-full">
              <MapView
                listings={listings}
                highlightedIds={highlightedIds}
                center={searchCenter}
                zoom={searchCenter ? searchZoom : undefined}
                onPinClick={handlePinClick}
                onPinHover={handleHover}
                onBoundsChange={handleBoundsChange}
                onClusterClick={handleClusterClick}
              />
            </div>

            <div className="w-5/12 h-full flex border-l border-border min-h-0">
              <div className="shrink-0">
                <FilterPanel
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  resultCount={listings.length}
                />
              </div>

              <div className="flex-1 bg-card min-h-0">
                <ListingList
                  listings={listings}
                  userRole={userRole}
                  highlightedIds={highlightedIds}
                  scrollToId={scrollTargetId}
                  onCardHover={handleHover}
                  onCardClick={handleListingSelect}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {!isMobile && (
        <Sheet
          open={!!activeListing}
          onOpenChange={(open) => {
            if (!open) setActiveListingId(null);
          }}
        >
          <SheetContent
            side="right"
            className="w-full min-w-[640px] max-w-[880px] p-0 border-l border-border"
          >
            {activeListing && (
              <SheetHeader className="sr-only">
                <SheetTitle>{activeListing.title}</SheetTitle>
                <SheetDescription>
                  {activeListing.dong} 상세 매물 정보를 확인하세요.
                </SheetDescription>
              </SheetHeader>
            )}
            {activeListing && (
              <div className="h-screen flex flex-col bg-card">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">{activeListing.dong}</p>
                    <h2 className="text-lg font-semibold text-foreground truncate">
                      {activeListing.title}
                    </h2>
                  </div>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" aria-label="닫기">
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </div>
                <div className="flex-1 overflow-y-auto px-6 pb-10 pt-6">
                  <Suspense
                    fallback={
                      <div className="py-12 text-center text-sm text-muted-foreground">
                        상세 정보를 불러오는 중입니다.
                      </div>
                    }
                  >
                    <DetailView listing={activeListing} userRole={userRole} />
                  </Suspense>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
