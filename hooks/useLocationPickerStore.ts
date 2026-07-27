import { create } from "zustand";
import type { PickedCity, PickedVenue } from "@/lib/location/types";

type LocationPickerStore = {
  cityResult: PickedCity | null;
  venueResult: PickedVenue | null;
  setCityResult: (city: PickedCity) => void;
  setVenueResult: (venue: PickedVenue) => void;
  consumeCityResult: () => PickedCity | null;
  consumeVenueResult: () => PickedVenue | null;
  clear: () => void;
};

export const useLocationPickerStore = create<LocationPickerStore>((set, get) => ({
  cityResult: null,
  venueResult: null,
  setCityResult: (city) => set({ cityResult: city }),
  setVenueResult: (venue) => set({ venueResult: venue }),
  consumeCityResult: () => {
    const city = get().cityResult;
    if (city) set({ cityResult: null });
    return city;
  },
  consumeVenueResult: () => {
    const venue = get().venueResult;
    if (venue) set({ venueResult: null });
    return venue;
  },
  clear: () => set({ cityResult: null, venueResult: null }),
}));
