import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";

const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopBar userRole="member" />
      <main className="pt-header">
        <div className="mx-auto w-full max-w-4xl p-6">
          <h1 className="text-h1 text-foreground">프로필</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            계정 정보와 저장한 매물은 추후 연동됩니다.
          </p>
          <Card className="mt-6">
            <CardContent className="p-6 text-sm text-muted-foreground">
              프로필 요약 카드 영역입니다.
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
