import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";

const AdminPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopBar userRole="master" />
      <main className="pt-header">
        <div className="mx-auto w-full max-w-5xl p-6">
          <h1 className="text-h1 text-foreground">관리자 페이지</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            관리자 설정과 승인 워크플로는 추후 제공됩니다.
          </p>
          <Card className="mt-6">
            <CardContent className="p-6 text-sm text-muted-foreground">
              관리자 전용 지표와 관리 도구 영역입니다.
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
