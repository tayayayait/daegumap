import { TopBar } from "@/components/layout/TopBar";

const SignupPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopBar userRole="guest" />
      <main className="pt-header">
        <div className="mx-auto w-full max-w-xl p-6">
          <h1 className="text-h1 text-foreground">회원가입</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            회원가입 화면은 인증 연동 후 제공됩니다.
          </p>
        </div>
      </main>
    </div>
  );
};

export default SignupPage;
