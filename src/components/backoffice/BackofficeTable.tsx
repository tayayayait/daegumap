import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Listing, UserRole } from "@/types/listing";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getVisibleFieldValue } from "@/lib/visibility";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";

type ColumnId =
  | "status"
  | "title"
  | "dong"
  | "category"
  | "deposit"
  | "monthlyRent"
  | "premium"
  | "author"
  | "updatedAt"
  | "actions";

type ColumnConfig = {
  id: ColumnId;
  label: string;
  width: number;
  minWidth: number;
  sortable?: boolean;
};

const columns: ColumnConfig[] = [
  { id: "status", label: "상태", width: 110, minWidth: 90, sortable: true },
  { id: "title", label: "제목", width: 220, minWidth: 180, sortable: true },
  { id: "dong", label: "주소(동)", width: 160, minWidth: 130, sortable: true },
  { id: "category", label: "업종", width: 120, minWidth: 100, sortable: true },
  { id: "deposit", label: "보증금", width: 120, minWidth: 100, sortable: true },
  { id: "monthlyRent", label: "월세", width: 110, minWidth: 90, sortable: true },
  { id: "premium", label: "권리금", width: 120, minWidth: 100, sortable: true },
  { id: "author", label: "작성자", width: 140, minWidth: 110, sortable: true },
  { id: "updatedAt", label: "업데이트", width: 140, minWidth: 120, sortable: true },
  { id: "actions", label: "액션", width: 110, minWidth: 90 },
];

const rowHeight = 48;
const overscan = 6;

interface BackofficeTableProps {
  listings: Listing[];
  userRole?: UserRole;
  onEdit?: (listing: Listing) => void;
  onDelete?: (listing: Listing) => void;
}

const formatDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function StatusBadge({ status }: { status: Listing["status"] }) {
  const variants: Record<Listing["status"], { label: string; className: string }> = {
    active: { label: "게시중", className: "bg-success text-success-foreground" },
    negotiation: { label: "협의중", className: "bg-warning text-warning-foreground" },
    completed: { label: "계약완료", className: "bg-muted text-muted-foreground" },
    archived: { label: "비공개", className: "bg-muted text-muted-foreground" },
  };

  const { label, className } = variants[status];
  return <Badge className={cn("font-medium", className)}>{label}</Badge>;
}

