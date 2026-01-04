import { TopBar } from "@/components/layout/TopBar";
import { BackofficeTable } from "@/components/backoffice/BackofficeTable";
import { allListings } from "@/data/mockListings";

const BackofficePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopBar userRole="staff" />
      <main className="pt-header h-[calc(100vh-var(--header-height))]">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 p-6">
          <div>
            <h1 className="text-h1 text-foreground">백오피스</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              검수 대기 및 매물 관리 테이블입니다.
            </p>
          </div>
          <div className="flex-1">
            <BackofficeTable listings={allListings} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BackofficePage;
