import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  Marker, // <-- fallback
  useMap,
} from "@vis.gl/react-google-maps";

type Space = {
  id: string;
  name: string;
  price: number;
  location: { lat: number; lng: number };
};

interface BookingMapProps {
  spaces: Space[];
  selectedSpace: string | null;
  onSpaceSelect: (id: string) => void;
}

const DEFAULT_CENTER = { lat: 22.9734, lng: 78.6569 }; // India fallback

function FitBoundsOnSpaces({ spaces }: { spaces: Space[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || spaces.length === 0 || !(window as any).google?.maps) return;

    const bounds = new google.maps.LatLngBounds();
    const valid = spaces.filter(
      (s) =>
        typeof s.location?.lat === "number" &&
        typeof s.location?.lng === "number" &&
        !Number.isNaN(s.location.lat) &&
        !Number.isNaN(s.location.lng)
    );
    if (valid.length === 0) return;

    valid.forEach((s) => bounds.extend(s.location));
    map.fitBounds(bounds, 64);
  }, [map, spaces]);

  return null;
}

export default function BookingMap({
  spaces,
  selectedSpace,
  onSpaceSelect,
}: BookingMapProps) {
  const [infoOpenFor, setInfoOpenFor] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedSpace && spaces.length > 0) setInfoOpenFor(spaces[0].id);
  }, [selectedSpace, spaces]);

  const mapKey = useMemo(() => spaces.map((s) => s.id).join("|"), [spaces]);

  // Detect Advanced Markers availability
  const hasAdvancedMarkers =
    typeof window !== "undefined" &&
    !!(window as any).google?.maps?.marker?.AdvancedMarkerElement;

  return (
    <Card className="h-[600px] relative overflow-hidden">
      <Map
        key={mapKey}
        defaultZoom={5}
        defaultCenter={DEFAULT_CENTER}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapId={import.meta.env.VITE_GOOGLE_MAP_ID } // <-- supply your Map ID
        style={{ width: "100%", height: "100%" }}
      >
        <FitBoundsOnSpaces spaces={spaces} />

        {spaces.map((s) => {
          {
            console.log("s.id", s.id);
          }
          const isSelected = selectedSpace === s.id;

          // Fallback old Marker if advanced markers not available
          if (!hasAdvancedMarkers) {
            return (
              <Marker
                key={s.id}
                position={s.location}
                onClick={() => {
                  onSpaceSelect(s.id);
                  setInfoOpenFor(s.id);
                }}
                // optional label or icon config here
              >
                {infoOpenFor === s.id && (
                  <InfoWindow
                    position={s.location}
                    onCloseClick={() => setInfoOpenFor(null)}
                  >
                    <div className="text-sm">
                      <div className="font-semibold">{s.name}</div>
                      <div>₹{s.price}/hr</div>
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            );
          }

          // Preferred path: AdvancedMarker with custom DOM
          return (
            <AdvancedMarker
              key={s.id}
              position={s.location}
              onClick={() => {
                onSpaceSelect(s.id);
                setInfoOpenFor(s.id);
              }}
            >
              <button
                type="button"
                className={[
                  "relative -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg border",
                  "w-8 h-8 flex items-center justify-center",
                  isSelected
                    ? "bg-blue-600 border-blue-700 text-white scale-110"
                    : "bg-white border-blue-600 text-blue-600",
                ].join(" ")}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                  <path
                    d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
                    fill="currentColor"
                  />
                </svg>
                <span
                  className={[
                    "absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap",
                    "px-2 py-0.5 rounded text-xs font-medium",
                    isSelected
                      ? "bg-gray-900 text-white opacity-100"
                      : "bg-gray-900/90 text-white opacity-0",
                  ].join(" ")}
                >
                  ₹{s.price}/hr
                </span>
              </button>

              {infoOpenFor === s.id && (
                <InfoWindow
                  position={s.location}
                  onCloseClick={() => setInfoOpenFor(null)}
                >
                  <div className="text-sm">
                    <div className="font-semibold">{s.name}</div>
                    <div>₹{s.price}/hr</div>
                  </div>
                </InfoWindow>
              )}
            </AdvancedMarker>
          );
        })}
      </Map>

      <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
        Google Maps
      </div>
    </Card>
  );
}
