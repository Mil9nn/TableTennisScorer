import { Redirect } from "expo-router";

export default function LeaderboardsRedirect() {
  return (
    <Redirect href={{ pathname: "/(tabs)", params: { tab: "leaderboards" } }} />
  );
}
