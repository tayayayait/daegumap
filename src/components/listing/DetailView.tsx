import { useEffect, useMemo, useState } from "react";
import { Listing, UserRole } from "@/types/listing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { getVisibleFieldValue } from "@/lib/visibility";
import { cn } from "@/lib/utils";

interface DetailViewProps {
  listing: Listing;
  userRole?: UserRole;
}

const PLACEHOLDER = "-";
const MIN_LIGHTBOX_IMAGES = 5;

function StatusBadge({ status }: { status: Listing["status"] }) {
  const variants: Record<Listing["status"], { label: string; className: string }> = {
    active: { label: "게시중", className: "bg-success text-success-foreground" },
    negotiation: { label: "협의중", className: "bg-warning text-warning-foreground" },
    completed: { label: "계약완료", className: "bg-muted text-muted-foreground" },
    archived: { label: "비공개", className: "bg-muted text-muted-foreground" },
  };

  const { label, className } = variants[status];
  return <Badge className={className}>{label}</Badge>;
}

export function DetailView({ listing, userRole = "guest" }: DetailViewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const baseImages = useMemo(() => {
    const urls = listing.imageUrls?.length ? listing.imageUrls : [listing.thumbnailUrl];
    return urls.filter(Boolean);
  }, [listing.imageUrls, listing.thumbnailUrl]);

  const lightboxImages = useMemo(() => {
    if (baseImages.length >= MIN_LIGHTBOX_IMAGES) return baseImages;
    const padded = [...baseImages];
    while (padded.length < MIN_LIGHTBOX_IMAGES) {
      padded.push(baseImages[padded.length % baseImages.length]);
    }
    return padded;
  }, [baseImages]);

  const thumbnailImages = useMemo(() => lightboxImages.slice(0, 4), [lightboxImages]);
  const remainingCount = Math.max(0, lightboxImages.length - thumbnailImages.length);

  useEffect(() => {
    if (!lightboxOpen || !carouselApi) return;
    carouselApi.scrollTo(activeIndex, true);
  }, [lightboxOpen, carouselApi, activeIndex]);

  const premiumText =
    getVisibleFieldValue("premium", listing.premium, userRole, listing.status) ?? PLACEHOLDER;
  const depositText =
    getVisibleFieldValue("deposit", listing.deposit, userRole, listing.status) ?? PLACEHOLDER;
  const rentText =
    getVisibleFieldValue("monthlyRent", listing.monthlyRent, userRole, listing.status) ??
    PLACEHOLDER;

  const contactText = listing.ownerContact
    ? getVisibleFieldValue("ownerContact", listing.ownerContact, userRole, listing.status)
    : null;

  const notesText = listing.contractNotes
    ? getVisibleFieldValue("contractNotes", listing.contractNotes, userRole, listing.status)
    : listing.note ?? null;

  const closingDateText = listing.closingDate
    ? getVisibleFieldValue("closingDate", listing.closingDate, userRole, listing.status)
    : null;

  const markLoaded = (key: string) => {
    setLoadedImages((prev) => ({ ...prev, [key]: true }));
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {listing.dong} · {listing.category}
            </p>
            <h1 className="text-h1 text-foreground leading-tight">{listing.title}</h1>
          </div>
          <StatusBadge status={listing.status} />
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">가격 요약</div>
            <div className="mt-1 text-lg font-semibold text-foreground">
              권리금 {premiumText} · 보증금 {depositText} · 월세 {rentText}
            </div>
          </div>
          <span className="text-xs text-muted-foreground">최근 업데이트 · {listing.dong}</span>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-h2 text-foreground">사진</h2>
        <div className="grid grid-cols-2 gap-3">
          {thumbnailImages.map((src, index) => {
            const key = `${src}-${index}`;
            return (
              <button
                key={key}
                className="group relative overflow-hidden rounded-xl border border-border"
                onClick={() => {
                  setActiveIndex(index);
                  setLightboxOpen(true);
                }}
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={src}
                    srcSet={`${src} 1x, ${src} 2x`}
                    sizes="(max-width: 768px) 50vw, 25vw"
                    alt={`${listing.title} 사진 ${index + 1}`}
                    className={cn(
                      "h-full w-full object-cover transition-all duration-300",
                      !loadedImages[key] && "scale-105 blur-sm"
                    )}
                    loading="lazy"
                    onLoad={() => markLoaded(key)}
                  />
                </div>
                {index === thumbnailImages.length - 1 && remainingCount > 0 && (
                  <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center text-sm font-semibold">
                    +{remainingCount}장 더보기
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>사진 보기</DialogTitle>
            <DialogDescription className="sr-only">
              {listing.title} 사진을 확대해서 확인하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-4">
            <Carousel setApi={setCarouselApi} opts={{ loop: true }}>
              <CarouselContent>
                {lightboxImages.map((src, index) => (
                  <CarouselItem key={`${src}-${index}`}>
                    <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                      <img
                        src={src}
                        srcSet={`${src} 1x, ${src} 2x`}
                        sizes="(max-width: 1024px) 100vw, 880px"
                        alt={`${listing.title} 확대 사진 ${index + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </DialogContent>
      </Dialog>

      <section className="space-y-4">
        <Tabs defaultValue="overview">
          <TabsList className="flex flex-wrap justify-start">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="price">금액</TabsTrigger>
            <TabsTrigger value="location">입지</TabsTrigger>
            <TabsTrigger value="rights">권리</TabsTrigger>
            {(userRole === "staff" || userRole === "master") && (
              <TabsTrigger value="logs">로그</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-2">
            <dl className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <dt>주소</dt>
                <dd className="text-foreground">{listing.address}</dd>
              </div>
              <div className="flex justify-between">
                <dt>상세 주소</dt>
                <dd className="text-foreground">{listing.addressDetail ?? PLACEHOLDER}</dd>
              </div>
              <div className="flex justify-between">
                <dt>전용면적</dt>
                <dd className="text-foreground">
                  {listing.areaM2}㎡ ({listing.areaPyeong}평)
                </dd>
              </div>
            </dl>
          </TabsContent>

          <TabsContent value="price" className="space-y-2">
            <dl className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <dt>권리금</dt>
                <dd className="text-foreground">{premiumText}</dd>
              </div>
              <div className="flex justify-between">
                <dt>보증금</dt>
                <dd className="text-foreground">{depositText}</dd>
              </div>
              <div className="flex justify-between">
                <dt>월세</dt>
                <dd className="text-foreground">{rentText}</dd>
              </div>
            </dl>
          </TabsContent>

          <TabsContent value="location" className="space-y-2 text-sm text-muted-foreground">
            <p>
              주변 상권 및 교통 정보는 향후 추가될 예정입니다. 현재는 위치 요약 정보를 제공합니다.
            </p>
            <p className="text-foreground">{listing.address}</p>
          </TabsContent>

          <TabsContent value="rights" className="space-y-2 text-sm text-muted-foreground">
            <p className="text-foreground">{notesText ?? "특이사항 정보 없음"}</p>
            {closingDateText && (
              <p>
                실거래 예정일: <span className="text-foreground">{closingDateText}</span>
              </p>
            )}
          </TabsContent>

          {(userRole === "staff" || userRole === "master") && (
            <TabsContent value="logs" className="space-y-2 text-sm text-muted-foreground">
              <p>로그 기능은 백오피스 연동 후 제공됩니다.</p>
            </TabsContent>
          )}
        </Tabs>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3">
          <div className="text-sm text-muted-foreground">문의하기</div>
          {userRole === "staff" || userRole === "master" ? (
            <div className="flex flex-col gap-2">
              <span className="text-foreground">
                임대인 연락처: {contactText ?? "연락처 정보 없음"}
              </span>
              {contactText && (
                <Button asChild>
                  <a href={`tel:${contactText}`}>전화 걸기</a>
                </Button>
              )}
            </div>
          ) : userRole === "member" || userRole === "partner" ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button>문의하기</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>문의하기</DialogTitle>
                  <DialogDescription className="sr-only">
                    이름, 연락처, 희망 시간을 입력해 문의를 남길 수 있습니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inquiry-name">이름 *</Label>
                    <Input id="inquiry-name" placeholder="이름을 입력하세요" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inquiry-contact">연락처 *</Label>
                    <Input id="inquiry-contact" placeholder="010-0000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inquiry-time">희망 연락시간 *</Label>
                    <Input id="inquiry-time" placeholder="예: 평일 14시 이후" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inquiry-note">문의 내용</Label>
                    <Textarea id="inquiry-note" placeholder="문의 내용을 입력하세요" rows={4} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="outline" type="button">
                        취소
                      </Button>
                    </DialogClose>
                    <Button type="button">제출</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-foreground font-medium">로그인 후 문의가 가능합니다.</p>
                <p className="text-sm text-muted-foreground">
                  회원 가입하면 문의 내역을 확인할 수 있습니다.
                </p>
              </div>
              <Button asChild>
                <a href="/login">로그인</a>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
