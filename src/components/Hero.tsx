
import { Button } from "@/components/ui/button";
import { Camera, Shield, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Interview Integrity.
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {" "}
                  Reimagined.
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Prevent cheating with in-person monitored interviews at
                co-working spaces near your candidates.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105"
                onClick={() => navigate("/enterprise/booking")}
              >
                Book a FaceDesk Room
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-blue-200 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
                onClick={() => {
                  const section = document.getElementById("how-it-works");
                  if (section) {
                    section.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                See How It Works
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">Verified Spaces</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">Monitored</span>
              </div>
            </div>
          </div>

          <div className="relative animate-scale-in">
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-700 font-medium">
                      Professional Interview Environment
                    </p>
                    <p className="text-gray-500 text-sm">
                      Verified • Monitored • Secure
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>

              <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
