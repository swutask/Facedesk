// AddNewRoom.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useParams, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  ArrowLeft,
  Upload,
  MapPin,
  Clock,
  Wifi,
  Car,
  AirVent,
  Zap,
  Users,
  Building,
  CalendarX,
  Shield,
  GlassWater,
  Warehouse,
} from "lucide-react";
import { Laptop, Camera, Sun, BatteryCharging } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSupabase } from "@/context/supabaseContext";
import { useUser } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import * as yup from "yup";
import { roomSchema } from "@/validations/RoomsSchema";
import ProviderSidebar from "../Fixed/ProviderSidebar";
import AddressPicker from "@/components/location/addressPicker";
import NoWhitespaceInput from "@/components/ui/NowhitespaceInputt";

type MediaItem = {
  url: string;
  key?: string;
  name?: string;
  type?: string;
};

type StripeInfo = {
  stripe_account_id?: string;
  stripe_details_submitted?: boolean;
  onboarding_url?: string | null;
  login_url?: string | null;
  error?: string;
};

const initialFormData = {
  roomName: "",
  spaceName: "",
  roomType: "private",
  features: {
    enclosed: false,
    quiet: false,
    laptopAccess: false,
  },
  pricing: {
    hourlyRate: "",
    maxDuration: "4",
  },
  availability: {
    sameTimingsEveryday: false,
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
    timeRange: {
      start: "09:00",
      end: "18:00",
    },
  },
  media: [] as MediaItem[],
  amenities: {
    general: {
      wifi: false,
      ac: false,
      drinkingWater: false,
      elevator: false,
      restroom: false,
      parking: false,
      reception: false,
      verified2CameraSetup: false,
    },
    room: {
      deskChair: false,
      charging: false,
      webcamMount: false,
      naturalLight: false,
      backupPower: false,
    },
  },
};

