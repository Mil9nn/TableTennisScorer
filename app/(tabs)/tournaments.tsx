import { Redirect } from "expo-router";

export default function TournamentsRedirect() {
  return (
    <Redirect
      href={{
        pathname: "/(tabs)",
        params: { tab: "my-tennis", section: "tournaments" },
      }}
    />
  );
}
