import React, { useState, useEffect } from "react";
import { useSupabase } from "@/context/supabaseContext";
import { toast } from "@/components/ui/use-toast";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Calendar, User, Clock, Upload, Check, X } from "lucide-react";

import { CandidateCheckInConfirmation } from '../../../EmailsTemplate/CandidateCheckins';
import { Resend } from "resend";

if (!import.meta.env.VITE_RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY in environment variables");
}

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

/* =======================
   Helpers
======================= */
const getDurationHours = (interval: string) => {
  const match = interval.match(/(\d+):(\d+):(\d+)/);
  if (!match) return 0;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours + minutes / 60;
};

const formatCandidateData = (
  data: any[],
  companies: any[],
  statusOverride?: string
) => {
  const companyMap = companies.reduce((acc, company) => {
    acc[company.user_id] = company.company_name;
    return acc;
  }, {} as Record<string, string>);

  return (data || []).map((c) => {
    const startTime = new Date(`1970-01-01T${c.interview_time}`);
    const durationHours = getDurationHours(c.duration || "00:00:00");
    const endTime = new Date(startTime.getTime() + durationHours * 3600000);
    const formatTime = (d: Date) => d.toTimeString().slice(0, 5);

    const hourlyRate = parseFloat(c.room?.pricing?.hourlyRate || "0");
    const price = hourlyRate * durationHours;

    const recordings = Array.isArray(c.recording_files)
      ? c.recording_files
      : [];
    const hasRecording = c.has_recording ?? recordings.length > 0;

    return {
      id: c.id,
      date: new Date(c.interview_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: `${formatTime(startTime)} - ${formatTime(endTime)}`,
      room: c.room?.room_name || "Unknown Room",
      candidate: c.full_name,
      company: companyMap[c.company_user_id] || null,
      status: c.interview_status,
      amount: price,
      hasRecording,
      recordings,
    };
  });
};

const fetchCompanies = async (supabase: any) => {
  const { data, error } = await supabase
    .from("company")
    .select("id, user_id, company_name");

  if (error) {
    console.error("Error fetching companies:", error);
    return [];
  }
  return data;
};

const fetchUpcoming = async (supabase: any, setBookings: any) => {
  const [companyData, candidateRes] = await Promise.all([
    fetchCompanies(supabase),
    supabase
      .from("candidates")
      .select(
        `
        *,
        room:rooms!candidates_room_id_fkey ( room_name, pricing )
      `
      )
      .eq("interview_status", "upcoming"),
  ]);

  const { data, error } = candidateRes;
  if (error) return;

  const formatted = formatCandidateData(data, companyData, "upcoming");
  setBookings((prev: any) => ({ ...prev, upcoming: formatted }));
};

const fetchCheckedIn = async (supabase: any, setBookings: any) => {
  const [companyData, candidateRes] = await Promise.all([
    fetchCompanies(supabase),
    supabase
      .from("candidates")
      .select(
        `
        *,
        room:rooms!candidates_room_id_fkey ( room_name, pricing )
      `
      )
      .eq("interview_status", "in-progress"),
  ]);

  const { data, error } = candidateRes;
  if (error) {
    console.error("Error fetching checked-in bookings:", error);
    return;
  }

  const formatted = formatCandidateData(data, companyData, "in-progress");
  setBookings((prev: any) => ({ ...prev, checkedIn: formatted }));
};

const fetchCompleted = async (supabase: any, setBookings: any) => {
  const [companyData, candidateRes] = await Promise.all([
    fetchCompanies(supabase),
    supabase
      .from("candidates")
      .select(
        `
        *,
        room:rooms!candidates_room_id_fkey ( room_name, pricing )
      `
      )
      .eq("interview_status", "completed"),
  ]);

  const { data, error } = candidateRes;
  if (error) return;

  const formatted = formatCandidateData(data, companyData, "completed");
  setBookings((prev: any) => ({ ...prev, completed: formatted }));
};

const fetchCancelled = async (supabase: any, setBookings: any) => {
  const [companyData, candidateRes] = await Promise.all([
    fetchCompanies(supabase),
    supabase
      .from("candidates")
      .select(
        `
        *,
        room:rooms!candidates_room_id_fkey ( room_name, pricing )
      `
      )
      .eq("interview_status", "cancelled"),
  ]);

  const { data, error } = candidateRes;
  if (error) return;

  const formatted = formatCandidateData(data, companyData, "cancelled");
  setBookings((prev: any) => ({ ...prev, cancelled: formatted }));
};

/* =======================
   Hoisted UI Pieces
   (stable component identity)
======================= */
const StatusChangeButtons = React.memo(
  ({
    booking,
    onStatusChange,
  }: {
    booking: any;
    onStatusChange: (b: any, s: string) => void;
  }) => {
    const { status } = booking;
    if (
      status === "upcoming" ||
      status === "checked-in" ||
      status === "in-progress"
    ) {
      return (
        <div className="flex gap-2">
          {status === "upcoming" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(booking, "checked-in")}
              className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
            >
              Check In
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange(booking, "completed")}
            className="text-green-600 border-green-300 hover:bg-green-50"
          >
            Complete
          </Button>
          {status === "upcoming" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(booking, "cancelled")}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Cancel
            </Button>
          )}
        </div>
      );
    }
    return null;
  }
);

