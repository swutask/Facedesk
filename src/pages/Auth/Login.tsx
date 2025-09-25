import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { SignIn } from "@clerk/clerk-react";

export default function Login() {
  return (
    <>
      <Header />
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <SignIn

            routing="virtual"
            // path="/login"
            // routing="path"
            signUpUrl="/register"
            fallbackRedirectUrl="/login-redirect"
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
        </div>
      </div>
      <Footer />
    </>
  );
}
