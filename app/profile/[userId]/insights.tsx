import { profilePath } from "@/lib/profile/navigation";
import { Redirect, useLocalSearchParams } from "expo-router";

/** Legacy route — Insights content lives in Stats (Overall + Trends). */
export default function ProfileInsightsRedirect() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  return <Redirect href={profilePath(String(userId ?? ""), "stats")} />;
}
