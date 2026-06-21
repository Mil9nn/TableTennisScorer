import { PlayerData } from "@/types/leaderboard";

/**
 * Get display name from player object
 * Prefers fullName, falls back to username
 */
export function getDisplayName(player: PlayerData | { username?: string; fullName?: string }): string {
  if (!player) return "Unknown";
  return player.fullName?.trim() || player.username?.trim() || "Unknown";
}

/**
 * Get initials from a name string
 * "John Doe" → "JD"
 * "John" → "JO"
 */
export function getInitials(name: string): string {
  if (!name) return "?";
  
  const trimmed = name.trim();
  const parts = trimmed.split(" ");
  
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  
  return trimmed.substring(0, 2).toUpperCase();
}

/**
 * Get consistent avatar background color based on user ID
 * Returns object with backgroundColor and text color
 */
export function getAvatarFallbackStyle(userId: string) {
  const colors = [
    { bg: "#e0f2fe", text: "#0369a1" }, // light blue
    { bg: "#fef3c7", text: "#92400e" }, // light amber
    { bg: "#dbeafe", text: "#1e40af" }, // blue
    { bg: "#f3e8ff", text: "#581c87" }, // purple
    { bg: "#f0fdf4", text: "#15803d" }, // green
    { bg: "#fee2e2", text: "#991b1b" }, // red
    { bg: "#fce7f3", text: "#be185d" }, // pink
    { bg: "#ecfdf5", text: "#065f46" }, // teal
  ];

  if (!userId) {
    return { backgroundColor: colors[0].bg, color: colors[0].text };
  }

  // Generate hash from userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colorIndex = Math.abs(hash) % colors.length;
  const color = colors[colorIndex];

  return {
    backgroundColor: color.bg,
    color: color.text,
  };
}

/**
 * Format win rate percentage
 * 75.5 → "75.5%"
 */
export function formatWinRate(winRate: number): string {
  if (!winRate && winRate !== 0) return "0%";
  return `${winRate.toFixed(1)}%`;
}

/**
 * Format differential value with sign
 * 5 → "+5"
 * -3 → "-3"
 * 0 → "0"
 */
export function formatDifferential(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

/**
 * Get color for differential value
 * Positive → Green, Negative → Red, Zero → Gray
 */
export function getDifferentialColor(value: number): string {
  if (value > 0) return "#22c55e"; // emerald-500
  if (value < 0) return "#f43f5e"; // rose-500
  return "#6b7280"; // gray-500
}

/**
 * Get color for win rate value
 * High WR → Green, Low WR → Red, Medium → Blue
 */
export function getWinRateColor(winRate: number): string {
  if (winRate >= 60) return "#22c55e"; // emerald-500 (green)
  if (winRate >= 45) return "#3b82f6"; // blue-500
  return "#f43f5e"; // rose-500 (red)
}

/**
 * Get accent color for streak
 * Positive → Green, Negative → Red
 */
export function getStreakColor(streak: number): string {
  if (streak > 0) return "#22c55e"; // emerald-500
  if (streak < 0) return "#f43f5e"; // rose-500
  return "#6b7280"; // gray-500
}

/**
 * Get streak label
 * 5 → "+5 Wins"
 * -3 → "3 Loss Streak"
 */
export function getStreakLabel(streak: number): string {
  if (streak > 0) return `${streak} Win${streak > 1 ? "s" : ""}`;
  if (streak < 0) return `${Math.abs(streak)} Loss${Math.abs(streak) > 1 ? "es" : ""}`;
  return "No Streak";
}

/**
 * Determine styling for a player row based on rank
 */
export function getRowStyling(rank: number, isCurrentUser: boolean) {
  const isRank1 = rank === 1;
  const isRank2or3 = rank === 2 || rank === 3;

  return {
    backgroundColor: isCurrentUser
      ? "rgba(79, 70, 229, 0.05)" // indigo with alpha
      : isRank1
      ? "rgba(79, 70, 229, 0.03)"
      : "#ffffff",
    borderLeftColor: isRank1 || isCurrentUser
      ? "#4f46e5" // indigo
      : isRank2or3
      ? "#d9d9d9" // gray
      : "transparent",
    borderLeftWidth: 4,
  };
}

/**
 * Get avatar border styling for top 3 players
 */
export function getAvatarBorder(rank: number) {
  if (rank === 1) {
    return {
      borderWidth: 2.5,
      borderColor: "#4f46e5", // indigo
      borderStyle: "solid" as const,
    };
  }
  if (rank <= 3) {
    return {
      borderWidth: 1.5,
      borderColor: "#d9d9d9", // gray
      borderStyle: "solid" as const,
    };
  }
  return {};
}

/**
 * Get medal icon emoji based on rank
 */
export function getRankEmoji(rank: number): string {
  switch (rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return "";
  }
}

/**
 * Format large numbers with K/M notation
 * 1500 → "1.5K"
 * 1000000 → "1M"
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return `${num}`;
}

/**
 * Determine if rank is in top 3
 */
export function isTopThree(rank: number): boolean {
  return rank <= 3;
}

/**
 * Determine if current user is in top 3
 * If not, show in separate section above top 3
 */
export function shouldShowInSeparateSection(rank: number): boolean {
  return rank > 3;
}
