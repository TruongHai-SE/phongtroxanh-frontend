import { Suspense } from "react";
import { Outlet } from "react-router";
import { RouteProgressBar } from "./RouteProgressBar";
import { ScrollToTop } from "../shared/ScrollToTop";

export function RootLayout() {
  return (
    <>
      <RouteProgressBar />
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <Outlet />
      </Suspense>
    </>
  );
}
