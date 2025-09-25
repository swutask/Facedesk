import {
  Star,
  MapPin,
  Wifi,
  Car,
  AirVent,
  Users,
  Shield,
  Building,
  GlassWater,
  Warehouse,
  Laptop,
  Sun,
  BatteryCharging,
  Camera,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface SpaceCardProps {
  space: {
    id: string; // <-- was number; now string (UUID)
    name: string;
    image: string;
    rating: number;
    reviews: number;
    price: number;
    verified: boolean;
    type: string;
    // badges: string[];
    amenities: string[]; // Combined room and general amenities
    location: { lat: number; lng: number };
    formatted_address?: string;
  };
  isSelected: boolean;
  onSelect: () => void;
  onHover: () => void;
}

const SpaceCard = ({
  space,
  isSelected,
  onSelect,
  onHover,
}: SpaceCardProps) => {
  const navigate = useNavigate();

  const amenityIcons = {
    camera: Camera,
    wifi: Wifi,
    ac: AirVent,
    reception: Users,
    parking: Car,
    elevator: Building,
    drinkingWater: GlassWater,
    restroom: Warehouse,
    deskChair: Laptop,
    naturalLight: Sun,
    backupPower: BatteryCharging,
    webcamMount: Camera,
    charging: Zap,
    verified2CameraSetup: Shield,
  };
  
const handleBookClick = (e: React.MouseEvent) => {
  e.stopPropagation();
  // Append current search params to navigation so it can be restored later
  navigate({
    pathname: "/enterprise/payment/" + space.id,
    search: window.location.search, // or use searchParams.toString()
  });
};


  const shortAddress = space?.formatted_address
    ? space.formatted_address.length > 28
      ? `${space.formatted_address.slice(0, 28)}…`
      : space.formatted_address
    : "Unknown location";

  return (
    <Card
      className={`w-full cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? "ring-2 ring-blue-500 shadow-lg" : ""
      }`}
      onClick={onSelect}
      onMouseEnter={onHover}
      onFocus={onHover} // keyboard focus highlights on map too
      tabIndex={0} // make the card focusable for accessibility
      role="button"
      aria-pressed={isSelected}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image */}
          <div className="relative">
            <img
              src={space.image || "/placeholder.svg"}
              alt={space.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
              className="w-20 h-20 rounded-lg object-cover"
            />

            {space.verified && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{space.name}</h3>
                {space.reviews > 0 ? (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{space.rating.toFixed(1)}</span>
                    <span className="text-gray-500">
                      ({space.reviews} reviews)
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">No reviews yet</span>
                )}
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">₹{space.price}</div>
                <div className="text-sm text-gray-600">per hour</div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1">
              {/* {space.badges.map((badge) => (
                <Badge
                  key={badge}
                  variant={badge === "Verified Setup" ? "default" : "secondary"}
                  className={
                    badge === "Popular" ? "bg-orange-100 text-orange-800" : ""
                  }
                >
                  {badge}
                </Badge>
              ))} */}
              <Badge variant="outline" className="capitalize">
                {space.type}
              </Badge>
            </div>

            {/* Amenities */}
            <div className="flex flex-wrap gap-2">
              {(space.amenities || []).map((amenity) => {
                const Icon = amenityIcons[amenity as keyof typeof amenityIcons];
                return Icon ? (
                  <div
                    key={amenity}
                    className="flex items-center gap-1 text-xs text-gray-600"
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                ) : null;
              })}
            </div>

            {/* Location & Book Button */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 text-sm text-gray-600 max-w-[65%]">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{shortAddress}</span>
              </div>
              <Button
                size="sm"
                onClick={handleBookClick}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpaceCard;
