// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Toaster } from "sonner"; // Import Toaster
import { LiquidBackground } from "@/components/common/LiquidBackground"; // Import Background

// Trang Public
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";

// Trang Private (yêu cầu login)
import { DashboardPage } from "@/pages/DashboardPage";
import { UsersPage } from "@/pages/UsersPage"; // Đổi tên
import { FundPage } from "@/pages/FundPage";
import { UtilitiesPage } from "@/pages/UtilitiesPage";
import { DutyPage } from "@/pages/DutyPage";
import { TeamCalendarPage } from "@/pages/TeamCalendarPage";
import { ThemeEventProvider } from "@/context/ThemeEventContext";
import { ThemeEffectsContainer } from "@/components/theme/ThemeEffectsContainer";
import { ThemeEventPage } from "@/pages/ThemeEventPage";
import { DonateOverlay } from "@/features/fund/DonateOverlay";
import { DocumentTitleUpdater } from "@/components/common/DocumentTitleUpdater";
import { MusicProvider } from "@/context/MusicContext";
import { MusicFAB } from "@/components/music/MusicFAB";
import MusicPage from "@/pages/MusicPage";
import { LogConsolePage } from "@/pages/LogConsolePage";

// Games pages
import { GamesLayout } from "@/pages/games/GamesLayout";
import { GamesPage } from "@/pages/games/GamesPage";
import { BlackjackTablesPage } from "@/pages/games/BlackjackTablesPage";
import { BlackjackGamePage } from "@/pages/games/BlackjackGamePage";

function App() {
  return (
    <ThemeEventProvider>
      <BrowserRouter>
        {/* Background toàn bộ ứng dụng */}
        <LiquidBackground />

        {/* Theme Effects Overlay */}
        <ThemeEffectsContainer />

        {/* Donate Overlay - hiển thị ở tất cả các route */}
        <DonateOverlay />

        {/* Document Title Updater - cập nhật title tab với số tin nhắn chưa đọc */}
        <DocumentTitleUpdater />

        <Routes>
          {/* Route Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Route Private */}
          <Route element={<ProtectedRoute />}>
            {/* Music Provider wraps all protected routes */}
            <Route element={<MusicProviderWrapper />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="members" element={<UsersPage />} />
                <Route path="fund" element={<FundPage />} />

                <Route path="utilities" element={<UtilitiesPage />} />
                <Route path="utilities/duty" element={<DutyPage />} />
                <Route path="utilities/team-calendar" element={<TeamCalendarPage />} />
                <Route path="utilities/theme-event" element={<ThemeEventPage />} />
                <Route path="music" element={<MusicPage />} />
                <Route path="logs" element={<LogConsolePage />} />
              </Route>

              {/* Games routes - separate layout */}
              <Route path="/games" element={<GamesLayout />}>
                <Route index element={<GamesPage />} />
                <Route path=":gameType" element={<BlackjackTablesPage />} />
                <Route path=":gameType/:tableId" element={<BlackjackGamePage />} />
              </Route>
            </Route>
          </Route>

        </Routes>

        <Toaster
          position="top-center"
          theme="dark"
          toastOptions={{
            classNames: {
              toast: 'bg-card border-border shadow-lg',
              title: 'text-card-foreground font-semibold',
              description: 'text-muted-foreground',
              success: 'bg-card border-primary/50 [&_[data-icon]]:text-green-400',
              error: 'bg-card border-destructive/50 [&_[data-icon]]:text-destructive',
              warning: 'bg-card border-yellow-500/50 [&_[data-icon]]:text-yellow-400',
              info: 'bg-card border-primary/50 [&_[data-icon]]:text-primary',
            },
          }}
        />
      </BrowserRouter >
    </ThemeEventProvider>
  );
}

// Wrapper component to provide MusicContext and MusicFAB
import { Outlet } from "react-router-dom";

function MusicProviderWrapper() {
  return (
    <MusicProvider>
      <MusicFAB />
      <Outlet />
    </MusicProvider>
  );
}

export default App;
