import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, Video, Edit, X } from "lucide-react";

import { useSupabase } from "@/context/supabaseContext";
import { useNavigate } from "react-router-dom";


const EnterpriseBookings = () => {
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const searchInputRef = useRef<HTMLInputElement>(null); // Ref for search input

  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState(""); // Add search state

  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [inProgressBookings, setInProgressBookings] = useState<any[]>([]);
  const [completedBookings, setCompletedBookings] = useState<any[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecordings, setSelectedRecordings] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
    null
  );


  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  
  const filterBookings = (bookings: any[]) => {
    if (!searchQuery) return bookings;
    
    return bookings.filter(booking => 
      booking.candidate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };


  // ✅ Fixed: Correct formatTime function
  const formatTime = (timeString: string) => {
    const [hours, minutes, seconds] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || "0"));
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
  const mapBookingData = (data: any[]) =>
    data.map((booking) => ({
      id: booking.id,
      candidate: booking.full_name,
      date: booking.interview_date,
      time: formatTime(booking.interview_time),
      status: booking.interview_status,
      room: booking.room?.room_name,
      location: booking.room?.formatted_address,
      price: `₹${booking.price}`,
      recordings: booking.recording_files || [],
    }));

  const fetchUpcomingBookings = async () => {
    const { data, error } = await supabase
      .from("candidates")
      .select(
        `
        id,
        full_name,
        interview_date,
        interview_time,
        interview_status,
        check_in_status,
        price,
        room:rooms!candidates_room_id_fkey (
          room_name,
          formatted_address
        )
      `
      )
      .eq("interview_status", "upcoming");

    if (error) {
      console.error("Error fetching upcoming bookings:", error);
      return;
    }

    setUpcomingBookings(mapBookingData(data || []));
  };

  const fetchInProgressBookings = async () => {
    const { data, error } = await supabase
      .from("candidates")
      .select(
        `
        id,
        full_name,
        interview_date,
        interview_time,
        interview_status,
        check_in_status,
        price,
        room:rooms!candidates_room_id_fkey (
          room_name,
          formatted_address
        )
      `
      )
      .eq("interview_status", "in-progress");

    if (error) {
      console.error("Error fetching in-progress bookings:", error);
      return;
    }

    setInProgressBookings(mapBookingData(data || []));
  };

  const fetchCompletedBookings = async () => {
    const { data, error } = await supabase
      .from("candidates")
      .select(
        `
      id,
      full_name,
      interview_date,
      interview_time,
      interview_status,
      check_in_status,
      price,
      recording_files,
      room:rooms!candidates_room_id_fkey (
        room_name,
        formatted_address
      )
    `
      )
      .eq("interview_status", "completed");

    if (error) {
      console.error("Error fetching completed bookings:", error);
      return;
    }

    setCompletedBookings(mapBookingData(data || []));
  };

  const fetchCancelledBookings = async () => {
    const { data, error } = await supabase
      .from("candidates")
      .select(
        `
        id,
        full_name,
        interview_date,
        interview_time,
        interview_status,
        check_in_status,
        price,
        room:rooms!candidates_room_id_fkey (
          room_name,
          formatted_address
        )
      `
      )
      .eq("interview_status", "cancelled");

    if (error) {
      console.error("Error fetching cancelled bookings:", error);
      return;
    }

    setCancelledBookings(mapBookingData(data || []));
  };

  const cancelAppointemnt = async (id: string) => {
    console.log("sad", id);
    const { data, error } = await supabase
      .from("candidates")
      .update({ interview_status: "cancelled" })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error cancelling appointment:", error);
      return;
    }

    fetchUpcomingBookings();
    fetchCancelledBookings();
  };

  useEffect(() => {
    if (!supabase) return;

    fetchUpcomingBookings();
    fetchInProgressBookings();
    fetchCompletedBookings();
    fetchCancelledBookings();
  }, [supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified-id":
        return "bg-green-100 text-green-800";
      case "pending-verification":
        return "bg-yellow-100 text-yellow-800";
      case "checked-in":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-gray-100 text-gray-800";
      case "no-show":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

   useEffect(() => {
    // After data is loaded, refocus search input if it was focused
    if (searchInputRef.current && document.activeElement === searchInputRef.current) {
      // Small timeout to ensure re-render is complete
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [upcomingBookings, inProgressBookings, completedBookings, cancelledBookings]); // Depend on your data states

  const BookingCard = ({ booking }: { booking: any }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <User className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">
                {booking.candidate}
              </h3>
              <Badge className={getStatusColor(booking.status)}>
                {booking.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {booking.date} at {booking.time}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{booking.location}</span>
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Room:</span> {booking.room}
              <span className="ml-4 font-medium">Price:</span> {booking.price}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {booking.status === "completed" &&
              (booking.recordings && booking.recordings.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRecordings(booking.recordings);
                    setSelectedCandidate(booking.candidate);
                    setIsModalOpen(true);
                  }}
                >
                  <Video className="w-4 h-4 mr-1" />
                  View Recording
                </Button>
              ) : (
                <div className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-500 font-semibold">
                  No Recording Uploaded Yet
                </div>
              ))}

            {(booking.status === "upcoming" ||
              booking.status === "checked-in") && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConfirmCancelId(booking.id);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate("/enterprise/booking")}
        >
          New Booking
        </Button>
      </div>

    <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">
            Upcoming ({filterBookings(upcomingBookings).length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress ({filterBookings(inProgressBookings).length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({filterBookings(completedBookings).length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({filterBookings(cancelledBookings).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
             <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No matching bookings' : 'No upcoming bookings'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'Try a different search term' : 'Book your first FaceDesk room to get started.'}
                </p>
                {!searchQuery && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => navigate("/enterprise/booking")}
                  >
                    Book a Room
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="mt-6">
          {inProgressBookings.length > 0 ? (
            inProgressBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <p className="text-gray-600 text-center">
              No in-progress bookings.
            </p>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedBookings.length > 0 ? (
            completedBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <p className="text-gray-600 text-center">No completed bookings.</p>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          {cancelledBookings.length > 0 ? (
            cancelledBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <p className="text-gray-600 text-center">No cancelled bookings.</p>
          )}
        </TabsContent>
      </Tabs>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full relative shadow-lg">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold mb-4">
              Recordings for {selectedCandidate}
            </h2>

            {selectedRecordings.length > 0 ? (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {selectedRecordings.map((rec, index) => (
                  <div key={index} className="border p-3 rounded">
                    <p className="font-medium capitalize mb-2">
                      Angle: {rec.angle}
                    </p>
                    <video
                      src={rec.url}
                      controls
                      className="w-full rounded border"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p>No recordings available.</p>
            )}
          </div>
        </div>
      )}

      {confirmCancelId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full relative shadow-lg">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setConfirmCancelId(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold mb-4">Cancel Appointment</h2>
            <p className="text-gray-700 mb-6">
              This will cancel the candidate’s booking. Are you sure you want to
              continue?
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setConfirmCancelId(null)}
              >
                No
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  cancelAppointemnt(confirmCancelId);
                  setConfirmCancelId(null);
                }}
              >
                Yes, Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseBookings;
