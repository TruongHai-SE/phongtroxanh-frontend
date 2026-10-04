import { Outlet } from "react-router";
import { RouteProgressBar } from "./RouteProgressBar";
import { ScrollToTop } from "../shared/ScrollToTop";

export function RootLayout() {
  return (
    <>
      <RouteProgressBar />
      <ScrollToTop />
      <Outlet />
    </>
  );
}
