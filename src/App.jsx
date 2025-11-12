// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout.jsx";
import { ProtectedRoute } from "@/components/common/ProtectedRoute.jsx";

// Trang Public
import { LoginPage } from "@/pages/LoginPage.jsx";
import { SignupPage } from "@/pages/SignupPage.jsx";

// Trang Private (yêu cầu login)
import { DashboardPage } from "@/pages/DashboardPage.jsx";
import { UsersPage } from "@/pages/UsersPage.jsx"; // Đổi tên
import { FundPage } from "@/pages/FundPage.jsx";
import { UtilitiesPage } from "@/pages/UtilitiesPage.jsx";
import { BeerSpinWheelPage } from "@/pages/BeerSpinWheelPage.jsx";
import { BeerCounterSetupPage } from "@/pages/BeerCounterSetupPage.jsx";
import { BeerPartyPage } from "@/pages/BeerPartyPage.jsx";
import { DutyPage } from "@/pages/DutyPage.jsx";
import { TeamCalendarPage } from "@/pages/TeamCalendarPage.jsx";
import { MyAccountPage } from "@/pages/MyAccountPage.jsx";
import { InvitePage } from "@/pages/InvitePage.jsx";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Route Private */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="members" element={<UsersPage />} /> {/* Đổi trang, giữ path cũ cho dễ */}
            <Route path="fund" element={<FundPage />} />
            
            <Route path="utilities" element={<UtilitiesPage />} />
            <Route path="utilities/duty" element={<DutyPage />} />
            <Route path="utilities/team-calendar" element={<TeamCalendarPage />} />
            <Route path="utilities/beer-wheel" element={<BeerSpinWheelPage />} />
            <Route path="utilities/beer-counter-setup" element={<BeerCounterSetupPage />} />
            <Route path="utilities/beer-party/:partyId" element={<BeerPartyPage />} />
            <Route path="account" element={<MyAccountPage />} />
            <Route path="utilities/invite" element={<InvitePage />} />
          </Route>
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;