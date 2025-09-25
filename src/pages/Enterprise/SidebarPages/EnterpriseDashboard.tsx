import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Clock, Video, ArrowRight } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useSupabase } from "@/context/supabaseContext";
import { useState, useEffect } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  formatDistanceToNow,
} from "date-fns";

const EnterpriseDashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const { supabase } = useSupabase();

  const [monthlyCompletedCount, setMonthlyCompletedCount] = useState(0);
  const [weeklyUpcomingCount, setWeeklyUpcomingCount] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [cityCount, setCityCount] = useState(0);

  const [upcomingInterviews, setUpcomingInterviews] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const [recentActivity, setRecentActivity] = useState([]);

const fetchUserPreferences = async () => {
  if (!supabase || !user) return;

  // Data you want to upsert
  const userPreferences = {
    user_id: user.id,  // Ensure this is your user's ID
   
  };

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert([userPreferences], { onConflict: ["user_id"] });  // 'user_id' is the unique identifier for this table

  if (error) {
    console.error("Error upserting user preferences:", error);
  } else {
    console.log("Upserted data:", data);
  }
};

useEffect(() => {
  fetchUserPreferences();
}, [supabase]);  







  useEffect(() => {
    const fetchStats = async () => {
      const startOfThisMonth = startOfMonth(new Date());
      const endOfThisMonth = endOfMonth(new Date());
      const startOfThisWeek = startOfWeek(new Date());
      const endOfThisWeek = endOfWeek(new Date());

      // 1. Monthly completed interviews
      const { data: completedThisMonth, error: completedError } = await supabase
        .from("candidates")
        .select("*")
        .gte("interview_date", startOfThisMonth.toISOString())
        .lte("interview_date", endOfThisMonth.toISOString())
        .eq("interview_status", "completed");

      setMonthlyCompletedCount(completedError ? 0 : completedThisMonth.length);

      // 2. Weekly upcoming interviews
      const { data: upcomingThisWeek, error: upcomingError } = await supabase
        .from("candidates")
        .select("*")
        .gte("interview_date", startOfThisWeek.toISOString())
        .lte("interview_date", endOfThisWeek.toISOString())
        .eq("interview_status", "upcoming");

      setWeeklyUpcomingCount(upcomingError ? 0 : upcomingThisWeek.length);

      // 3. Success Rate
      const { data: statusData, error: statusError } = await supabase
        .from("candidates")
        .select("interview_status");

      if (!statusError && statusData) {
        const completed = statusData.filter(
          (c) => c.interview_status === "completed"
        ).length;
        const cancelled = statusData.filter(
          (c) => c.interview_status === "cancelled"
        ).length;

        const rate =
          completed + cancelled > 0
            ? Math.round((completed / (completed + cancelled)) * 100)
            : 0;

        setSuccessRate(rate);
      }

      // 4. Total number of rooms (Cities)
      const { data: rooms, error: roomError } = await supabase
        .from("rooms")
        .select("id")
        .eq("status", "approved");

      if (!roomError && rooms) {
        setCityCount(rooms.length);
      }
    };

    fetchStats();
  }, [supabase]);

  const fetchUpcomingInterviews = async () => {
    const { data, error } = await supabase
      .from("candidates")
      .select(
        `
      id,
      full_name,
      interview_date,
      interview_time,
      interview_status,
      room_id,
      rooms!candidates_room_id_fkey (
          formatted_address
        )
    `
      )
      .eq("interview_status", "upcoming")
          .limit(5);

    if (!error && data) {
      setUpcomingInterviews(data);
    } else {
      setUpcomingInterviews([]);
      console.error("Error fetching upcoming interviews:", error);
    }
  };
  useEffect(() => {
    fetchUpcomingInterviews();
  }, [supabase]);

  // 🔹 Status to Action Mapping
  const statusToAction = {
    completed: "Interview completed",
    upcoming: "New booking confirmed",

    cancelled: "Booking cancelled",
    "in-progress": "Candidate checked in",
  };

  const statusToColor = {
    default: "bg-[#2563eb]",
  };

  useEffect(() => {
    const fetchRecentActivity = async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select("full_name, interview_status, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching recent activity:", error);
        return;
      }

      const activityData = data.map((item) => {
        const status = item.interview_status?.toLowerCase();
        const action = statusToAction[status] || "Unknown action";

        if (!action) {
          console.warn("Unknown interview_status:", status);
        }

        return {
          action,
          candidate: item.full_name,
          time: formatDistanceToNow(new Date(item.updated_at), {
            addSuffix: true,
          }),
          status,
        };
      });

      setRecentActivity(activityData);
    };

    fetchRecentActivity();
  }, [supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "checked-in":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  function getLocalISOString() {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your interviews today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {monthlyCompletedCount}
                </p>
                <p className="text-xs text-gray-500">Interviews</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">
                  {weeklyUpcomingCount}
                </p>
                <p className="text-xs text-gray-500">This week</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {successRate}%
                </p>
                <p className="text-xs text-gray-500">Check-ins</p>
              </div>
              <Video className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cities</p>
                <p className="text-2xl font-bold text-gray-900">{cityCount}</p>
                <p className="text-xs text-gray-500">Locations</p>
              </div>
              <MapPin className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Book Widget */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Book</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Enter candidate location or pin code"
              className="flex-1 w-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Input
              type="datetime-local"
              className="w-60"
              value={selectedDate || ""}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getLocalISOString()}
            />

            <Button
              onClick={() =>
                navigate(
                  `/enterprise/booking?location=${encodeURIComponent(
                    searchQuery
                  )}&date=${encodeURIComponent(selectedDate)}`
                )
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              Find Room
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Interviews */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {interview.full_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {interview.rooms?.formatted_address}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(interview.interview_date).toLocaleDateString()}{" "}
                      at{" "}
                      {new Date(
                        `1970-01-01T${interview.interview_time}Z`
                      ).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        interview.status
                      )}`}
                    >
                      {interview.interview_status}
                    </span>
                    
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      statusToColor[activity.status] || "bg-[#2563eb]"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">
                      {activity.candidate}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnterpriseDashboard;
