// Booking.tsx — updated to use media from DB (no Google API)
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Calendar, MapPin, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import BookingHeader from "@/components/BookingHeader";
import BookingFilters from "@/pages/Enterprise/Functionalities/BookingFilters";
import SpaceCard from "@/pages/SpaceProvider/SidebarPages/SpaceCard";
import BookingMap from "@/pages/Enterprise/Functionalities/BookingMap";
import { useSupabase } from "@/context/supabaseContext";
import { Outlet } from "react-router-dom";

import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";

type RoomType = "all" | "private" | "shared";

interface Filters {
  verifiedOnly: boolean;
  amenities: {
    camera: boolean;
    wifi: boolean;
    ac: boolean;
    reception: boolean;
    parking: boolean;
    elevator: boolean;
    drinkingwater: boolean;
    restroom: boolean;
    deskchair: boolean;
    naturallight: boolean;
    backuppower: boolean;
    webcammount: boolean;
    charging: boolean;
    verified2CameraSetup: boolean; // ← Add this
  };
  roomType: RoomType;
  priceRange: [number, number];
}

const defaultFilters: Filters = {
  verifiedOnly: false,
  amenities: {
    camera: false,
    wifi: false,
    ac: false,
    reception: false,
    parking: false,
    elevator: false,
    drinkingwater: false,
    restroom: false,
    deskchair: false,
    naturallight: false,
    backuppower: false,
    webcammount: false,
    charging: false,
    verified2CameraSetup: false,
  },
  roomType: "all",
  priceRange: [0, 10000],
};

interface Space {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  verified: boolean;
  type: string;
  amenities: string[];
  location: {
    lat: number;
    lng: number;
  };
  formatted_address?: string;
  pincode?: string;
  holidays?: string[];
  workingDays?: {
    [key: string]: boolean;
  };
  availability?: {
    timeRange: {
      start: string;
      end: string;
    };
  };
}

