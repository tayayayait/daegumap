import { TopBar } from "@/components/layout/TopBar";
import { RegisterWizard } from "@/components/register/RegisterWizard";
import type { UserRole } from "@/types/listing";

const RegisterPage = () => {
  const userRole: UserRole = "partner";
  const canRegister = userRole === "partner" || userRole === "staff" || userRole === "master";

  return (
    <div className="min-h-screen bg-background">
      <TopBar userRole={userRole} />
      <main className="pt-header">
        <div className="mx-auto w-full max-w-4xl p-6">
          <h1 className="text-h1 text-foreground">매물 등록</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            8단계 등록 절차를 따라 매물을 등록해 주세요.
          </p>
          <div className="mt-6">
            {canRegister ? (
              <RegisterWizard />
            ) : (
              <div className="rounded-xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                매물 등록은 인증된 파트너 및 직원 계정에서만 가능합니다.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
