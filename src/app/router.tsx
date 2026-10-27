import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "@/components/layouts/RootLayout";
import { MainLayout } from "@/components/layouts/MainLayout";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

// Auth
const Landing = lazy(() => import("@/features/auth/pages/Landing"));
const Login = lazy(() => import("@/features/auth/pages/Login"));
const RoleSelect = lazy(() => import("@/features/auth/pages/RoleSelect"));
const Onboarding = lazy(() => import("@/features/auth/pages/Onboarding"));
const VerifyAccount = lazy(() => import("@/features/auth/pages/VerifyAccount"));
const LandlordOnboarding = lazy(() => import("@/features/auth/pages/LandlordOnboarding"));
const ForgotPassword = lazy(() => import("@/features/auth/pages/ForgotPassword"));

// Rooms
const Discover = lazy(() => import("@/features/rooms/pages/Discover"));
const RoomDetail = lazy(() => import("@/features/rooms/pages/RoomDetail"));
const Saved = lazy(() => import("@/features/rooms/pages/Saved"));
const MapView = lazy(() => import("@/features/rooms/pages/MapView"));
const Compare = lazy(() => import("@/features/rooms/pages/Compare"));

// Roommates
const Roommates = lazy(() => import("@/features/roommates/pages/Roommates"));
const RoommateDetail = lazy(() => import("@/features/roommates/pages/RoommateDetail"));
const Matches = lazy(() => import("@/features/roommates/pages/Matches"));

// Chat
const Chat = lazy(() => import("@/features/chat/pages/Chat"));

// Reviews
const Reviews = lazy(() => import("@/features/reviews/pages/Reviews"));
const TrustScore = lazy(() => import("@/features/reviews/pages/TrustScore"));

// Monetization
const PaymentCallback = lazy(() => import("@/features/monetization/pages/PaymentCallback"));

// Account
const Profile = lazy(() => import("@/features/account/pages/Profile"));
const EditProfile = lazy(() => import("@/features/account/pages/EditProfile"));
const Settings = lazy(() => import("@/features/account/pages/Settings"));

// Notifications
const Notifications = lazy(() => import("@/features/notifications/pages/Notifications"));

// Misc
import { About, PublicProfile, OfflineError, ServerError, AccessDenied, NotFound } from "@/features/misc/pages/Misc";

// Landlord
const LandlordDashboard = lazy(() => import("@/features/landlord/pages/Dashboard"));

// Tenant new features
const TenantSwap = lazy(() => import("@/features/roommates/pages/TenantSwap"));
const RentalsMe = lazy(() => import("@/features/rentals/pages/RentalsMe"));

// Admin
const AdminOverview = lazy(() => import("@/features/admin/pages/AdminOverview"));
const CccdQueue = lazy(() => import("@/features/admin/pages/CccdQueue"));
const AdminUsers = lazy(() => import("@/features/admin/pages/AdminUsers"));
const Reports = lazy(() => import("@/features/admin/pages/Reports"));
const AdminPackages = lazy(() => import("@/features/admin/pages/AdminPackages"));

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
              { path: "/swap", element: <Navigate to="/rentals/me" replace /> },
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

