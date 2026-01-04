import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MapListPage from "./pages/MapListPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import RegisterPage from "./pages/RegisterPage";
import BackofficePage from "./pages/BackofficePage";
import PartnerConsolePage from "./pages/PartnerConsolePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MapListPage />} />
          <Route path="/map" element={<MapListPage />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/backoffice" element={<BackofficePage />} />
          <Route path="/partner" element={<PartnerConsolePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
