import { Redirect } from "expo-router";

export default function MatchesRedirect() {
  return (
    <Redirect
      href={{ pathname: "/(tabs)", params: { tab: "my-tennis", section: "matches" } }}
    />
  );
}
