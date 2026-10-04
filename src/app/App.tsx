import { RouterProvider } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import { MonetizationProvider } from "./context/MonetizationContext";
import { PricingModal } from "@/features/monetization/components/PricingModal";
import { router } from "./router";

export default function App() {
  return (
    <AuthProvider>
      <MonetizationProvider>
        <RouterProvider router={router} />
        <PricingModal />
        <Toaster position="top-right" richColors expand={true} duration={3500} closeButton />
      </MonetizationProvider>
    </AuthProvider>
  );
}
