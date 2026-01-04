import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { Listing, UserRole } from "@/types/listing";
import { ListingCard } from "./ListingCard";
import { Skeleton } from "@/components/ui/skeleton";

interface ListingListProps {
  listings: Listing[];
  userRole?: UserRole;
  highlightedIds?: string[];
  listRef?: RefObject<HTMLDivElement>;
  scrollToId?: string | null;
  onCardHover?: (id: string | null) => void;
  onCardClick?: (listing: Listing) => void;
  isLoading?: boolean;
}

const DEFAULT_ROW_HEIGHT = 360;
const OVERSCAN = 4;

function ListingCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

export function ListingList({
  listings,
  userRole = "guest",
  highlightedIds,
  listRef,
  scrollToId,
  onCardHover,
  onCardClick,
  isLoading = false,
}: ListingListProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = listRef ?? internalRef;
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportHeight(entry.contentRect.height);
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef]);

  const itemsPerRow = containerWidth >= 640 ? 2 : 1;
  const rowHeight = DEFAULT_ROW_HEIGHT;
  const rowCount = Math.ceil(listings.length / itemsPerRow);
  const totalHeight = rowCount * rowHeight;

  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
  const endRow = Math.min(rowCount, Math.ceil((scrollTop + viewportHeight) / rowHeight) + OVERSCAN);

  const rows = useMemo(() => {
    const rowItems = [] as Array<{
      rowIndex: number;
      items: Listing[];
    }>;

    for (let rowIndex = startRow; rowIndex < endRow; rowIndex += 1) {
      const startIndex = rowIndex * itemsPerRow;
      const items = listings.slice(startIndex, startIndex + itemsPerRow);
      rowItems.push({ rowIndex, items });
    }

    return rowItems;
  }, [startRow, endRow, itemsPerRow, listings]);

  useEffect(() => {
    if (!scrollToId || !containerRef.current) return;
    const index = listings.findIndex((listing) => listing.id === scrollToId);
    if (index < 0) return;
    const targetRow = Math.floor(index / itemsPerRow);
    containerRef.current.scrollTo({ top: targetRow * rowHeight, behavior: "smooth" });
  }, [scrollToId, listings, itemsPerRow, rowHeight, containerRef]);

  if (isLoading) {
    return (
      <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div
        ref={containerRef}
        className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8"
      >
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">😔</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">매물이 없습니다</h3>
        <p className="text-sm text-muted-foreground">
          현재 보이는 지역에 등록된 매물이 없습니다.<br />
          지도를 이동하거나 필터를 조정해 보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <span className="text-sm text-muted-foreground">
          총 <span className="font-semibold text-foreground">{listings.length}</span>건의 매물
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          {rows.map((row) => (
            <div
              key={`row-${row.rowIndex}`}
              style={{
                position: "absolute",
                top: row.rowIndex * rowHeight,
                left: 0,
                right: 0,
                height: rowHeight,
                display: "grid",
                gridTemplateColumns: `repeat(${itemsPerRow}, minmax(0, 1fr))`,
                gap: "16px",
                padding: "16px",
              }}
            >
              {row.items.map((listing) => (
                <div key={listing.id} data-listing-id={listing.id} className="h-full">
                  <ListingCard
                    listing={listing}
                    userRole={userRole}
                    isHighlighted={highlightedIds?.includes(listing.id)}
                    onHover={onCardHover}
                    onClick={onCardClick}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
