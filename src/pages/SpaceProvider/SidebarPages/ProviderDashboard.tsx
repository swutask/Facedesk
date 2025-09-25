import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bed, Calendar, DollarSign, CheckCircle, Upload } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useSupabase } from "@/context/supabaseContext";

const ProviderDashboard = () => {
  const { supabase } = useSupabase();
    const { user } = useUser();

  const [roomsThisMonth, setRoomsThisMonth] = useState(0);
  const [roomsLastMonth, setRoomsLastMonth] = useState(0);

  const [upcomingCount, setUpcomingCount] = useState(0);

  const [earningsThisMonth, setEarningsThisMonth] = useState(0);
  const [earningsLastMonth, setEarningsLastMonth] = useState(0);

  // Helper: format currency nicely
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

const fetchUserPreferences = async () => {
  if (!supabase || !user) return;

  const userPreferences = {
    user_id: user.id,  // User's ID from Clerk
    
  };

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert([userPreferences], { onConflict: ["user_id"] })
    .single(); 

  if (error) {
    console.error("Error fetching user preferences:", error);
  } else {
    console.log("Fetched data:", data);
  }
};

useEffect(() => {
  fetchUserPreferences();
}, [supabase, user]);  



    

  // Fetch rooms booked in date range (unique room count)
  const fetchRoomsBookedInRange = async (startDate: Date, endDate: Date) => {
    if (!supabase) return 0;

    const { data, error } = await supabase
      .from("candidates")
      .select("room_id")
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString());

    if (error) {
      console.error("Error fetching room bookings:", error);
      return 0;
    }

    if (!data) return 0;

    const uniqueRoomIds = new Set(data.map((item) => item.room_id));
    return uniqueRoomIds.size;
  };

  useEffect(() => {
    if (!supabase) return;

    const fetchStats = async () => {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfNextMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1
      );
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );

      const thisMonthRooms = await fetchRoomsBookedInRange(
        startOfThisMonth,
        startOfNextMonth
      );
      const lastMonthRooms = await fetchRoomsBookedInRange(
        startOfLastMonth,
        startOfThisMonth
      );

      setRoomsThisMonth(thisMonthRooms);
      setRoomsLastMonth(lastMonthRooms);
    };

    fetchStats();
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    const fetchUpcomingBookings = async () => {
      const today = new Date();
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(today.getDate() + 7);

      const { data, error } = await supabase
        .from("candidates")
        .select("id")
        .eq("interview_status", "upcoming")
        .gte("interview_date", today.toISOString().split("T")[0])
        .lte("interview_date", sevenDaysLater.toISOString().split("T")[0]);

      if (error) {
        console.error("Error fetching upcoming bookings:", error);
        return;
      }

      setUpcomingCount(data?.length || 0);
    };

    fetchUpcomingBookings();
  }, [supabase]);

  // Fetch earnings for date range, multiplying duration * hourly rate
  const fetchEarnings = async (startDate: Date, endDate: Date) => {
    if (!supabase) return 0;

    const { data, error } = await supabase
      .from("candidates")
      .select("duration, interview_date, provider_gross")
      .gte("interview_date", startDate.toISOString().split("T")[0])
      .lte("interview_date", endDate.toISOString().split("T")[0]);

    if (error) {
      console.error("Error fetching earnings:", error);
      return 0;
    }

    if (!data) return 0;

    const total = data.reduce((sum, item) => {
      const durationStr = item.duration;
      const hourlyRateStr = item.provider_gross;

      if (!durationStr || !hourlyRateStr) return sum;

      // Convert HH:MM:SS → decimal hours
      const [h, m, s] = durationStr.split(":").map(Number);
      const hours = h + m / 60 + s / 3600;

      const hourlyRate = parseFloat(hourlyRateStr);

      if (isNaN(hourlyRate) || isNaN(hours)) return sum;

      return sum + hourlyRate * hours;
    }, 0);

    return total;
  };

  useEffect(() => {
    if (!supabase) return;

    const fetchMonthlyEarnings = async () => {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfNextMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1
      );
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      
      const endOfLastMonth = new Date(startOfThisMonth.getTime() - 1); 

      const thisMonth = await fetchEarnings(startOfThisMonth, startOfNextMonth);
      const lastMonth = await fetchEarnings(startOfLastMonth, endOfLastMonth);

      setEarningsThisMonth(thisMonth);
      setEarningsLastMonth(lastMonth);
    };

    fetchMonthlyEarnings();
  }, [supabase]);

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) {
      if (current === 0) return 0;
      return 100;
    }
    return ((current - previous) / previous) * 100;
  };


  const navigate = useNavigate();

  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!user) navigate("/");
  }, [user]);

  useEffect(() => {
    if (!supabase) return;

    const fetchRecentBookings = async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select(`*, room:rooms!candidates_room_id_fkey ( room_name )`)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) {
        console.error("Error fetching recent bookings:", error);
        return;
      }

      const formatted = formatCandidateData(data || []);
      setRecentBookings(formatted);
    };

    fetchRecentBookings();
  }, [supabase]);

  const getDurationHours = (interval: string) => {
    const match = interval?.match(/(\d+):(\d+):(\d+)/);
    if (!match) return 0;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours + minutes / 60;
  };

  const formatCandidateData = (data: any[]) => {
    return data.map((c) => {
      const startTime = new Date(`1970-01-01T${c.interview_time}`);
      const durationHours = getDurationHours(c.duration || "00:00:00");
      const endTime = new Date(startTime.getTime() + durationHours * 3600000);
      const formatTime = (d: Date) =>
        d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

      return {
        id: c.id,
        date: new Date(c.interview_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: `${formatTime(startTime)} - ${formatTime(endTime)}`,
        room: c.room?.room_name,
        candidate: c.full_name,
        status: c.interview_status,
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600">
          Manage your interview rooms and track your earnings on FaceDesk.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Rooms Booked
            </CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roomsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {roomsThisMonth - roomsLastMonth >= 0 ? "+" : ""}
              {roomsThisMonth - roomsLastMonth} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCount}</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Month's Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(earningsThisMonth)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(() => {
                const percent = calculatePercentageChange(
                  earningsThisMonth,
                  earningsLastMonth
                );
                const prefix = percent >= 0 ? "+" : "";
                return `${prefix}${percent.toFixed(0)}% from last month`;
              })()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Verification Status
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3/5</div>
            <p className="text-xs text-muted-foreground">Rooms verified</p>
          </CardContent>
        </Card>
      </div>

      {/* Get Verified Banner */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-orange-900 mb-2">
                Get FaceDesk Verified
              </h3>
              <p className="text-orange-700 mb-3">
                2 of your rooms need verification. Upload camera angle photos to
                increase bookings by up to 40%.
              </p>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                <Upload className="w-4 h-4 mr-2" />
                Complete Verification
              </Button>
            </div>
            <div className="hidden md:block">
              <CheckCircle className="w-16 h-16 text-orange-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent bookings found.
              </p>
            ) : (
              recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{booking.room}</p>
                        <p className="text-sm text-gray-600">
                          {booking.date} • {booking.time}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Candidate: {booking.candidate}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      booking.status === "confirmed" ? "default" : "secondary"
                    }
                    className={
                      booking.status === "confirmed"
                        ? "bg-green-100 text-green-800"
                        : ""
                    }
                  >
                    {booking.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => navigate("/provider/bookings")}
            >
              View All Bookings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderDashboard;
