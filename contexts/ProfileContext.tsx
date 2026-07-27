import { fetchProfileUser } from "@/lib/profile/api";
import type { ProfileUserSummary } from "@/types/profile.type";
import { useAuthStore } from "@/hooks/useAuthStore";
import type { User } from "@/types/user.type";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ProfileDisplayUser = ProfileUserSummary & {
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
};

function mapAuthUser(me: User): ProfileDisplayUser {
  return {
    _id: me._id,
    username: me.username,
    fullName: me.fullName,
    email: me.email,
    profileImage: me.profileImage,
    createdAt: me.createdAt,
    dateOfBirth: me.dateOfBirth,
    gender: me.gender,
    handedness: me.handedness,
    phoneNumber: me.phoneNumber,
    location: me.location,
  };
}

interface ProfileContextValue {
  userId: string;
  user: ProfileDisplayUser | null;
  loading: boolean;
  error: string | null;
  isMe: boolean;
  refreshUser: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const me = useAuthStore((s) => s.user);
  const resolvedUserId = String(userId ?? "");
  const isMe = !!me?._id && me._id === resolvedUserId;

  const [user, setUser] = useState<ProfileDisplayUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    if (!resolvedUserId) return;
    setError(null);

    if (isMe && me) {
      setUser(mapAuthUser(me));
      return;
    }

    const res = await fetchProfileUser(resolvedUserId);
    if (!res || res.success !== true) {
      throw new Error(res?.message || res?.error || "Failed to load profile");
    }
    setUser(res.user);
  }, [resolvedUserId, isMe, me]);

  useEffect(() => {
    setLoading(true);
    refreshUser()
      .catch((e: unknown) => {
        const message =
          e instanceof Error ? e.message : "Failed to load profile";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      userId: resolvedUserId,
      user,
      loading,
      error,
      isMe,
      refreshUser,
    }),
    [resolvedUserId, user, loading, error, isMe, refreshUser],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return ctx;
}
