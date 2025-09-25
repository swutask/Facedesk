// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Register from "./pages/Auth/Register";
import Login from "./pages/Auth/Login";
import Booking from "./pages/Enterprise/Functionalities/Booking";
import AddNewRoom from "./pages/SpaceProvider/Functionalities/AddNewRoom";
import NotFound from "./pages/NotFound";
import SelectRole from "./pages/Auth/SelectRole";
import { SupabaseProvider } from "./context/supabaseContext";
import LoginRedirect from "./pages/Auth/LoginRedirect";
import { APIProvider } from "@vis.gl/react-google-maps";
import { ToastContainer } from "react-toastify";
import ProviderDashboard from "./pages/SpaceProvider/SidebarPages/ProviderDashboard";
import ProviderRooms from "@/pages/SpaceProvider/SidebarPages/ProviderRooms";
import ProviderBookings from "@/pages/SpaceProvider/SidebarPages/ProviderBookings";
import ProviderEarnings from "@/pages/SpaceProvider/SidebarPages/ProviderEarnings";
import ProviderVerification from "@/pages/SpaceProvider/SidebarPages/ProviderVerification";
import ProviderSupport from "@/pages/SpaceProvider/SidebarPages/ProviderSupport";
import ProviderLayout from "./pages/SpaceProvider/Layout/ProviderLayout";
import { useSupabaseTokenSync } from "./hooks/useSupabaseTokenSync";
import EnterpriseLayout from "./pages/Enterprise/Layout/EnterpriseLayout";
import EnterpriseDashboard from "./pages/Enterprise/SidebarPages/EnterpriseDashboard";
import EnterpriseBookings from "./pages/Enterprise/SidebarPages/EnterpriseBookings";
import EnterpriseCandidates from "./pages/Enterprise/SidebarPages/EnterpriseCandidates";
import EnterpriseBilling from "./pages/Enterprise/SidebarPages/EnterpriseBilling";
import EnterpriseSettings from "./pages/Enterprise/SidebarPages/EnterpriseSettings";
import RequireRole from "./pages/Auth/RequireRole";
import ProviderSettings from "./pages/SpaceProvider/SidebarPages/ProviderSettings";
import BookingConfirm from "./pages/Enterprise/Functionalities/BookingConfirm";
import BookingPayment from "./pages/Enterprise/Functionalities/BookingPayment";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const queryClient = new QueryClient();

const App = () => {
  useSupabaseTokenSync();
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SupabaseProvider>
          {/* ⬇ Wrap BrowserRouter with APIProvider so maps work anywhere */}
          <APIProvider
            apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={["places", "marker"]} // <— required for Autocomplete
          >
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/register/*" element={<Register />} />
                {/* <Route
                  path="/register/verify-email-address"
                  element={<Register />}
                /> */}
                <Route path="/login/*" element={<Login />} />
                <Route path="/login-redirect" element={<LoginRedirect />} />
                <Route path="/select-role" element={<SelectRole />} />
                <Route
                  path="/enterprise"
                  element={
                    <RequireRole role="enterprise">
                      <EnterpriseLayout />
                    </RequireRole>
                  }
                >
                  <Route index element={<EnterpriseDashboard />} />
                  <Route path="dashboard" element={<EnterpriseDashboard />} />
                  <Route path="bookings" element={<EnterpriseBookings />} />
                  <Route path="candidates" element={<EnterpriseCandidates />} />
                  <Route
                    path="billing"
                    element={
                      <Elements stripe={stripePromise}>
                        <EnterpriseBilling />
                      </Elements>
                    }
                  />
                  <Route path="settings" element={<EnterpriseSettings />} />
                  <Route path="booking" element={<Booking />} />
                  <Route path="booking/confirm" element={<BookingConfirm />} />
                  <Route
                    path="payment/:id"
                    element={
                      <Elements stripe={stripePromise}>
                        <BookingPayment />
                      </Elements>
                    }
                  />
                </Route>
                <Route
                  path="/provider"
                  element={
                    <RequireRole role="provider">
                      <ProviderLayout />
                    </RequireRole>
                  }
                >
                  <Route index element={<ProviderDashboard />} />
                  <Route path="dashboard" element={<ProviderDashboard />} />
                  <Route path="rooms" element={<ProviderRooms />} />
                  <Route path="bookings" element={<ProviderBookings />} />
                  <Route path="earnings" element={<ProviderEarnings />} />
                  <Route
                    path="verification"
                    element={<ProviderVerification />}
                  />
                  <Route path="support" element={<ProviderSupport />} />
                  <Route path="add-room" element={<AddNewRoom />} />
                  <Route path="edit-room/:id" element={<AddNewRoom />} />
                  <Route path="settings" element={<ProviderSettings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </APIProvider>
        </SupabaseProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
