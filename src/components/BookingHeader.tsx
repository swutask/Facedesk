import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";

interface BookingHeaderProps {
  step: 1 | 2 | 3;
}

const BookingHeader = ({ step }: BookingHeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const backPath =
    location.pathname === "/enterprise/booking"
      ? "/enterprise/dashboard"
      : `/enterprise/booking`;

  const renderStep = (current: number, label: string) => {
    if (current < step) {
      // ✅ Completed
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-green-600">{label}</span>
        </div>
      );
    }

    if (current === step) {
      if (step === 3) {
        // 🎉 Final step confirmed
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-green-600">{label}</span>
          </div>
        );
      }

      // 🔵 Active (but not final)
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
            {current}
          </div>
          <span className="text-sm font-medium text-blue-600">{label}</span>
        </div>
      );
    }

    // ⚪ Upcoming
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm">
          {current}
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
    );
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(backPath)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FD</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Book a FaceDesk Room
              </span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="hidden md:flex items-center gap-2">
            {renderStep(1, "Find Space")}
            <div
              className={`w-8 h-px ${
                step > 1 ? "bg-green-600" : "bg-gray-300"
              }`}
            />

            {renderStep(2, "Book & Pay")}
            <div
              className={`w-8 h-px ${
                step > 2 ? "bg-green-600" : "bg-gray-300"
              }`}
            />

            {renderStep(3, "Confirm")}
          </div>
        </div>
      </div>
    </header>
  );
};

export default BookingHeader;
