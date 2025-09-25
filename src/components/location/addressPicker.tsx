import React, { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

type LatLng = { lat: number; lng: number };
type AddressPickerProps = {
  location: LatLng | null;
  onLocationChange: (next: LatLng) => void;
  onPlaceMeta?: (meta: {
    place_id?: string;
    formatted_address?: string;
  }) => void;
  formattedAddress?: string;

  clearValidationError?: (field: string) => void;
  validationErrors?: Record<string, string>;
};

export default function AddressPicker({
  onLocationChange,
  onPlaceMeta,
  formattedAddress,
  clearValidationError,
  validationErrors = {},
}: AddressPickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputValueRef = useRef<string>(""); // optional tracker; not used to control the input

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  useEffect(() => {
    if (!inputRef.current || !(window as any).google?.maps?.places) return;

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ["geometry", "formatted_address", "place_id", "name"],
    });

    // Helper geocode (keeps your original logic)
    const geocodeBy = (req: google.maps.GeocoderRequest) =>
      new Promise<google.maps.GeocoderResult | null>((resolve) => {
        const g = new google.maps.Geocoder();
        g.geocode(req, (res, status) => {
          resolve(status === "OK" && res && res[0] ? res[0] : null);
        });
      });

    const onPlaceChanged = async () => {
      const place = ac.getPlace();
      if (!place) return;

      const formatted =
        place.formatted_address ?? place.name ?? inputRef.current?.value ?? "";

      // update local tracker and parent
      inputValueRef.current = formatted;
      if (inputRef.current) inputRef.current.value = formatted;

      onPlaceMeta?.({ place_id: place.place_id, formatted_address: formatted });

      if (clearValidationError && validationErrors["formatted_address"]) {
        clearValidationError("formatted_address");
      }

      // Ensure lat/lng
      let loc = place.geometry?.location ?? null;
      if (!loc && place.place_id) {
        const r = await geocodeBy({ placeId: place.place_id });
        loc = r?.geometry?.location ?? null;
      }
      if (!loc && formatted) {
        const r = await geocodeBy({ address: formatted });
        loc = r?.geometry?.location ?? null;
      }
      if (loc) onLocationChange({ lat: loc.lat(), lng: loc.lng() });
    };

    const listener = ac.addListener("place_changed", onPlaceChanged);

    return () => {
      // cleanup listener
      if (listener && typeof (listener as any).remove === "function") {
        (listener as any).remove();
      }
    };
  }, [onLocationChange, onPlaceMeta, clearValidationError, validationErrors]);

  // Keep inputRef in sync when parent provides formattedAddress
useEffect(() => {
  if (inputRef.current) {
    inputRef.current.value = formattedAddress || "";
    inputValueRef.current = formattedAddress || "";
  }
}, [formattedAddress]);



  // simple onChange that does not control the input value
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    inputValueRef.current = e.target.value;

    if (clearValidationError && validationErrors["formatted_address"]) {
      clearValidationError("formatted_address");
    }
  };

  return (
    <div className="space-y-3">
      <Input
       data-address-input
        ref={inputRef}
        placeholder="Search address or place"
        aria-label="Search address"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        enterKeyHint="done"
      />
    </div>
  );
}
