
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
      <div className="container mx-auto px-6 text-center">
        <div className="space-y-8 max-w-3xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
            Ready to Interview Smarter?
          </h2>
          <p className="text-xl text-blue-100 leading-relaxed">
            Join forward-thinking companies who trust FaceDesk to maintain
            interview integrity and hire with confidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105"
              onClick={() => navigate("/enterprise/booking")}
            >
              Start Booking with FaceDesk
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="border-white/30 text-blue-600 hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
            >
              Schedule a Demo
            </Button>
          </div>

          <div className="pt-8 text-blue-200 text-sm">
            <p>No setup fees • 30-day free trial • Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