export function BackofficeTable({
  listings,
  userRole = "staff",
  onEdit,
  onDelete,
}: BackofficeTableProps) {
  const [sortKey, setSortKey] = useState<ColumnId | null>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>("desc");
  const [columnWidths, setColumnWidths] = useState<Record<ColumnId, number>>(() =>
    columns.reduce((acc, col) => ({ ...acc, [col.id]: col.width }), {} as Record<ColumnId, number>)
  );
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef<{ id: ColumnId; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!resizingRef.current) return;
      const { id, startX, startWidth } = resizingRef.current;
      const delta = event.clientX - startX;
      const column = columns.find((col) => col.id === id);
      if (!column) return;
      const nextWidth = Math.max(column.minWidth, startWidth + delta);
      setColumnWidths((prev) => ({ ...prev, [id]: nextWidth }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleSort = useCallback(
    (columnId: ColumnId) => {
      const column = columns.find((col) => col.id === columnId);
      if (!column?.sortable) return;

      setSortKey((prevKey) => {
        if (prevKey !== columnId) {
          setSortDirection("asc");
          return columnId;
        }

        setSortDirection((prevDirection) => {
          if (prevDirection === "asc") return "desc";
          if (prevDirection === "desc") {
            setSortKey(null);
            return null;
          }
          return "asc";
        });

        return prevKey;
      });
    },
    []
  );

  const sortedListings = useMemo(() => {
    if (!sortKey || !sortDirection) return listings;
    const getValue = (listing: Listing, key: ColumnId) => {
      switch (key) {
        case "status":
          return listing.status;
        case "title":
          return listing.title;
        case "dong":
          return listing.dong;
        case "category":
          return listing.category;
        case "deposit":
          return listing.deposit;
        case "monthlyRent":
          return listing.monthlyRent;
        case "premium":
          return listing.premium;
        case "author":
          return "파트너";
        case "updatedAt":
          return listing.updatedAt?.getTime?.() ?? 0;
        default:
          return 0;
      }
    };

    const sorted = [...listings].sort((a, b) => {
      const aValue = getValue(a, sortKey);
      const bValue = getValue(b, sortKey);
      if (aValue === bValue) return 0;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return sortDirection === "asc" ? -1 : 1;
    });

    return sorted;
  }, [listings, sortKey, sortDirection]);

  const totalHeight = sortedListings.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(
    sortedListings.length,
    Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan
  );
  const visibleListings = sortedListings.slice(startIndex, endIndex);
  const topSpacer = startIndex * rowHeight;
  const bottomSpacer = Math.max(0, totalHeight - endIndex * rowHeight);

  const gridTemplate = columns.map((col) => `${columnWidths[col.id]}px`).join(" ");

  const handleResizeStart = (columnId: ColumnId, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    resizingRef.current = {
      id: columnId,
      startX: event.clientX,
      startWidth: columnWidths[columnId],
    };
  };

  const renderCell = (listing: Listing, columnId: ColumnId) => {
    switch (columnId) {
      case "status":
        return <StatusBadge status={listing.status} />;
      case "title":
        return `${listing.dong} · ${listing.category}`;
      case "dong":
        return listing.dong;
      case "category":
        return listing.category;
      case "deposit":
        return (
          getVisibleFieldValue("deposit", listing.deposit, userRole, listing.status) ?? "-"
        );
      case "monthlyRent":
        return (
          getVisibleFieldValue("monthlyRent", listing.monthlyRent, userRole, listing.status) ??
          "-"
        );
      case "premium":
        return (
          getVisibleFieldValue("premium", listing.premium, userRole, listing.status) ?? "-"
        );
      case "author":
        return "파트너";
      case "updatedAt":
        return formatDate(listing.updatedAt);
      case "actions":
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit?.(listing)}
              aria-label="편집"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete?.(listing)}
              aria-label="삭제"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      default:
        return "-";
    }
  };

  return (
    <div className="flex h-full flex-col border border-border rounded-2xl overflow-hidden bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3 text-sm">
        <span className="text-muted-foreground">총 {listings.length}건</span>
        <span className="text-muted-foreground">행 높이 48px · 가상 스크롤 활성</span>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 overflow-y-auto custom-scrollbar"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        <div
          className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur"
          style={{ display: "grid", gridTemplateColumns: gridTemplate }}
        >
          {columns.map((column) => {
            const isSorted = sortKey === column.id;
            const ariaSort = isSorted
              ? sortDirection === "asc"
                ? "ascending"
                : "descending"
              : "none";
            return (
              <div
                key={column.id}
                className={cn(
                  "relative flex h-12 items-center gap-2 border-r border-border px-3 text-xs font-semibold text-muted-foreground",
                  column.sortable && "cursor-pointer select-none"
                )}
                role="columnheader"
                aria-sort={ariaSort}
                onClick={() => handleSort(column.id)}
              >
                <span>{column.label}</span>
                {column.sortable && <ArrowUpDown className="h-3.5 w-3.5" />}
                <div
                  className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                  onMouseDown={(event) => handleResizeStart(column.id, event)}
                />
              </div>
            );
          })}
        </div>

        <div style={{ height: topSpacer }} />
        {visibleListings.map((listing) => (
          <div
            key={listing.id}
            role="row"
            className="border-b border-border text-sm"
            style={{ display: "grid", gridTemplateColumns: gridTemplate, height: rowHeight }}
          >
            {columns.map((column) => (
              <div
                key={`${listing.id}-${column.id}`}
                className="flex items-center px-3 text-foreground"
              >
                {renderCell(listing, column.id)}
              </div>
            ))}
          </div>
        ))}
        <div style={{ height: bottomSpacer }} />
      </div>
    </div>
  );
}
