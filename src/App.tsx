import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/language";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Timeline from "./pages/Timeline.tsx";
import Partners from "./pages/Partners.tsx";
import Clubs from "./pages/Clubs.tsx";
import Organizers from "./pages/Organizers.tsx";
import Portfolio from "./pages/Portfolio.tsx";
import AdminLogin from "./pages/Admin/AdminLogin.tsx";
import AdminLayout from "./pages/Admin/AdminLayout.tsx";
import AdminOverview from "./pages/Admin/AdminOverview.tsx";
import AdminLiveProgram from "./pages/Admin/AdminLiveProgram.tsx";
import AdminProgram from "./pages/Admin/AdminProgram.tsx";
import AdminPartners from "./pages/Admin/AdminPartners.tsx";
import AdminPostCoffee from "./pages/Admin/AdminPostCoffee.tsx";
import AdminOrganizers from "./pages/Admin/AdminOrganizers.tsx";
import AdminPortfolio from "./pages/Admin/AdminPortfolio.tsx";
import AdminProfile from "./pages/Admin/AdminProfile.tsx";
import AdminHomepageCms from "./pages/Admin/AdminHomepageCms.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/organizers" element={<Organizers />} />
            <Route path="/gallery" element={<Portfolio />} />
            <Route path="/login" element={<AdminLogin />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="overview" element={<AdminOverview />} />
              <Route path="live-program" element={<AdminLiveProgram />} />
              <Route path="program" element={<AdminProgram />} />
              <Route path="partners" element={<AdminPartners />} />
              <Route path="post-coffee" element={<AdminPostCoffee />} />
              <Route path="organizers" element={<AdminOrganizers />} />
              <Route path="portfolio" element={<AdminPortfolio />} />
              <Route path="homepage-cms" element={<AdminHomepageCms />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
