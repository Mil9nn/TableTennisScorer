import { Redirect } from "expo-router";

import { useAuthStore } from "@/hooks/useAuthStore";
import { profilePath } from "@/lib/profile/navigation";

/** Legacy tab route — profile now lives on the profile stack. */
export default function ProfileRedirect() {
  const userId = useAuthStore((s) => s.user?._id);
  if (!userId) {
    return <Redirect href={{ pathname: "/(tabs)", params: { tab: "home" } }} />;
  }
  return <Redirect href={profilePath(userId)} />;
}
