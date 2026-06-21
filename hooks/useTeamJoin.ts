import { useCallback, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { isValidJoinCode, normalizeJoinCode } from "@/lib/teams/joinLinks";

export interface TeamJoinResult {
  team: { _id: string; name?: string };
  message?: string;
}

export function useTeamJoin() {
  const [loading, setLoading] = useState(false);

  const joinWithCode = useCallback(async (rawCode: string): Promise<TeamJoinResult> => {
    const joinCode = normalizeJoinCode(rawCode);

    if (!isValidJoinCode(joinCode)) {
      throw new Error("Join code must be 6 letters or numbers");
    }

    setLoading(true);
    try {
      const { data } = await axiosInstance.post<TeamJoinResult & { message?: string }>(
        "/teams/join",
        { joinCode },
      );
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  return { joinWithCode, loading };
}
