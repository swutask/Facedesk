// src/pages/LoginRedirect.tsx
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginRedirect() {
  
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const role = user?.unsafeMetadata?.role;
      if (!role) {
        navigate("/select-role");
      } else if (role === "enterprise") {
        navigate("/enterprise");
      } else if (role === "provider") {
        navigate("/provider");
      } else {
        navigate("/select-role");
      }
    }
  }, [user, navigate]);

  return null;
}