const AddNewRoom = () => {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [fileUploading, setFileUploading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(
    null
  );

  const [validationErrors, setValidationErrors] = React.useState<
    Record<string, string>
  >({});

  const [stripeInfo, setStripeInfo] = useState<StripeInfo | null>(null);
  const [checkingStripe, setCheckingStripe] = useState<boolean>(true);

  const [formData, setFormData] = useState(initialFormData);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [placeMeta, setPlaceMeta] = useState<{
    place_id?: string;
    formatted_address?: string;
  }>({});

  const location2 = useLocation();

  const isAddMode = location2.pathname.startsWith("/provider/add-room");
  const isEditMode = location2.pathname.startsWith("/provider/edit-room");

  const { id } = useParams();
  useEffect(() => {
    if (isAddMode) {
      console.log("Resetting form for add mode...");
      setFormData(initialFormData);
      setLocation(null);
      setPlaceMeta({});
      setHolidays([]);
    }
  }, [isAddMode]);

  useEffect(() => {
    const checkStripe = async () => {
      // Only enforce on Add route
      if (!isAddMode) {
        setCheckingStripe(false);
        setLoading(false);
        return;
      }
      if (!user) {
        setCheckingStripe(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke(
          "ensure-connected-account",
          {
            body: {
              provider_user_id: user.id,
              provider_email:
                user.primaryEmailAddress?.emailAddress?.toLowerCase(),
            },
          }
        );
        if (error) {
          console.error("ensure-connected-account error:", error);
        }
        setStripeInfo((data as StripeInfo) ?? null);
      } catch (e) {
        console.error("Stripe check failed:", e);
        setStripeInfo(null);
      } finally {
        setCheckingStripe(false);
        setLoading(false);
      }
    };

    checkStripe();
  }, [isAddMode, user, supabase]);

  useEffect(() => {
    console.log("1");

    if (
      !id ||
      !supabase ||
      !location2.pathname.includes("/edit-room") ||
      fileUploading
    )
      return;

    console.log("2");
    if (id) {
      let isCancelled = false;

      const fetchRoomDetails = async () => {
        if (supabase) {
          const { data, error } = await supabase
            .from("rooms")
            .select("*")
            .eq("id", id)
            .single();

          if (isCancelled) return;

          if (error) {
            toast.error("Failed to fetch room details");
            return;
          }

          const parsedMedia: MediaItem[] = Array.isArray(data.media_urls)
            ? data.media_urls.map((entry: any) => {
                try {
                  return typeof entry === "string" ? JSON.parse(entry) : entry;
                } catch {
                  return { url: String(entry) };
                }
              })
            : [];

          setFormData((prev) => ({
            ...prev,
            roomName: data.room_name,
            spaceName: data.space_name,
            roomType: data.room_type,
            features: data.features,
            pricing: data.pricing,
            availability: data.availability,
            amenities: data.amenities,
            media: parsedMedia,
            formatted_address: data.formatted_address || "",
            holidays: data.holidays || [],
          }));

          setLocation(
            data.latitude && data.longitude
              ? { lat: data.latitude, lng: data.longitude }
              : data.location?.lat && data.location?.lng
              ? { lat: data.location.lat, lng: data.location.lng }
              : null
          );

          setPlaceMeta({
            place_id: data.place_id || "",
            formatted_address: data.formatted_address || "",
          });

          setHolidays(
            Array.isArray(data.holidays)
              ? data.holidays.map((d: string) => new Date(d))
              : []
          );
        }
      };

      fetchRoomDetails();
      return () => {
        isCancelled = true;
      };
    }
  }, [isEditMode, id]);

  const refreshStripeStatus = async () => {
    setLoading(true);
    if (!user) return;
    setCheckingStripe(true);
    try {
      const { data } = await supabase.functions.invoke(
        "ensure-connected-account",
        {
          body: {
            provider_user_id: user.id,
            provider_email:
              user.primaryEmailAddress?.emailAddress?.toLowerCase(),
          },
        }
      );
      setStripeInfo((data as StripeInfo) ?? null);
    } finally {
      setCheckingStripe(false);
      setLoading(false);
    }
  };

  // Upload handler — APPENDS to formData.media
  async function handleFileUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setFileUploading(true);
    const files = Array.from(fileList);

    setUploading(true);
    setUploadProgress(null);
    setUploadingFileName(null);

    try {
      const signRes = await fetch("/api/s3-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: files.map((f) => ({
            filename: f.name,
            filetype: f.type,
            size: f.size,
          })),
        }),
      });

      if (!signRes.ok) {
        const err = await signRes.text();
        throw new Error(`Failed to sign: ${err}`);
      }

      const { files: signed } = (await signRes.json()) as {
        files: {
          uploadUrl: string;
          fileUrl: string;
          key: string;
          filetype: string;
        }[];
      };

      const uploads = signed.map((s, i) => {
        setUploadingFileName(files[i].name);
        return fetch(s.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": files[i].type },
          body: files[i],
        }).then((r) => {
          if (!r.ok) throw new Error(`PUT failed: ${r.status}`);
          return {
            url: s.fileUrl,
            key: s.key,
            name: files[i].name,
            type: files[i].type,
          } as MediaItem;
        });
      });

      const settled = await Promise.allSettled(uploads);
      const okItems = settled
        .filter((x) => x.status === "fulfilled")
        .map((x: any) => x.value as MediaItem);

      if (okItems.length > 0) {
        setFormData((prev) => ({
          ...prev,
          media: [...(prev.media || []), ...okItems],
        }));
        toast.success(`${okItems.length} file(s) uploaded successfully`);
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadingFileName(null);
      setUploadProgress(null);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("File must be less than 20MB");
    } finally {
      setFileUploading(false);
      setUploading(false);
    }
  }

  // Your handleSubmit (no min/max), but safe against clobbering because all other updates are functional
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If we’re still checking Stripe, don’t allow submission yet
    if (isAddMode && (checkingStripe || !isStripeConnected)) {
      if (!checkingStripe) {
        toast.warn("Please connect your Stripe account before adding rooms.");
      }
      return;
    }

    setLoading(true);

    setValidationErrors({});

    if (formData.media.length < 3) {
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        media: "Please fill in all the fields with at least 3 files.",
      }));
      toast.error(
        "Please fill in all the required fields and at least 3 files."
      );
      setLoading(false);
      return;
    }

    if (Number(formData.pricing.hourlyRate) <= 50) {
      toast.error("Hourly rate must be greater than ₹50.");
      setLoading(false);
      return;
    }

    // ✅ Custom time validation block - START
    const { start, end } = formData.availability.timeRange;
    const maxDuration = Number(formData.pricing.maxDuration) || 1;

    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = parseTime(start);
    const endMinutes = parseTime(end);
    const timeDiff = endMinutes - startMinutes;

    if (timeDiff < 60) {
      setValidationErrors((prev) => ({
        ...prev,
        "availability.timeRange.start":
          "Start time should be less than Start time and must have at least 1 hour difference.",
        "availability.timeRange.end":
          "Start time should be less than Start time and must have at least 1 hour difference.",
      }));
      toast.error("Start time should be less than Start time and must have at least 1 hour difference.");
      setLoading(false);
      return;
    }

    if (timeDiff < maxDuration * 60) {
      setValidationErrors((prev) => ({
        ...prev,
        "availability.timeRange.start": `Time range must be at least ${maxDuration} hours.`,
        "availability.timeRange.end": `Time range must be at least ${maxDuration} hours.`,
      }));
      toast.error(`Time range must be at least ${maxDuration} hours.`);
      setLoading(false);
      return;
    }

    try {
      await roomSchema.validate(formData, {
        abortEarly: false,
        context: { placeMeta, location },
      });

      const {
        roomName,
        spaceName,
        roomType,
        features,
        pricing,
        availability,
        amenities,
      } = formData;

      const payload = {
        user_id: user?.id,
        room_name: roomName,
        space_name: spaceName,
        room_type: roomType,
        features,
        pricing,
        availability,
        holidays: holidays.map((date) => format(date, "yyyy-MM-dd")),
        amenities,
        latitude: location?.lat,
        longitude: location?.lng,
        place_id: placeMeta.place_id,
        formatted_address: placeMeta.formatted_address,
        location: location ? { lat: location.lat, lng: location.lng } : null,
        status: "approved",
        media_urls: formData.media.map((m) => JSON.stringify(m)),
      };

      let response;
      if (id) {
        response = await supabase.from("rooms").update(payload).eq("id", id);
      } else {
        response = await supabase.from("rooms").insert([payload]);
      }

      if (response.error) {
        toast.error(
          `${id ? "Update" : "Creation"} failed: ${response.error.message}`
        );
        return;
      }
      toast.success(`Room ${id ? "updated" : "added"} successfully!`);
      navigate("/provider/rooms");
    } catch (validationError) {
      if (validationError instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        validationError.inner.forEach((err) => {
          if (err.path && !errors[err.path]) {
            errors[err.path] = err.message;
          }
        });
        setValidationErrors(errors);

        // Show generic toast if any validation errors exist
        if (validationError.inner.length > 0) {
          toast.error("Please fill in all the required fields");
        }
      } else {
        console.error("Unexpected validation error", validationError);
        toast.error("Unexpected validation error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  //   const handleDeleteMedia = async (index: number) => {
  //   // Get the media item to delete
  //   const mediaToDelete = formData.media[index];

  //   // Remove the media item from the state
  //   setFormData((prev) => {
  //     const newMedia = [...prev.media];
  //     newMedia.splice(index, 1); // Remove the media at the given index
  //     return { ...prev, media: newMedia }; // Return updated formData with the new media list
  //   });

  //   // If the media item has an ID or key, delete it from the database
  //   if (mediaToDelete.key) {
  //     try {
  //       const { error } = await supabase
  //         .from("rooms")
  //         .update({
  //           media_urls: formData.media.filter((m) => m.key !== mediaToDelete.key),
  //         })
  //         .eq("id", id);

  //       if (error) {
  //         throw new Error("Failed to delete file from database");
  //       }
  //       // toast.success("File deleted successfully from database!");
  //     } catch (error) {
  //       console.error("Error deleting file from database:", error);
  //       toast.error("Failed to delete file from database.");
  //     }
  //   }
  // };

  const handleDeleteMedia = (index: number) => {
    setFormData((prev) => {
      const newMedia = [...prev.media];
      newMedia.splice(index, 1); // Remove the media at the given index
      return { ...prev, media: newMedia }; // Return updated formData with the new media list
    });
  };

  // Draft save
  const handleDraft = async () => {
    // Block adding a new room until Stripe is connected & onboarded
    if (isAddMode) {
      const connected = !!(
        stripeInfo?.stripe_account_id && stripeInfo?.stripe_details_submitted
      );
      if (!connected) {
        toast.warn("Please connect your Stripe account before adding rooms.");
        return;
      }
    }

    setLoading(true);

    

    try {
      const {
        roomName,
        spaceName,
        roomType,
        features,
        pricing,
        availability,
        amenities,
      } = formData;

      const payload = {
        user_id: user?.id,
        room_name: roomName,
        space_name: spaceName,
        room_type: roomType,
        features,
        pricing,
        availability,
        holidays: holidays.map((date) => format(date, "yyyy-MM-dd")),
        amenities,
        latitude: location?.lat,
        longitude: location?.lng,
        place_id: placeMeta.place_id,
        formatted_address: placeMeta.formatted_address ?? null,
        location: location ? { lat: location.lat, lng: location.lng } : null,
        status: "draft",
        media_urls: formData.media.map((m) => JSON.stringify(m)),
      };

      let response;
      if (id) {
        response = await supabase.from("rooms").update(payload).eq("id", id);
      } else {
        response = await supabase.from("rooms").insert([payload]);
      }

      if (response.error) {
        toast.error(
          `Draft ${id ? "update" : "save"} failed: ${response.error.message}`
        );
        return;
      }

      toast.success(`Room ${id ? "updated" : "saved"} as draft successfully!`);
      navigate("/provider/rooms");
    } catch (error) {
      console.error("Draft save failed", error);
      toast.error("Unexpected error saving draft.");
    } finally {
      setLoading(false);
    }
  };

  const handleHolidaySelect = (date: Date | undefined) => {
    if (!date) return;
    const normalized = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    setHolidays((prev) => {
      const exists = prev.some(
        (d) => d.toDateString() === normalized.toDateString()
      );
      return exists
        ? prev.filter((d) => d.toDateString() !== normalized.toDateString())
        : [...prev, normalized];
    });
  };

  const removeHoliday = (dateToRemove: Date) => {
    const normalized = new Date(
      dateToRemove.getFullYear(),
      dateToRemove.getMonth(),
      dateToRemove.getDate()
    );
    setHolidays((prev) =>
      prev.filter((d) => d.toDateString() !== normalized.toDateString())
    );
  };

  const amenityIcons = {
    wifi: Wifi,
    ac: AirVent,
    parking: Car,
    charging: Zap,
    webcamMount: Camera,
    reception: Users,
    elevator: Building,
    verified2CameraSetup: Shield,
    drinkingWater: GlassWater,
    restroom: Warehouse,
    deskChair: Laptop,
    naturalLight: Sun,
    backupPower: BatteryCharging,
  };

  const DAY_ORDER = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ] as const;

  // Helper to update nested objects by path (e.g., "pricing.hourlyRate")
  const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    let current = obj;

    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const newFormData = { ...prev };
      setNestedValue(newFormData, field, value);
      return newFormData;
    });

    if (value && validationErrors[field]) {
      setValidationErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const isStripeConnected = !!(
    stripeInfo?.stripe_account_id && stripeInfo?.stripe_details_submitted && stripeInfo?.card_payments !== 'inactive'
  );

  if (isAddMode && !checkingStripe && !isStripeConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <ProviderSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            sidebarOpen ? "ml-0" : "ml-16"
          }`}
        >
          <div className="max-w-2xl mx-auto px-6 py-16">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Connect Stripe to add rooms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  You need to connect your Stripe account to receive payouts.
                  Please complete the Stripe setup, then come back to add your
                  room.
                </p>

                <div className="flex flex-wrap gap-3">
                  {stripeInfo?.onboarding_url ? (
                    <Button asChild>
                      <a href={stripeInfo.onboarding_url}>
                        Complete Stripe Setup
                      </a>
                    </Button>
                  ) : (
                    <Button asChild>
                      <a href="/provider/earnings">Open Payouts</a>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={refreshStripeStatus}
                    disabled={checkingStripe}
                  >
                    {checkingStripe
                      ? "Checking…"
                      : "I’ve finished, refresh status"}
                  </Button>
                </div>

                {stripeInfo?.error && (
                  <p className="text-sm text-red-600">{stripeInfo.error}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  
if (loading) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="h-12 w-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      <span className="ml-4 text-white text-lg">Processing...</span>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Loader Overlay */}

      <ProviderSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "ml-0" : "ml-16"
        }`}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-full mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="ps-[350px]">
                <h1 className="text-2xl font-bold text-gray-900">
                  {id ? "Update This Room" : "Add New Room"}
                </h1>
                <p className="text-gray-600">
                  {id
                    ? "Edit the details of your listed space"
                    : "List your interview-ready space on FaceDesk"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/provider")}
                className="flex items-center flex-end gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const target = e.target as HTMLElement;
                const fromAddressInput = !!target.closest(
                  "[data-address-input]"
                );
                // Detect if Google's suggestion popup is visible
                const pac = document.querySelector(
                  ".pac-container"
                ) as HTMLElement | null;
                const pacOpen =
                  !!pac &&
                  pac.offsetParent !== null &&
                  getComputedStyle(pac).visibility !== "hidden";
                if (fromAddressInput || pacOpen) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }
            }}
            noValidate
            className="space-y-8"
          >
            {/* Basic Room Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Basic Room Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="roomName">Room Name *</Label>
                    <NoWhitespaceInput
                      id="roomName"
                      placeholder="e.g., Interview Cabin B"
                      value={formData.roomName}
                      onChange={(e) =>
                        handleInputChange("roomName", e.target.value)
                      }
                    />

                    {validationErrors["roomName"] && (
                      <p className="text-red-600 text-sm mt-1">
                        {validationErrors["roomName"]}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spaceName">Co-working Space Name *</Label>
                    <NoWhitespaceInput
                      id="spaceName"
                      placeholder="Your space name"
                      value={formData.spaceName}
                      onChange={(e) =>
                        handleInputChange("spaceName", e.target.value)
                      }
                    />
                    {validationErrors["spaceName"] && (
                      <p className="text-red-600 text-sm mt-1">
                        {validationErrors["spaceName"]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Full Address *
                  </Label>
                  <AddressPicker
                    location={location}
                    onLocationChange={setLocation}
                    onPlaceMeta={setPlaceMeta}
                    formattedAddress={placeMeta.formatted_address}
                    validationErrors={validationErrors}
                    clearValidationError={(field) =>
                      setValidationErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors[field];
                        return newErrors;
                      })
                    }
                  />

                  {validationErrors["formatted_address"] && (
                    <p className="text-red-600 text-sm mt-1">
                      {validationErrors["formatted_address"]}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Room Type */}
            <Card>
              <CardHeader>
                <CardTitle>Room Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup
                  value={formData.roomType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, roomType: value }))
                  }
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private">Private Room</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="shared" id="shared" />
                    <Label htmlFor="shared">Shared Room</Label>
                  </div>
                </RadioGroup>

                <div className="space-y-4">
                  <Label>Room Features</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enclosed"
                        checked={formData.features.enclosed}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            features: {
                              ...prev.features,
                              enclosed: checked as boolean,
                            },
                          }))
                        }
                      />
                      <Label htmlFor="enclosed">Enclosed space</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="quiet"
                        checked={formData.features.quiet}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            features: {
                              ...prev.features,
                              quiet: checked as boolean,
                            },
                          }))
                        }
                      />
                      <Label htmlFor="quiet">
                        Quiet or low-noise environment
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="laptopAccess"
                        checked={formData.features.laptopAccess}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            features: {
                              ...prev.features,
                              laptopAccess: checked as boolean,
                            },
                          }))
                        }
                      />
                      <Label htmlFor="laptopAccess">
                        Candidate has access to laptop/tablet if needed
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate (₹) *</Label>
                    <NoWhitespaceInput
                      id="hourlyRate"
                      type="number"
                      placeholder="800"
                      min="0"
                      value={formData.pricing.hourlyRate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pricing: {
                            ...prev.pricing,
                            hourlyRate: e.target.value,
                          },
                        }))
                      }
                      onKeyPress={(e) => {
                        if (e.key === "-") e.preventDefault();
                      }}
                    />

                    {validationErrors["pricing.hourlyRate"] && (
                      <p className="text-red-600 text-sm mt-1">
                        {validationErrors["pricing.hourlyRate"]}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDuration">
                      Max booking duration per session
                    </Label>
                    <Select
                      value={formData.pricing.maxDuration}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          pricing: { ...prev.pricing, maxDuration: value },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="2">2 hours</SelectItem>
                        <SelectItem value="3">3 hours</SelectItem>
                        <SelectItem value="4">4 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Working Days *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {DAY_ORDER.map((day) => {
                      const checked = formData.availability.workingDays[day];
                      return (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={day}
                            checked={checked}
                            onCheckedChange={(isChecked) =>
                              setFormData((prev) => ({
                                ...prev,
                                availability: {
                                  ...prev.availability,
                                  workingDays: {
                                    ...prev.availability.workingDays,
                                    [day]: isChecked as boolean,
                                  },
                                },
                              }))
                            }
                          />
                          <Label htmlFor={day} className="capitalize">
                            {day.slice(0, 3)}
                          </Label>
                        </div>
                      );
                    })}
                  </div>

                  {/* ✅ Error message here */}
                  {validationErrors["availability.workingDays"] && (
                    <p className="text-red-600 text-sm mt-1">
                      {validationErrors["availability.workingDays"]}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 w-full">
                    <Label htmlFor="startTime">Start & End Time *</Label>
                    <div className="flex space-x-4">
                      <div className="flex flex-col w-full">
                        <NoWhitespaceInput
                          id="startTime"
                          type="time"
                          value={formData.availability.timeRange.start}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              availability: {
                                ...prev.availability,
                                timeRange: {
                                  ...prev.availability.timeRange,
                                  start: e.target.value,
                                },
                              },
                            }))
                          }
                        />
                        {validationErrors["availability.timeRange.start"] && (
                          <p className="text-red-500 text-sm">
                            {validationErrors["availability.timeRange.start"]}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col w-full">
                        <NoWhitespaceInput
                          id="endTime"
                          type="time"
                          value={formData.availability.timeRange.end}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              availability: {
                                ...prev.availability,
                                timeRange: {
                                  ...prev.availability.timeRange,
                                  end: e.target.value,
                                },
                              },
                            }))
                          }
                        />
                        {validationErrors["availability.timeRange.end"] && (
                          <p className="text-red-500 text-sm">
                            {validationErrors["availability.timeRange.end"]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Holiday Exceptions */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <CalendarX className="w-4 h-4" />
                    Holiday Exceptions
                  </Label>
                  <p className="text-sm text-gray-600">
                    Select dates when your space will be closed
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[240px] justify-start text-left font-normal"
                        >
                          <CalendarX className="mr-2 h-4 w-4" />
                          Add Holiday
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={undefined}
                          onSelect={handleHolidaySelect}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {holidays.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm">Selected Holidays:</Label>
                      <div className="flex flex-wrap gap-2">
                        {holidays.map((holiday, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm"
                          >
                            <span>{format(holiday, "MMM dd, yyyy")}</span>
                            <button
                              type="button"
                              onClick={() => removeHoliday(holiday)}
                              className="text-red-500 hover:text-red-700 ml-1"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}

            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">
                    General Amenities
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                    {Object.entries(formData.amenities.general).map(
                      ([key, checked]) => {
                        const IconComponent =
                          amenityIcons[key as keyof typeof amenityIcons] ||
                          Building;
                        return (
                          <div
                            key={key}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`general-${key}`}
                              checked={checked}
                              onCheckedChange={(isChecked) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  amenities: {
                                    ...prev.amenities,
                                    general: {
                                      ...prev.amenities.general,
                                      [key]: isChecked as boolean,
                                    },
                                  },
                                }))
                              }
                            />
                            <Label
                              htmlFor={`general-${key}`}
                              className="flex items-center gap-2 capitalize"
                            >
                              <IconComponent className="w-4 h-4" />
                              {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                            </Label>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">
                    Room Amenities
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                    {Object.entries(formData.amenities.room).map(
                      ([key, checked]) => {
                        const IconComponent =
                          amenityIcons[key as keyof typeof amenityIcons] ||
                          Building;
                        return (
                          <div
                            key={key}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`room-${key}`}
                              checked={checked}
                              onCheckedChange={(isChecked) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  amenities: {
                                    ...prev.amenities,
                                    room: {
                                      ...prev.amenities.room,
                                      [key]: isChecked as boolean,
                                    },
                                  },
                                }))
                              }
                            />
                            <Label
                              htmlFor={`room-${key}`}
                              className="flex items-center gap-2 capitalize"
                            >
                              <IconComponent className="w-4 h-4" />
                              {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                            </Label>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Photos of Your Space
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Minimum 3-5 images required. Camera angle photos for
                  verification will be asked separately.
                </p>
              </CardHeader>
              <CardContent>
                <div
                  className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition"
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  aria-busy={uploading}
                >
                  {uploading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                      <span className="ml-3 text-sm text-gray-700">
                        {uploadingFileName
                          ? `Uploading ${uploadingFileName}…`
                          : "Uploading…"}
                      </span>
                    </div>
                  )}

                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Drag & drop your photos here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Include: Room interior, Building entrance, Common areas,
                    Amenities
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    multiple
                    accept="image/jpeg,image/png,video/mp4"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileUpload(e.target.files);
                      }
                    }}
                    disabled={uploading}
                  />

                  {uploadProgress !== null && uploadingFileName && (
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <div className="w-40 bg-gray-200 rounded overflow-hidden">
                        <div
                          style={{ width: `${uploadProgress}%` }}
                          className="h-2 bg-blue-600"
                        />
                      </div>
                      <span className="text-xs text-gray-700">
                        {uploadingFileName} — {Math.round(uploadProgress)}%
                      </span>
                    </div>
                  )}

                  {(formData.media?.length ?? 0) > 0 && (
                    <div className="mt-6">
                      <Label className="mb-2 block">
                        Uploaded files ({formData.media.length})
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {formData.media.map((m, idx) => {
                          const isVideo = (m.type ?? "").startsWith("video/");
                          const isImage = (m.type ?? "").startsWith("image/");
                          return (
                            <div
                              key={m.url + idx}
                              className="relative group border rounded-lg overflow-hidden bg-white cursor-pointer"
                              onClick={(e) => {
                                const el = e.target as HTMLElement;
                                if (el.closest("button")) return;
                                if (el.closest("video")) return;
                                window.open(
                                  m.url,
                                  "_blank",
                                  "noopener,noreferrer"
                                );
                              }}
                              title="Open in new tab"
                            >
                              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                {isImage ? (
                                  <img
                                    src={m.url}
                                    alt={m.name || "uploaded image"}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : isVideo ? (
                                  <video
                                    src={m.url}
                                    controls
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="p-4 text-xs text-gray-600 break-all text-center">
                                    {m.name || m.url}
                                  </div>
                                )}
                              </div>

                              <div className="p-2 text-xs text-gray-700 truncate">
                                {m.name || m.url}
                              </div>

                              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                <button
                                  type="button"
                                  className="text-white bg-red-600 hover:bg-red-700 rounded px-2 py-1 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMedia(idx);
                                  }}
                                  title="Remove from this listing"
                                >
                                  Remove
                                </button>
                                <button
                                  type="button"
                                  className="text-white bg-gray-800 hover:bg-gray-900 rounded px-2 py-1 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(m.url);
                                    toast.success("URL copied to clipboard!");
                                  }}
                                  title="Copy URL"
                                >
                                  Copy URL
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Actions */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-8"
                disabled={
                  loading ||
                  uploading ||
                  (isAddMode && (!isStripeConnected || checkingStripe))
                }
              >
                {id ? "Update Room" : "Add Room"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleDraft}
                disabled={
                  loading ||
                  uploading ||
                  (isAddMode && (!isStripeConnected || checkingStripe))
                }
              >
                Save as Draft
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddNewRoom;
