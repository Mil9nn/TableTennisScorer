import { useCallback, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { isValidJoinCode, normalizeJoinCode } from "@/lib/tournaments/joinLinks";

export interface TournamentJoinResult {
  tournament: { _id: string; name?: string };
  message?: string;
}

export function useTournamentJoin() {
  const [loading, setLoading] = useState(false);

  const joinWithCode = useCallback(async (rawCode: string): Promise<TournamentJoinResult> => {
    const joinCode = normalizeJoinCode(rawCode);

    if (!isValidJoinCode(joinCode)) {
      throw new Error("Join code must be 6 letters or numbers");
    }

    setLoading(true);
    try {
      const { data } = await axiosInstance.post<TournamentJoinResult & { message?: string }>(
        "/tournaments/join",
        { joinCode },
      );
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  return { joinWithCode, loading };
}
