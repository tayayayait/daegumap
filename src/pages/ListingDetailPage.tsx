import { useMemo, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { allListings } from "@/data/mockListings";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronLeft } from "lucide-react";

const DetailView = lazy(() =>
  import("@/components/listing/DetailView").then((module) => ({ default: module.DetailView }))
);

const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const listing = useMemo(() => allListings.find((item) => item.id === id), [id]);

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <main className="pt-header">
          <div className="mx-auto w-full max-w-5xl p-6">
            <h1 className="text-h1 text-foreground">매물을 찾을 수 없습니다.</h1>
            <Button className="mt-4" onClick={() => navigate("/map")}>
              지도로 돌아가기
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="pt-header min-h-screen bg-muted/30">
        <div className="mx-auto w-full max-w-6xl p-4 lg:p-8">
          <div
            className={
              isMobile
                ? ""
                : "lg:ml-auto lg:max-w-[880px] lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:shadow-lg"
            }
          >
            <div className={isMobile ? "" : "lg:p-8"}>
              {isMobile && (
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  뒤로가기
                </Button>
              )}
              <Suspense
                fallback={
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    상세 정보를 불러오는 중입니다.
                  </div>
                }
              >
                <DetailView listing={listing} userRole="guest" />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ListingDetailPage;
