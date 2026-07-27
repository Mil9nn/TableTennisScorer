import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { useLocationPickerStore } from "@/hooks/useLocationPickerStore";
import type { PickedCity, PickedVenue } from "@/lib/location/types";

type UseLocationSelectionOptions = {
  /** When city changes, automatically clear the selected venue. Default true. */
  clearVenueOnCityChange?: boolean;
};

/**
 * Shared city/venue selection for create forms.
 * Opens full-screen pickers and applies results when the form regains focus.
 */
export function useLocationSelection(options: UseLocationSelectionOptions = {}) {
  const { clearVenueOnCityChange = true } = options;
  const router = useRouter();
  const consumeCityResult = useLocationPickerStore((s) => s.consumeCityResult);
  const consumeVenueResult = useLocationPickerStore((s) => s.consumeVenueResult);

  const [city, setCity] = useState<PickedCity | null>(null);
  const [venue, setVenue] = useState<PickedVenue | null>(null);
  const cityRef = useRef<PickedCity | null>(null);
  cityRef.current = city;

  useFocusEffect(
    useCallback(() => {
      const nextCity = consumeCityResult();
      if (nextCity) {
        setCity(nextCity);
        if (clearVenueOnCityChange) {
          setVenue(null);
        }
      }
      const nextVenue = consumeVenueResult();
      if (nextVenue) {
        setVenue(nextVenue);
        const current = cityRef.current;
        if (!current || current._id !== nextVenue.cityId) {
          setCity({
            _id: nextVenue.cityId,
            name: nextVenue.city,
            state: nextVenue.state,
            stateCode: nextVenue.stateCode,
            label: `${nextVenue.city}, ${nextVenue.stateCode}`,
          });
        }
      }
    }, [consumeCityResult, consumeVenueResult, clearVenueOnCityChange]),
  );

  const openCityPicker = useCallback(() => {
    router.push("/location/city-picker");
  }, [router]);

  const openVenuePicker = useCallback(() => {
    const current = cityRef.current;
    if (!current) return;
    router.push({
      pathname: "/location/venue-picker",
      params: {
        cityId: current._id,
        cityLabel: current.label || `${current.name}, ${current.stateCode}`,
      },
    });
  }, [router]);

  const clearCity = useCallback(() => {
    setCity(null);
    if (clearVenueOnCityChange) setVenue(null);
  }, [clearVenueOnCityChange]);

  const clearVenue = useCallback(() => {
    setVenue(null);
  }, []);

  return {
    city,
    venue,
    setCity,
    setVenue,
    clearCity,
    clearVenue,
    openCityPicker,
    openVenuePicker,
    cityLabel: city ? city.label || `${city.name}, ${city.stateCode}` : null,
    venueLabel: venue?.name ?? null,
    venueSubtitle: venue
      ? [
          venue.tableCount ? `${venue.tableCount} tables` : null,
          venue.isOfficial ? "Official venue" : null,
        ]
          .filter(Boolean)
          .join(" · ") || null
      : null,
  };
}
