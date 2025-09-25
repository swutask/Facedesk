import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import BookingHeader from "@/components/BookingHeader";
import { Button } from "@/components/ui/button";

const BookingConfirm = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying payment...");

  useEffect(() => {
    if (sessionId) {
      // In future: fetch checkout session details from Supabase or Stripe
      setStatus("Payment successful! Your booking is confirmed.");
    } else {
       setStatus("Payment successful! Your booking is confirmed.");
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingHeader step={3}/>

      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-lg text-center shadow-lg border border-gray-100">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-600">
              Booking Confirmed 🎉
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-gray-700">{status}</p>

           
            <div className="flex justify-center">
              <Button
             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
             onClick={() => navigate("/enterprise/bookings")}
              >
                Go to My Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingConfirm;
