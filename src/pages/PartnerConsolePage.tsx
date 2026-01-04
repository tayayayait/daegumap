import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";

const PartnerConsolePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <TopBar userRole="partner" />
      <main className="pt-header">
        <div className="mx-auto w-full max-w-6xl p-6">
          <h1 className="text-h1 text-foreground">Partner Console</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Placeholder page for partner listings and inquiries.
          </p>
          <Card className="mt-6">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Partner console tools and tables will be implemented here.
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PartnerConsolePage;