const RecordingUploadButton = React.memo(
  ({
    booking,
    uploadRecording,
    supabaseReady,
    openPreview, // <---- Add here
  }: {
    booking: any;
    uploadRecording: (args: {
      booking: any;
      file: File;
      angle: "front" | "side";
    }) => Promise<void>;
    supabaseReady: boolean;
    openPreview: (recordings: { angle: string; url: string }[]) => void; // <---- And here in types
  }) => {
    if (booking.status !== "completed") return null;

    const [open, setOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const frontInputRef = React.useRef<HTMLInputElement>(null);
    const sideInputRef = React.useRef<HTMLInputElement>(null);

    const handlePick = (ref: React.RefObject<HTMLInputElement>) =>
      ref.current?.click();

    const onFile = async (file: File | null, angle: "front" | "side") => {
      if (!file) return; // user canceled file picker — keep dialog open
      try {
        setIsUploading(true);
        await uploadRecording({ booking, file, angle });
        // DO NOT close dialog — user may upload second angle
      } catch (e: any) {
        toast({
          title: "Upload failed",
          description: e?.message || "Please try again",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    };

    const frontUrl = booking.recordings?.find(
      (r: any) => r.angle === "front"
    )?.url;
    const sideUrl = booking.recordings?.find(
      (r: any) => r.angle === "side"
    )?.url;

    return (
      <>
        <Dialog
          open={open}
          onOpenChange={(next) => !isUploading && setOpen(next)}
        >
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={isUploading || !supabaseReady}
              className={
                booking.hasRecording
                  ? "text-green-600 border-green-300"
                  : "text-blue-600 border-blue-300"
              }
            >
              <Upload className="w-4 h-4 mr-1" />
              {booking.hasRecording ? "Manage Recording" : "Upload Recording"}
            </Button>
          </DialogTrigger>

          <DialogContent
            // prevent closing while uploading
            onPointerDownOutside={(e) => {
              if (isUploading) e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
              if (isUploading) e.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle>Interview Recording</DialogTitle>
            </DialogHeader>

            {/* Inline loading indicator (keeps dialog open) */}
            {isUploading && (
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3">
                <div className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-green-700">
                    Uploading… please don’t close this dialog box.
                  </p>
                </div>
              </div>
            )}

            <input
              ref={frontInputRef}
              type="file"
              accept="video/mp4"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] || null, "front")}
            />
            <input
              ref={sideInputRef}
              type="file"
              accept="video/mp4"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] || null, "side")}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium">Camera Angle 1</p>
                <p className="text-xs text-gray-500 mb-3">
                  Front view recording
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUploading}
                    onClick={() => handlePick(frontInputRef)}
                  >
                    {frontUrl ? "Replace File" : "Upload File"}
                  </Button>
                  {frontUrl && (
                    <Button
                      size="sm"
                      variant="ghost"

                    disabled={isUploading}
                      onClick={() => {
                        setOpen(false);
                        openPreview([{ angle: "front", url: frontUrl }]);
                      }}
                    >
                      View
                    </Button>
                  )}
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium">Camera Angle 2</p>
                <p className="text-xs text-gray-500 mb-3">
                  Side view recording
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUploading}
                    onClick={() => handlePick(sideInputRef)}
                  >
                    {sideUrl ? "Replace File" : "Upload File"}
                  </Button>
                  {sideUrl && (
                    <Button
                      size="sm"
                      variant="ghost"

                    disabled={isUploading}
                      onClick={() => {
                        setOpen(false);
                        openPreview([{ angle: "side", url: sideUrl }]);
                      }}
                    >
                      View
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                disabled={isUploading}
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

const BookingCard = React.memo(
  ({
    booking,
    getStatusColor,
    onStatusChange,
    uploadRecording,
    supabaseReady,
    openPreview, // accept this here
  }: {
    booking: any;
    getStatusColor: (s: string) => string;
    onStatusChange: (b: any, s: string) => void;
    uploadRecording: (args: {
      booking: any;
      file: File;
      angle: "front" | "side";
    }) => Promise<void>;
    supabaseReady: boolean;
    openPreview: (recordings: { angle: string; url: string }[]) => void; // <-- Add this line
  }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-semibold text-lg">{booking.room}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{booking.date}</span>
                <Clock className="w-4 h-4 ml-2" />
                <span>{booking.time}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{booking.candidate}</span>
              </div>
              <div>
                {booking.company && (
                  <span className="text-gray-600">from {booking.company}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-lg font-semibold text-green-600">
                ₹{booking.amount}
              </div>
              {booking.status === "completed" && (
                <div className="flex items-center gap-1 text-sm">
                  {booking.hasRecording ? (
                    <span className="text-green-600">
                      <Check className="w-4 h-4 inline mr-1" />
                      Recording Available
                    </span>
                  ) : (
                    <span className="text-orange-600">
                      <X className="w-4 h-4 inline mr-1" />
                      Recording Pending
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getStatusColor(booking.status)}>
              {booking.status === "in-progress" ? "Checked In" : booking.status}
            </Badge>
            <div className="flex gap-2">
              <StatusChangeButtons
                booking={booking}
                onStatusChange={onStatusChange}
              />
              <RecordingUploadButton
                booking={booking}
                uploadRecording={uploadRecording}
                supabaseReady={supabaseReady}
                openPreview={openPreview} // Pass it here
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
);

/* =======================
   Main Component
======================= */
const ProviderBookings = () => {
  const [bookings, setBookings] = useState({
    upcoming: [] as any[],
    checkedIn: [] as any[],
    completed: [] as any[],
    cancelled: [] as any[],
  });



  const [otpDialog, setOtpDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [otp, setOtp] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRecordings, setPreviewRecordings] = useState<
    { angle: string; url: string }[]
  >([]);

  const openPreview = (recordings: { angle: string; url: string }[]) => {
    setPreviewRecordings(recordings);
    setPreviewOpen(true);
  };

  const { supabase } = useSupabase();
  const didFetchRef = React.useRef(false);

 

  

  useEffect(() => {
    if (!supabase || didFetchRef.current) return;

    const fetchAllBookings = async () => {
      await Promise.all([
        fetchUpcoming(supabase, setBookings),
        fetchCheckedIn(supabase, setBookings),
        fetchCompleted(supabase, setBookings),
        fetchCancelled(supabase, setBookings),
      ]);
    };

    fetchAllBookings();
    didFetchRef.current = true;
  }, [supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const mapCheckInStatus = (status: string) => {
    switch (status) {
      case "upcoming":
        return "confirmed";
      case "in-progress":
        return "checked-in";
      case "completed":
        return "checked-in";
      case "cancelled":
        return "no show";
      default:
        return "confirmed";
    }
  };

  const updateBookingStatus = async (
    supabaseClient: any,
    bookingId: string,
    newStatus: string
  ) => {
    const newCheckInStatus = mapCheckInStatus(newStatus);
    await supabaseClient
      .from("candidates")
      .update({
        interview_status: newStatus,
        check_in_status: newCheckInStatus,
      })
      .eq("id", bookingId);

    setBookings((prev) => {
      const newSet = { ...prev };
      let moved: any = null;

      for (const key of Object.keys(newSet) as (keyof typeof newSet)[]) {
        const idx = (newSet[key] as any[]).findIndex(
          (b: any) => b.id === bookingId
        );
        if (idx !== -1) {
          moved = {
            ...(newSet[key] as any[])[idx],
            status: newStatus,
            check_in_status: newCheckInStatus,
          };
          (newSet[key] as any[]).splice(idx, 1);
          break;
        }
      }

      if (moved) {
        const targetKey =
          newStatus === "in-progress"
            ? "checkedIn"
            : newStatus === "completed"
            ? "completed"
            : newStatus === "cancelled"
            ? "cancelled"
            : "upcoming";
        (newSet as any)[targetKey].push(moved);
      }
      return newSet;
    });
  };

  const handleStatusChange = async (booking: any, newStatus: string) => {
    if (newStatus === "checked-in") {
      setSelectedBooking(booking);
      setOtp(""); // Clear OTP here to avoid old OTP showing up

      setOtpDialog(true);
    } else {
      await updateBookingStatus(supabase, booking.id, newStatus);
    }
  };

const handleOtpSubmit = async () => {
  if (!selectedBooking || otp.length !== 6) return;

  try {
    // -----------------------
    // Fetch Candidate Data
    // -----------------------
    const { data: candidateData, error: candidateError } = await supabase
      .from("candidates")
      .select(
        "otp, otp_expiry, company_user_id, room_id, email_address, interview_date, interview_time"
      )
      .eq("id", selectedBooking.id)
      .single();

    if (candidateError || !candidateData) {
      toast({
        title: "Error fetching OTP",
        description: "Could not verify OTP. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // -----------------------
    // Validate OTP
    // -----------------------
    const currentTime = new Date();
    const expiryTime = new Date(candidateData.otp_expiry);

    if (candidateData.otp !== otp) {
      toast({
        title: "Invalid OTP",
        description: "The OTP you entered is incorrect.",
        variant: "destructive",
      });
      return;
    }

    if (currentTime > expiryTime) {
      toast({
        title: "OTP Expired",
        description: "The OTP has expired. Please request a new one.",
        variant: "destructive",
      });
      return;
    }

    // -----------------------
    // Update Booking Status
    // -----------------------
    // updateBookingStatus(supabase, selectedBooking.id, "in-progress");

    // toast({
    //   title: "Check-In Successful",
    //   description: `Candidate ${selectedBooking.candidate} has been checked in.`,
    // });

    // -----------------------
    // Enterprise Email Flow
    // -----------------------
    const { data: enterprisePreferences } = await supabase
      .from("user_preferences")
      .select("candidate_checkins")
      .eq("user_id", candidateData.company_user_id)
      .single();

    if (enterprisePreferences?.candidate_checkins) {
      const { data: enterpriseProfile } = await supabase
        .from("user_profiles")
        .select("email")
        .eq("id", candidateData.company_user_id)
        .single();

      if (enterpriseProfile?.email) {
        const emailContent = CandidateCheckInConfirmation({
          candidateName: selectedBooking.candidate,
          roomName: "Interview Room", // fallback, real room fetched later
          interviewDate: candidateData.interview_date,
          interviewTime: candidateData.interview_time,
        });

        await fetch("https://nlrrjygzhhlrichlnswl.supabase.co/functions/v1/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: enterpriseProfile.email,
            subject: `Check-In Confirmation for ${selectedBooking.candidate}`,
            html: emailContent,
          }),
        });

        console.log("✅ Enterprise check-in confirmation email sent to:", enterpriseProfile.email);
      }
    }

    // -----------------------
    // Provider Email Flow
    // -----------------------
    const { data: roomData } = await supabase
      .from("rooms")
      .select("user_id, room_name")
      .eq("id", candidateData.room_id)
      .single();

    if (roomData) {
      const providerUserId = roomData.user_id;

      const { data: providerPreferences } = await supabase
        .from("user_preferences")
        .select("candidate_checkins")
        .eq("user_id", providerUserId)
        .single();

      if (providerPreferences?.candidate_checkins) {
        const { data: providerProfile } = await supabase
          .from("user_profiles")
          .select("email")
          .eq("id", providerUserId)
          .single();

        if (providerProfile?.email) {
          const emailContent = CandidateCheckInConfirmation({
            candidateName: selectedBooking.candidate,
            roomName: roomData.room_name,
            interviewDate: candidateData.interview_date,
            interviewTime: candidateData.interview_time,
          });

        await fetch("https://nlrrjygzhhlrichlnswl.supabase.co/functions/v1/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: providerProfile.email,
            subject: `Candidate Check-In: ${selectedBooking.candidate}`,
            html: emailContent,
          }),
        });
        
          console.log("✅ Provider check-in alert email sent to:", providerProfile.email);
        }
      }
    }

    // -----------------------
    // Reset Dialog + Form
    // -----------------------
    setOtpDialog(false);
    setOtp("");
    setSelectedBooking(null);

  } catch (err) {
    console.error("Unexpected error in OTP flow:", err);
    toast({
      title: "Error",
      description: "Something went wrong while processing the OTP.",
      variant: "destructive",
    });
  }
};








  /* Upload helpers that we pass down (unchanged behavior) */
  const signRecordingUrl = async ({
    candidateId,
    file,
    angle,
  }: {
    candidateId: string;
    file: File;
    angle: "front" | "side";
  }) => {
    const res = await fetch("/api/s3-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId,
        filename: file.name,
        filetype: file.type,
        size: file.size,
        angle,
      }),
    });
    if (!res.ok) {
      const msg = await res.json().catch(() => ({}));
      throw new Error(msg?.message || "Failed to sign recording URL");
    }
    return (await res.json()) as {
      uploadUrl: string;
      fileUrl: string;
      key: string;
      angle?: string | null;
    };
  };

  const putToS3 = async (uploadUrl: string, file: File) => {
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!put.ok) throw new Error("S3 upload failed");
  };

  // --- keep this OUTSIDE uploadRecording ---
const appendRecordingToCandidate = async (
  candidateId: string,
  rec: {
    angle: "front" | "side";
    url: string;
    key: string;
    size: number;
    type: string;
    uploaded_at: string;
  }
) => {
  // Fetch existing recordings
  const { data: current, error: fetchErr } = await supabase
    .from("candidates")
    .select("recording_files")
    .eq("id", candidateId)
    .single();

  if (fetchErr) throw new Error("Failed to fetch existing recordings");

  let currentArr: any[] = Array.isArray(current?.recording_files)
    ? current.recording_files
    : [];

  // If this angle already exists → delete old S3 object and replace
  const existing = currentArr.find((r) => r.angle === rec.angle);
  if (existing?.key) {
    try {
      await fetch("/api/s3-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: existing.key }),
      });
    } catch {
      // don't block the replace if delete fails — optional: surface a warning toast
    }
    currentArr = currentArr.filter((r) => r.angle !== rec.angle);
  }

  const newArr = [...currentArr, rec];

  const { error: updateErr } = await supabase
    .from("candidates")
    .update({
      recording_files: newArr,
      has_recording: newArr.length > 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId);

  if (updateErr) throw new Error("Failed to update candidate recordings");

  // Update local state (replace by angle)
  setBookings((prev) => {
    const next = { ...prev };
    for (const bucket of ["upcoming", "checkedIn", "completed", "cancelled"] as const) {
      const i = (next[bucket] as any[]).findIndex((b: any) => b.id === candidateId);
      if (i !== -1) {
        const copy = { ...(next[bucket] as any[])[i] };
        let recs = Array.isArray(copy.recordings) ? copy.recordings.slice() : [];
        recs = recs.filter((r) => r.angle !== rec.angle);
        recs.push(rec);
        copy.recordings = recs;
        copy.hasRecording = recs.length > 0;
        (next[bucket] as any[]) = [...(next[bucket] as any[])];
        (next[bucket] as any[])[i] = copy;
        break;
      }
    }
    return next;
  });
};


  const uploadRecording = async ({
  booking,
  file,
  angle,
}: {
  booking: any;
  file: File;
  angle: "front" | "side";
}) => {
  let signed:
    | { uploadUrl: string; fileUrl: string; key: string; angle?: string | null }
    | undefined;

  try {
    // 1) Sign URL
    signed = await signRecordingUrl({
      candidateId: booking.id,
      file,
      angle,
    });

    // 2) Upload file to S3
    await putToS3(signed.uploadUrl, file);

    // 3) Replace old recording (by angle) in Supabase + delete old S3 if present
    await appendRecordingToCandidate(booking.id, {
      angle,
      url: signed.fileUrl,
      key: signed.key,
      size: file.size,
      type: file.type,
      uploaded_at: new Date().toISOString(),
    });

    // 4) Success toast
    toast({
      title: "Recording uploaded",
      description: `${angle === "front" ? "Camera 1" : "Camera 2"} uploaded.`,
    });
  } catch (e: any) {
    // Optional rollback: if S3 upload succeeded but DB update failed, delete the new file
    if (signed?.key) {
      try {
        await fetch("/api/s3-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: signed.key }),
        });
      } catch {
        // swallow — we’re already failing the upload
      }
    }
    toast({
      title: "Upload failed",
      description: e?.message || "Please try again",
      variant: "destructive",
    });
    throw e;
  }
};


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">
            Upcoming ({bookings.upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="checked-in">
            Checked In ({bookings.checkedIn.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({bookings.completed.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({bookings.cancelled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {bookings.upcoming.length === 0 ? (
            <Card className="text-center p-12">
              <CardContent>
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No upcoming bookings
                </h3>
                <p className="text-gray-600">
                  Your upcoming interview bookings will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            bookings.upcoming.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                getStatusColor={getStatusColor}
                onStatusChange={handleStatusChange}
                uploadRecording={uploadRecording}
                supabaseReady={!!supabase}
                openPreview={openPreview}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="checked-in" className="mt-6">
          {bookings.checkedIn.length === 0 ? (
            <Card className="text-center p-12">
              <CardContent>
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No checked-in bookings
                </h3>
                <p className="text-gray-600">
                  Bookings that are currently in progress will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            bookings.checkedIn.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                getStatusColor={getStatusColor}
                onStatusChange={handleStatusChange}
                uploadRecording={uploadRecording}
                supabaseReady={!!supabase}
                openPreview={openPreview}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {bookings.completed.length === 0 ? (
            <Card className="text-center p-12">
              <CardContent>
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No completed bookings
                </h3>
                <p className="text-gray-600">
                  Your completed interview bookings will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            bookings.completed.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                getStatusColor={getStatusColor}
                onStatusChange={handleStatusChange}
                uploadRecording={uploadRecording}
                supabaseReady={!!supabase}
                openPreview={openPreview} // <-- add this
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          {bookings.cancelled.length === 0 ? (
            <Card className="text-center p-12">
              <CardContent>
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No cancelled bookings
                </h3>
                <p className="text-gray-600">
                  Your cancelled interview bookings will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            bookings.cancelled.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                getStatusColor={getStatusColor}
                onStatusChange={handleStatusChange}
                uploadRecording={uploadRecording}
                supabaseReady={!!supabase}
                openPreview={openPreview}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={otpDialog} onOpenChange={setOtpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter OTP to Check In</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please enter the OTP provided by the candidate to confirm
              check-in.
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                maxLength={6}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOtpDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleOtpSubmit} disabled={otp.length !== 6}>
                Confirm Check In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {previewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full relative shadow-lg">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setPreviewOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>

            {previewRecordings.length > 0 ? (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {previewRecordings.map((rec, index) => (
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
    </div>
  );
};

export default ProviderBookings;
