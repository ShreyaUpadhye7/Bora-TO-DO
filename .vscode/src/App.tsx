import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import HomePage from "./pages/HomePage";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import UndoneTasks from "./pages/UndoneTasks";
import StatsPage from "./pages/StatsPage";
import JournalPage from "./pages/JournalPage";
import FocusPage from "./pages/FocusPage";
import CalendarPage from "./pages/CalendarPage";
import NotificationsPage from "./pages/NotificationsPage";
import MagicShopPage from "./pages/MagicShopPage";
import BtsGamePage from "./pages/BtsGamePage";
import PixelColoringPage from "./pages/PixelColoringPage";
import PetGardenPage from "./pages/PetGardenPage";
import GratitudeJarPage from "./pages/GratitudeJarPage";
import NotesPage from "./pages/NotesPage";
import TodayEventPopup from "./components/TodayEventPopup";
import FloatingTimer from "./components/FloatingTimer";
import WalkingPet from "./components/WalkingPet";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <AuthPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/todos" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/undone" element={<ProtectedRoute><UndoneTasks /></ProtectedRoute>} />
            <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
            <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
            <Route path="/focus" element={<ProtectedRoute><FocusPage /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/magic-shop" element={<ProtectedRoute><MagicShopPage /></ProtectedRoute>} />
            <Route path="/game" element={<ProtectedRoute><BtsGamePage /></ProtectedRoute>} />
            <Route path="/pixel-art" element={<ProtectedRoute><PixelColoringPage /></ProtectedRoute>} />
            <Route path="/pet" element={<ProtectedRoute><PetGardenPage /></ProtectedRoute>} />
            <Route path="/gratitude" element={<ProtectedRoute><GratitudeJarPage /></ProtectedRoute>} />
            <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <TodayEventPopup />
          <FloatingTimer />
          <WalkingPet />
          <BottomNav />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
