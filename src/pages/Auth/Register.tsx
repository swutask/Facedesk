// src/pages/Auth/Register.tsx
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ClerkLoaded, ClerkLoading, SignUp } from "@clerk/clerk-react";

export default function Register() {
  return (
    <>
      <Header />
      <div className="flex items-center justify-center min-h-[950px]">
        <div className="w-full max-w-md">
          <ClerkLoading>
            <div className="animate-pulse p-6 rounded-xl border bg-white">
              <div className="h-6 w-1/3 mb-4 bg-gray-200 rounded" />
              <div className="space-y-2">
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            </div>
          </ClerkLoading>

          <ClerkLoaded>
            <SignUp
            routing="virtual"
              // path="/register"
              // routing="path"
              signInUrl="/login"
              fallbackRedirectUrl="/select-role"
              appearance={{
                elements: {
                  card: "text-lg",
                  headerTitle: "text-2xl font-bold",
                  headerSubtitle: "text-base",
                  formFieldLabel: "text-base",
                  formFieldInput: "text-base",
                  formButtonPrimary:
                    "bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-base font-semibold",
                  socialButtonsBlockButton:
                    "bg-gray-100 hover:bg-gray-200 text-black py-2 px-4 rounded text-base font-medium",
                },
              }}
            />
          </ClerkLoaded>
        </div>
      </div>
      <Footer />
    </>
  );
}
