import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "@/components/layouts/RootLayout";
import { MainLayout } from "@/components/layouts/MainLayout";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

// Auth
import Landing from "@/features/auth/pages/Landing";
import Login from "@/features/auth/pages/Login";
import RoleSelect from "@/features/auth/pages/RoleSelect";
import Onboarding from "@/features/auth/pages/Onboarding";
import VerifyAccount from "@/features/auth/pages/VerifyAccount";
import LandlordOnboarding from "@/features/auth/pages/LandlordOnboarding";
import ForgotPassword from "@/features/auth/pages/ForgotPassword";

// Rooms
import Discover from "@/features/rooms/pages/Discover";
import RoomDetail from "@/features/rooms/pages/RoomDetail";
import Saved from "@/features/rooms/pages/Saved";
import MapView from "@/features/rooms/pages/MapView";
import Compare from "@/features/rooms/pages/Compare";

// Roommates
import Roommates from "@/features/roommates/pages/Roommates";
import RoommateDetail from "@/features/roommates/pages/RoommateDetail";
import Matches from "@/features/roommates/pages/Matches";

// Chat
import Chat from "@/features/chat/pages/Chat";
import LandlordChat from "@/features/chat/pages/LandlordChat";

// Reviews
import Reviews from "@/features/reviews/pages/Reviews";
import TrustScore from "@/features/reviews/pages/TrustScore";

// Monetization
import PaymentCallback from "@/features/monetization/pages/PaymentCallback";

// Account
import Profile from "@/features/account/pages/Profile";
import EditProfile from "@/features/account/pages/EditProfile";
import Settings from "@/features/account/pages/Settings";

// Notifications
import Notifications from "@/features/notifications/pages/Notifications";

// Misc
import { About, PublicProfile, OfflineError, ServerError, AccessDenied, NotFound } from "@/features/misc/pages/Misc";

// Landlord
import LandlordDashboard from "@/features/landlord/pages/Dashboard";

// Tenant new features
import TenantSwap from "@/features/roommates/pages/TenantSwap";
import RentalsMe from "@/features/rentals/pages/RentalsMe";

// Admin
import AdminOverview from "@/features/admin/pages/AdminOverview";
import CccdQueue from "@/features/admin/pages/CccdQueue";
import AdminUsers from "@/features/admin/pages/AdminUsers";
import Reports from "@/features/admin/pages/Reports";
import AdminPackages from "@/features/admin/pages/AdminPackages";

// Security & Guards
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      { path: "/", Component: Landing },
      { path: "/about", Component: About },

      // Guest only (redirect if already logged in)
      {
        path: "/login",
        element: (
          <ProtectedRoute guestOnly>
            <Login />
          </ProtectedRoute>
        ),
      },
      {
        path: "/forgot-password",
        element: (
          <ProtectedRoute guestOnly>
            <ForgotPassword />
          </ProtectedRoute>
        ),
      },

      // Onboarding routes (require auth, onboarding-only)
      {
        path: "/onboarding/role",
        element: (
          <ProtectedRoute requireAuth onboardingOnly>
            <RoleSelect />
          </ProtectedRoute>
        ),
      },
      {
        path: "/onboarding",
        element: (
          <ProtectedRoute requireAuth onboardingOnly>
            <Onboarding />
          </ProtectedRoute>
        ),
      },
      {
        path: "/onboarding/landlord",
        element: (
          <ProtectedRoute requireAuth onboardingOnly>
            <LandlordOnboarding />
          </ProtectedRoute>
        ),
      },
      { path: "/verify-account", Component: VerifyAccount },

      {
        Component: MainLayout,
        children: [
          // Public routes (guests allowed)
          { path: "/discover", Component: Discover },
          { path: "/rooms/:id", Component: RoomDetail },
          { path: "/compare", Component: Compare },
          { path: "/roommates", Component: Roommates },
          { path: "/roommates/:id", Component: RoommateDetail },
          { path: "/public-profile", Component: PublicProfile },
          { path: "/reviews", Component: Reviews },
          { path: "/trustscore", Component: TrustScore },
          { path: "/map", Component: MapView },
          { path: "/error/offline", Component: OfflineError },
          { path: "/error/server", Component: ServerError },
          { path: "/error/denied", Component: AccessDenied },

          // Authenticated tenant & user routes
          {
            element: <ProtectedRoute requireAuth />,
            children: [
              { path: "/saved", Component: Saved },
              { path: "/roommate-editor", Component: EditProfile },
              { path: "/matches", Component: Matches },
              { path: "/profile", Component: Profile },
              { path: "/edit-profile", Component: EditProfile },
              { path: "/settings", Component: Settings },
              { path: "/notifications", Component: Notifications },
              { path: "/chat", Component: Chat },
              { path: "/check-in", element: <Navigate to="/rentals/me" replace /> },
              { path: "/swap", Component: TenantSwap },
              { path: "/rentals/me", Component: RentalsMe },
              { path: "/payment/callback", Component: PaymentCallback },
              { path: "/payment/payos-return", Component: PaymentCallback },
              { path: "/payment/payos-cancel", Component: PaymentCallback },
            ],
          },
        ],
      },

      // Landlord dashboard (requires auth and role landlord or admin)
      {
        element: (
          <ProtectedRoute requireAuth allowedRoles={["landlord", "admin"]}>
            <DashboardLayout variant="landlord" />
          </ProtectedRoute>
        ),
        children: [
          { path: "/landlord", Component: LandlordDashboard },
        ],
      },

      // Admin dashboard (requires auth and role admin)
      {
        element: (
          <ProtectedRoute requireAuth allowedRoles={["admin"]}>
            <DashboardLayout variant="admin" />
          </ProtectedRoute>
        ),
        children: [
          { path: "/admin", Component: AdminOverview },
          { path: "/admin/cccd", Component: CccdQueue },
          { path: "/admin/users", Component: AdminUsers },
          { path: "/admin/reports", Component: Reports },
          { path: "/admin/packages", Component: AdminPackages },
        ],
      },

      { path: "*", Component: NotFound },
    ],
  },
]);

