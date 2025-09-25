import {
  ChevronDown,
  ChevronUp,
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";

interface BookingFiltersProps {
  filters: any;
  setFilters: (filters: any) => void;
  onToggle: () => void;
  onClearInputs?: () => void; // 
}

const BookingFilters = ({
  filters,
  setFilters,
  onToggle,
  onClearInputs,
}: BookingFiltersProps) => {
  const [expandedSections, setExpandedSections] = useState({
    amenities: true,
    roomType: true,
    price: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  const handleClearFilters = () => {
    setFilters({
      verifiedOnly: true,
      amenities: {
        verified2CameraSetup: false,
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
      },
      roomType: "all",
      priceRange: [0, 10000],
    });

  onClearInputs?.();
};


 const amenityIcons = {
   verified2CameraSetup: Shield,
  
   wifi: Wifi,
   ac: AirVent,
   reception: Users,
   parking: Car,
   elevator: Building,
   drinkingWater: GlassWater, // ✅ fixed key
   restroom: Warehouse,
   deskChair: Laptop,
   naturalLight: Sun,
   backupPower: BatteryCharging,
   webcamMount: Camera,
   charging: Zap,
 };

  const amenityLabels = {
    verified2CameraSetup: "Verified 2-Camera Setup",
    wifi: "Wi-Fi",
    ac: "Air Conditioning",
    reception: "Reception",
    parking: "Parking",
    elevator: "Elevator",
    drinkingWater: "Drinking Water", // ✅ fixed key
    restroom: "Restroom",
    deskChair: "Desk & Chair",
    naturalLight: "Natural Light",
    backupPower: "Backup Power",
    webcamMount: "Webcam Mount",
    charging: "Charging",
  };


  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="lg:hidden"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Amenities */}
        <div>
          <div
            className="flex items-center justify-between cursor-pointer mb-3"
            onClick={() => toggleSection("amenities")}
          >
            <Label className="text-base font-medium">Amenities</Label>
            {expandedSections.amenities ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>

          {expandedSections.amenities && (
            <div className="space-y-3">
              {Object.entries(amenityLabels).map(([key, label]) => {
                const Icon = amenityIcons[key as keyof typeof amenityIcons];
                return (
                  <div key={key} className="flex items-center space-x-3">
                    <Checkbox
                      id={key}
                      checked={filters.amenities[key]}
                      onCheckedChange={(checked) =>
                        setFilters((prev: any) => ({
                          ...prev,
                          amenities: { ...prev.amenities, [key]: checked },
                        }))
                      }
                    />
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-500" />
                      <Label htmlFor={key} className="text-sm cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Room Type */}
        <div>
          <div
            className="flex items-center justify-between cursor-pointer mb-3"
            onClick={() => toggleSection("roomType")}
          >
            <Label className="text-base font-medium">Room Type</Label>
            {expandedSections.roomType ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>

          {expandedSections.roomType && (
            <RadioGroup
              value={filters.roomType}
              onValueChange={(value) =>
                setFilters((prev: any) => ({ ...prev, roomType: value }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="text-sm cursor-pointer">
                  All Types
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="text-sm cursor-pointer">
                  Private Room
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="shared" id="shared" />
                <Label htmlFor="shared" className="text-sm cursor-pointer">
                  Shared Room
                </Label>
              </div>
            </RadioGroup>
          )}
        </div>

        {/* Price Range */}
        <div>
          <div
            className="flex items-center justify-between cursor-pointer mb-3"
            onClick={() => toggleSection("price")}
          >
            <Label className="text-base font-medium">Price Range</Label>
            {expandedSections.price ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>

          {expandedSections.price && (
            <div className="space-y-4">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) =>
                  setFilters((prev: any) => ({ ...prev, priceRange: value }))
                }
                max={10000}
                min={0}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>₹{filters.priceRange[0]}</span>
                <span>₹{filters.priceRange[1]}</span>
              </div>
            </div>
          )}
        </div>

        {/* Clear Filters */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleClearFilters}
        >
          Clear All Filters
        </Button>
      </CardContent>
    </Card>
  );
};

export default BookingFilters;
