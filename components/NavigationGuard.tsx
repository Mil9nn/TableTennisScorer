import { router, useSegments } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "@/hooks/useAuthStore";

export default function NavigationGuard() {
  const authLoading = useAuthStore((state) => state.authLoading);
  const authResolved = useAuthStore((state) => state.authResolved);
  const user = useAuthStore((state) => state.user);
  const segments = useSegments();

  useEffect(() => {
    if (authLoading || !segments[0]) return;

    const inAuthGroup = segments[0] === "auth";
    const onJoinTournament =
      segments[0] === "tournaments" && segments[1] === "join";

    if (authResolved && !user && !inAuthGroup && !onJoinTournament) {
      router.replace("/auth/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, segments, authLoading, authResolved]);

  return null;
}
