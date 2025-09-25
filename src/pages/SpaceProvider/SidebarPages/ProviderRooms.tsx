import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
``;
import {
  Bed,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Wifi,
  Car,
  AirVent,
  Shield,
  Users,
  Building,
  GlassWater,
  Warehouse,
  Laptop,
  Sun,
  BatteryCharging,
  Camera,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSupabase } from "@/context/supabaseContext";
import { toast } from "react-toastify";
import { useUser } from "@clerk/clerk-react";

const ProviderRooms = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { supabase } = useSupabase();

  const [approvedRooms, setApprovedRooms] = useState<any[]>([]);
  const [draftRooms, setDraftRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [deleting, setDeleting] = useState(false);

const amenityIcons = {
  // Add this mapping for verified2CameraSetup
  verified2camerasetup: Shield, // normalized key
  camera: Shield, // keep existing mapping
  wifi: Wifi,
  ac: AirVent,
  reception: Users,
  parking: Car,
  elevator: Building,
  drinkingwater: GlassWater,
  restroom: Warehouse,
  deskchair: Laptop,
  naturallight: Sun,
  backuppower: BatteryCharging,
  webcammount: Camera,
  charging: Zap,
};

  // Helper to parse media entries (some are stringified JSON in your DB)
  const parseMediaArray = (raw: any) => {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((entry: any) => {
        if (!entry) return null;
        if (typeof entry === "string") {
          try {
            return JSON.parse(entry);
          } catch {
            return { url: String(entry) };
          }
        }
        if (typeof entry === "object") return entry;
        return { url: String(entry) };
      })
      .filter(Boolean);
  };

  const getImageMedia = (media: any[]) => {
    // Prioritize image URLs over video URLs
    const image = media.find(
      (item) =>
        item.url &&
        (item.url.match(/\.(jpeg|jpg|png)$/i) ||
          item.type === "image/jpeg" ||
          item.type === "image/png")
    );

    // If an image is found, return the image URL, else return a default placeholder or video logic
    if (image) return image.url;

    // If no image found, check for a video or fallback
    const video = media.find(
      (item) =>
        item.url &&
        (item.url.match(/\.(mp4|webm)$/i) ||
          item.type === "video/mp4" ||
          item.type === "video/webm")
    );

    // Return the video URL if available, or fallback to default image
    return video ? video.url : "/placeholder.svg";
  };

  useEffect(() => {
    // require user id to fetch
    if (!user?.id) {
      setApprovedRooms([]);
      setDraftRooms([]);
      setLoading(false);
      return;
    }

    const fetchRooms = async () => {
      setLoading(true);

      if (supabase) {
        const { data = [], error } = await supabase
          .from("rooms")
          .select("*")
          .eq("user_id", user.id)
          .in("status", ["approved", "draft"]);

        if (error) {
          console.error("Error fetching rooms:", error);
          toast.error("Failed to fetch rooms");
          setLoading(false);
          return;
        }

        // normalize media and set a preview image
        const normalized = (data || []).map((r: any) => {
          const media = r.media || parseMediaArray(r.media_urls);
          const image = getImageMedia(media);
          const first =
            Array.isArray(media) && media.length > 0 ? media[0] : null;
          return {
            ...r,
            media,
            image,
          };
        });

        setApprovedRooms(
          normalized.filter((room: any) => room.status === "approved")
        );
        setDraftRooms(
          normalized.filter((room: any) => room.status === "draft")
        );

        setLoading(false);
      }
    };

    fetchRooms();
  }, [user?.id, supabase]);

  const handleDelete = async (roomId: string) => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("rooms").delete().eq("id", roomId);

      if (error) {
        console.error("Failed to delete room:", error.message);
        toast.error("Failed to delete room");
        return;
      }

      toast.success("Room deleted successfully");

      // await new Promise((resolve) => setTimeout(resolve, 4500));

      setApprovedRooms((prev) => prev.filter((room) => room.id !== roomId));
      setDraftRooms((prev) => prev.filter((room) => room.id !== roomId));
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  const renderRoomCards = (rooms: any[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const allAmenities = {
            ...(room.amenities?.general || {}),
            ...(room.amenities?.room || {}),
          };
          console.log("DSFA", room);
          return (
            <Card key={room.id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={
                    room.image &&
                    (room.image.match(/\.(jpeg|jpg|png)$/i)
                      ? room.image
                      : "/placeholder.svg")
                  }
                  alt={room.room_name}
                  className="w-full h-48 object-cover"
                />
                <div
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: room.verified ? "#16a34a" : "#f97316",
                  }}
                >
                  {room.verified ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Clock className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{room.room_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{room.room_type}</Badge>
                      <Badge
                        variant={room.verified ? "default" : "secondary"}
                        className={
                          room.verified
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }
                      >
                        {room.verified ? "Verified" : "Pending Review"}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-xl font-bold">
                    ₹{room.pricing?.hourlyRate ?? "N/A"}/hour
                  </div>

                  <div className="flex items-center gap-2">
                    {Object.entries(allAmenities)
                      .filter(([_, value]) => value === true)
                      .map(([key]) => {
                        const normalizedKey = key.toLowerCase();
                        const Icon =
                          amenityIcons[
                            normalizedKey as keyof typeof amenityIcons
                          ];
                        return Icon ? (
                          <Icon key={key} className="w-4 h-4 text-gray-600" />
                        ) : null;
                      })}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/provider/edit-room/${room.id}`)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setDeleteRoomId(room.id);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
        <Button
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => navigate("/provider/add-room")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Room
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-gray-600">Loading rooms...</p>
      ) : approvedRooms.length === 0 && draftRooms.length === 0 ? (
        <Card className="text-center p-12">
          <CardContent>
            <Bed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No rooms listed yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start earning with FaceDesk by listing your first interview room!
            </p>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => navigate("/provider/add-room")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {approvedRooms.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                My Rooms
              </h2>
              {/* <-- call the renderer correctly */}
              {renderRoomCards(approvedRooms)}
            </div>
          )}

          {draftRooms.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">
                Rooms in Draft
              </h2>
              {renderRoomCards(draftRooms)}
            </div>
          )}
        </>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-md w-full max-w-sm relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteRoomId(null);
              }}
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Confirm Deletion
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this room? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteRoomId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={deleting}
                onClick={async () => {
                  if (deleteRoomId) {
                    await handleDelete(deleteRoomId);
                  } else {
                    toast.error("Please select a valid room");
                  }
                  setShowDeleteModal(false);
                  setDeleteRoomId(null);
                }}
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                      ></path>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderRooms;
