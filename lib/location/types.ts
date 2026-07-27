export type PickedCity = {
  _id: string;
  name: string;
  state: string;
  stateCode: string;
  label: string;
};

export type PickedVenue = {
  _id: string;
  name: string;
  cityId: string;
  city: string;
  state: string;
  stateCode: string;
  address?: string;
  tableCount?: number;
  indoorOutdoor?: "indoor" | "outdoor" | "mixed";
  isOfficial?: boolean;
  label: string;
};
