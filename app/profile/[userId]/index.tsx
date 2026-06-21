import { ProfileHomeScreen } from "@/components/profile/ProfileHomeScreen";
import { useLocalSearchParams } from "expo-router";

export default function ProfileOverviewScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  return <ProfileHomeScreen userId={String(userId ?? "")} />;
}
