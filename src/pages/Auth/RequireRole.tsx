import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

type Props = {
  role: "enterprise" | "provider" | "admin";
  children: ReactNode;
};

export default function RequireRole({ role, children }: Props) {
  const { isSignedIn, user, isLoaded } = useUser();
  const location = useLocation();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Be defensive: metadata can be string, object, or array depending on how you store it.
  const raw =
    (user?.publicMetadata?.role as any) ??
    (user?.unsafeMetadata?.role as any) ;

  const userRole =
    typeof raw === "string" ? raw :
    (typeof raw === "object" && typeof raw?.role === "string") ? raw.role :
    (Array.isArray(raw) && typeof raw[0] === "string") ? raw[0] :
    "";

  // Optional: allow admin everywhere
  if (userRole === "admin") return <>{children}</>;

  if (userRole !== role) {
    // 🚀 Redirect to the USER's home, not the required role
    const home =
      userRole === "provider"   ? "/provider"   :
      userRole === "enterprise" ? "/enterprise" :
      "/select-role";

    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
