import { type ReactNode } from "react";
import { Navigate, useLocation, Outlet } from "react-router";
import { useAuth, type UserRole } from "@/app/context/AuthContext";

export interface ProtectedRouteProps {
  children?: ReactNode;
  /**
   * If true, user must be logged in. Default is true.
   */
  requireAuth?: boolean;
  /**
   * Allowed roles for this route. E.g. ["admin"], ["landlord", "admin"]
   */
  allowedRoles?: UserRole[];
  /**
   * If true, only guests (unauthenticated) can access (e.g. /login, /forgot-password).
   */
  guestOnly?: boolean;
  /**
   * If true, user must have completed onboarding (user.isOnboarded === true).
   */
  requireOnboarding?: boolean;
  /**
   * If true, this route is only for users currently in onboarding.
   * If already onboarded, redirects to home or role dashboard.
   */
  onboardingOnly?: boolean;
  /**
   * Specific role expected for this onboarding route ("tenant" or "landlord").
   */
  onboardingRole?: "tenant" | "landlord";
  /**
   * Custom redirect path on denial
   */
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  allowedRoles,
  guestOnly = false,
  requireOnboarding = false,
  onboardingOnly = false,
  onboardingRole,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. Show loader while checking session with backend /users/me
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground font-medium">Đang xác thực phiên đăng nhập...</span>
        </div>
      </div>
    );
  }

  // 2. Guest-only routes (/login, /forgot-password)
  if (guestOnly) {
    if (isAuthenticated && user) {
      if (user.isOnboarded === false && role !== "admin") {
        return <Navigate to={role === "landlord" ? "/onboarding/landlord" : "/onboarding/role"} replace />;
      }
      if (role === "admin") return <Navigate to="/admin" replace />;
      if (role === "landlord") return <Navigate to="/landlord" replace />;
      const searchParams = new URLSearchParams(location.search);
      const redirect = searchParams.get("redirect") || "/discover";
      return <Navigate to={redirect} replace />;
    }
    return children ? <>{children}</> : <Outlet />;
  }

  // 3. Require authentication
  if (requireAuth && (!isAuthenticated || !user)) {
    const redirectUrl = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectUrl)}`} replace />;
  }

  // 4. Role-based authorization
  if (allowedRoles && allowedRoles.length > 0 && role) {
    if (!allowedRoles.includes(role)) {
      return <Navigate to={redirectTo || "/error/denied"} replace />;
    }
  }

  // 5. Onboarding routes (/onboarding, /onboarding/landlord, /onboarding/role)
  if (onboardingOnly && user) {
    // Already onboarded users cannot stay on onboarding
    if (user.isOnboarded && role !== "admin") {
      return <Navigate to={role === "landlord" ? "/landlord" : "/discover"} replace />;
    }
  }

  // 6. Enforce onboarding completion for deep features
  if (requireOnboarding && user && role !== "admin" && user.isOnboarded === false) {
    return <Navigate to={role === "landlord" ? "/onboarding/landlord" : "/onboarding/role"} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
