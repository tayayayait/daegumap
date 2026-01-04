import { useEffect, useState } from "react";
import { Listing, UserRole } from "@/types/listing";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { getVisibleFieldValue } from "@/lib/visibility";

interface ListingCardProps {
  listing: Listing;
  userRole?: UserRole;
  isHighlighted?: boolean;
  onHover?: (id: string | null) => void;
  onClick?: (listing: Listing) => void;
}

const PLACEHOLDER = "-";

function StatusBadge({ status }: { status: Listing["status"] }) {
  const variants: Partial<Record<Listing["status"], { label: string; className: string }>> = {
    negotiation: { label: "협의중", className: "bg-warning text-warning-foreground" },
    completed: { label: "예약중", className: "bg-muted text-muted-foreground" },
  };

  const variant = variants[status];
  if (!variant) return null;

  return <Badge className={cn("font-medium", variant.className)}>{variant.label}</Badge>;
}

const summarizeAddress = (address: string, fallback: string) => {
  if (!address) return fallback;
  const cleaned = address.replace(/[()]/g, " ");
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const buildingToken = tokens.find((token) =>
    /(빌딩|타워|센터|플라자|스퀘어|몰|캐슬|아파트|오피스텔)$/u.test(token)
  );
  if (buildingToken) return buildingToken;
  const roadToken = tokens.find((token) => /(대로|로|길|거리)/u.test(token));
  if (roadToken) return roadToken.replace(/[0-9-]+/g, "");
  const dongToken = tokens.find((token) => /동$/u.test(token));
  if (dongToken) return dongToken;
  return fallback;
};

export function ListingCard({
  listing,
  userRole = "guest",
  isHighlighted = false,
  onHover,
  onClick,
}: ListingCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  useEffect(() => {
    setImageLoaded(false);
  }, [listing.thumbnailUrl]);

  const premiumText =
    getVisibleFieldValue("premium", listing.premium, userRole, listing.status) ?? PLACEHOLDER;
  const depositText =
    getVisibleFieldValue("deposit", listing.deposit, userRole, listing.status) ?? PLACEHOLDER;
  const rentText =
    getVisibleFieldValue("monthlyRent", listing.monthlyRent, userRole, listing.status) ??
    PLACEHOLDER;

  const summaryAddress = summarizeAddress(listing.address, listing.dong);
  const lqipSrc = listing.thumbnailLqipUrl ?? listing.thumbnailUrl;

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 overflow-hidden",
        "hover:shadow-lg hover:border-accent/50",
        isHighlighted && "ring-2 ring-accent shadow-lg"
      )}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(listing.id)}
      onBlur={() => onHover?.(null)}
      onClick={() => onClick?.(listing)}
      tabIndex={0}
      role="button"
      aria-label={`${listing.title} 상세 보기`}
      onKeyDown={(event) => {
        if (event.key === "Enter") onClick?.(listing);
      }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={lqipSrc}
          alt=""
          aria-hidden="true"
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            "scale-110 blur-xl",
            imageLoaded ? "opacity-0" : "opacity-100"
          )}
        />
        <img
          src={listing.thumbnailUrl}
          srcSet={`${listing.thumbnailUrl} 1x, ${listing.thumbnailUrl} 2x`}
          sizes="(max-width: 640px) 100vw, 320px"
          alt={listing.title}
          className={cn(
            "relative z-10 h-full w-full object-cover transition-opacity duration-500",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
          decoding="async"
        />

        <div className="absolute top-2 left-2 flex gap-1.5">
          <StatusBadge status={listing.status} />
          {listing.isNew && (
            <Badge className="bg-accent text-accent-foreground font-medium">NEW</Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{listing.dong}</h3>
            <Badge variant="secondary" className="mt-1 font-normal">
              {listing.category}
            </Badge>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">권리금</span>
            <span className="font-semibold text-foreground">{premiumText}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">보증금/월세</span>
            <span className="font-medium text-foreground">
              {depositText} / {rentText}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>전용면적</span>
          <span>
            {listing.areaM2}㎡({listing.areaPyeong}평)
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{summaryAddress}</span>
        </div>

        {listing.note && (
          <p className="text-xs text-muted-foreground line-clamp-1 pt-1 border-t border-border">
            {listing.note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}