const Booking = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialLocation = searchParams.get("location") || "";
  const initialDate = searchParams.get("date") || null;

  const [space, setSpace] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialLocation);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);

  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const { supabase } = useSupabase();

  // keep the ref declaration above layout effects that use it
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    containerRef.current?.scrollTo({ left: 0 });
  }, []);

  useEffect(() => {
    containerRef.current?.scrollTo({ left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const fetchSpaces = async () => {
      if (!supabase) {
        console.error("Supabase client is not available.");
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("status", "approved");

      if (error) {
        console.error("Error fetching spaces:", error);
        setLoading(false);
        return;
      }

      if (!data) {
        setSpace([]);
        setLoading(false);
        return;
      }

      const mapped: Space[] = data.map((room: any) => {
        // parse media — accept either media (array objects) or media_urls (array of JSON strings)
        let parsedMedia: any[] = [];
        if (Array.isArray(room.media)) {
          parsedMedia = room.media;
        } else if (Array.isArray(room.media_urls)) {
          parsedMedia = room.media_urls
            .map((entry: any) => {
              try {
                if (typeof entry === "string") return JSON.parse(entry);
                if (typeof entry === "object") return entry;
                return null;
              } catch (e) {
                // fallback for plain URL strings
                return { url: String(entry) };
              }
            })
            .filter(Boolean);
        }

        // ✅ Only pick valid image URLs
        const firstImageUrl =
          parsedMedia.find(
            (m) =>
              typeof m?.url === "string" &&
              /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(m.url)
          )?.url ?? null;

        const roomAmenities = room?.amenities?.room ?? {};
        const generalAmenities = room?.amenities?.general ?? {};
        const allAmenities = { ...roomAmenities, ...generalAmenities };
        const amenities = Object.entries(allAmenities)
          .filter(([_, value]) => value === true)
          .map(([key]) => key);

        const lat = room?.location?.lat ?? room?.latitude ?? null;
        const lng = room?.location?.lng ?? room?.longitude ?? null;

        return {
          id: room?.id,
          name: room?.room_name,
          image: firstImageUrl || "/placeholder.svg", // ✅ use fallback only when necessary
          rating: room?.rating ?? 0,
          reviews: room?.reviews ?? 0,
          price: room?.pricing?.hourlyRate ?? 0,
          verified: room?.verified ?? false,
          type: room?.room_type,
          amenities,
          location: {
            lat,
            lng,
          },
          formatted_address: room?.formatted_address ?? "",
          pincode: room?.pincode ?? null,
          holidays: room?.holidays,
          availability: room?.availability,
        } as Space;
      });

      setSpace(mapped);
      setLoading(false);
    };

    fetchSpaces();
  }, [supabase]);

  const isAvailableOnDateTime = (
    room: any,
    selectedDate: string | null
  ): boolean => {
    if (!selectedDate) return true;

    const selectedDateObj = new Date(selectedDate);
    if (isNaN(selectedDateObj.getTime())) return false;

    const weekday = selectedDateObj
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    if (
      !room?.availability?.workingDays ||
      room?.availability?.workingDays[weekday] !== true
    ) {
      return false;
    }

    const selectedDateStr = selectedDateObj.toISOString().slice(0, 10);
    if (Array.isArray(room.holidays)) {
      const isHoliday = room.holidays.some(
        (holiday: string) => holiday.slice(0, 10) === selectedDateStr
      );
      if (isHoliday) return false;
    }

    const timeRange = room.availability?.timeRange;
    if (!timeRange || !timeRange.start || !timeRange.end) return false;

    const selectedTimeInMinutes =
      selectedDateObj.getHours() * 60 + selectedDateObj.getMinutes();

    const [startHour, startMinute] = timeRange.start.split(":").map(Number);
    const [endHour, endMinute] = timeRange.end.split(":").map(Number);

    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    if (
      selectedTimeInMinutes < startTimeInMinutes ||
      selectedTimeInMinutes > endTimeInMinutes
    ) {
      return false;
    }

    return true;
  };

  const filteredSpaces = space.filter((s) => {
    const matchesRoomType =
      filters.roomType === "all" || s.type === filters.roomType;

    const matchesPrice =
      s.price >= filters.priceRange[0] && s.price <= filters.priceRange[1];

    const selectedAmenities = Object.entries(filters.amenities)
      .filter(([_, val]) => val)
      .map(([key]) => key);

    const matchesAmenities = selectedAmenities.every((amenity) =>
      s.amenities?.includes(amenity)
    );

    const matchesSearch =
      searchQuery.trim() === "" ||
      s.formatted_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.pincode && s.pincode.includes(searchQuery.trim()));

    const matchesDateAndTime = isAvailableOnDateTime(s, selectedDate);

    // Also apply verifiedOnly filter
    const matchesVerified = filters.verifiedOnly ? s.verified === true : true;

    return (
      matchesRoomType &&
      matchesPrice &&
      matchesAmenities &&
      matchesSearch &&
      matchesDateAndTime &&
      matchesVerified
    );
  });

  // When filters/searchQuery/selectedDate/selectedSpace change, update URL params:
  useEffect(() => {
    const params: any = {};

    if (searchQuery.trim()) params.location = searchQuery.trim();
    if (selectedDate) params.date = selectedDate;
    if (filters.verifiedOnly) params.verifiedOnly = "true";
    if (filters.roomType !== "all") params.roomType = filters.roomType;
    if (filters.priceRange) params.priceRange = filters.priceRange.join("-");

    const selectedAmenities = Object.entries(filters.amenities)
      .filter(([_, val]) => val)
      .map(([key]) => key)
      .join(",");
    if (selectedAmenities.length > 0) params.amenities = selectedAmenities;

    if (selectedSpace) params.selectedSpace = selectedSpace;

    setSearchParams(params);
  }, [searchQuery, selectedDate, filters, selectedSpace, setSearchParams]);

  // On mount, parse URL params and prefill filters/searchQuery/selectedDate/selectedSpace
  useEffect(() => {
    const loc = searchParams.get("location") || "";
    setSearchQuery(loc);

    const dt = searchParams.get("date");
    setSelectedDate(dt);

    const verifiedOnly = searchParams.get("verifiedOnly") === "true";

    const roomType = (searchParams.get("roomType") as RoomType) || "all";

    const priceRangeParam = searchParams.get("priceRange") || "0-10000";
    const priceRange = priceRangeParam.split("-").map(Number) as [
      number,
      number
    ];

    const amenitiesParam = searchParams.get("amenities") || "";
    const amenityArr = amenitiesParam.split(",");

    const selected = searchParams.get("selectedSpace");
    setSelectedSpace(selected);

    setFilters({
      verifiedOnly,
      roomType,
      priceRange,
      amenities: {
        camera: amenityArr.includes("camera"),
        wifi: amenityArr.includes("wifi"),
        ac: amenityArr.includes("ac"),
        reception: amenityArr.includes("reception"),
        parking: amenityArr.includes("parking"),
        elevator: amenityArr.includes("elevator"),
        drinkingwater: amenityArr.includes("drinkingwater"),
        restroom: amenityArr.includes("restroom"),
        deskchair: amenityArr.includes("deskchair"),
        naturallight: amenityArr.includes("naturallight"),
        backuppower: amenityArr.includes("backuppower"),
        webcammount: amenityArr.includes("webcammount"),
        charging: amenityArr.includes("charging"),
        verified2CameraSetup: amenityArr.includes("verified2CameraSetup"),
      },
    });
  }, []); // Only on mount

  const now = new Date();
  const localISOString = now.toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingHeader step={1} />

      <div className="container mx-auto px-6 py-6">
        {/* Search Bar */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 items-center bg-white p-4 rounded-xl shadow-sm">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Enter candidate location or pin code"
              className="pl-10 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <Input
              type="datetime-local"
              className="h-12"
              value={selectedDate || ""}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={localISOString}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={filters.verifiedOnly}
              onCheckedChange={(checked) =>
                setFilters((prev) => ({ ...prev, verifiedOnly: checked }))
              }
            />
            <Label>Show only FaceDesk Verified</Label>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6 overflow-x-auto w-full" ref={containerRef}>
          {/* Filters Sidebar */}
          <div
            className={`transition-all duration-300 ${
              showFilters ? "w-80" : "w-0 overflow-hidden"
            }`}
          >
            <BookingFilters
              filters={filters}
              setFilters={setFilters}
              onToggle={() => setShowFilters(!showFilters)}
              onClearInputs={() => {
                setSearchQuery("");
                setSelectedDate(null);
                setSelectedSpace(null);
                setFilters(defaultFilters);
                setSearchParams({}); // optional: clears filters from URL
              }}
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 flex gap-6 min-w-[1000px]">
            {/* Results List */}
            <div className="w-full max-w-[550px] space-y-4">
              {loading ? (
                <div className="text-center text-gray-500 text-lg py-10">
                  Loading...
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      {filteredSpaces.length} spaces available
                    </h2>
                    {!showFilters && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowFilters(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Filter className="h-4 w-4" />
                        Filters
                      </Button>
                    )}
                  </div>

                  {/* Scrollable container for the space list */}
                  <div className="h-[680px] w-full overflow-y-auto pr-4 space-y-4">
                    {filteredSpaces.map((space) => (
                      <SpaceCard
                        key={space.id}
                        space={space}
                        isSelected={selectedSpace === space.id}
                        onSelect={() => setSelectedSpace(space.id)}
                        onHover={() => setSelectedSpace(space.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Map */}
            <div className="w-1/2">
              <BookingMap
                spaces={filteredSpaces}
                selectedSpace={selectedSpace}
                onSpaceSelect={setSelectedSpace}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
