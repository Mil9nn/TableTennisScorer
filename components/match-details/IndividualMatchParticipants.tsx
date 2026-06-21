import { Image } from "expo-image";
import { IndividualMatch } from "@/types/match.type";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  match: IndividualMatch;
}

export default function IndividualMatchParticipants({ match }: Props) {
  const isSingles = match.matchType === "singles";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Players</Text>
      {isSingles ? (
        <SinglesParticipants match={match} />
      ) : (
        <DoublesParticipants match={match} />
      )}
    </View>
  );
}

function SinglesParticipants({ match }: Props) {
  const players = match.participants?.slice(0, 2) || [];

  return (
    <View style={styles.singlesContainer}>
      <PlayerCard player={players[0]} align="left" />
      <View style={styles.vsBadge}>
        <Text style={styles.vsText}>VS</Text>
      </View>
      <PlayerCard player={players[1]} align="right" />
    </View>
  );
}

function DoublesParticipants({ match }: Props) {
  const teamA = match.participants?.slice(0, 2) || [];
  const teamB = match.participants?.slice(2, 4) || [];

  return (
    <View style={styles.doublesContainer}>
      <View style={styles.teamColumn}>
        {teamA.map((p: any, i: number) => (
          <PlayerCard key={i} player={p} align="left" />
        ))}
      </View>
      <View style={styles.vsBadge}>
        <Text style={styles.vsText}>VS</Text>
      </View>
      <View style={styles.teamColumn}>
        {teamB.map((p: any, i: number) => (
          <PlayerCard key={i} player={p} align="right" />
        ))}
      </View>
    </View>
  );
}

function PlayerCard({
  player,
  align = "left",
}: {
  player: any;
  align?: "left" | "right";
}) {
  const isRight = align === "right";

  return (
    <View style={[styles.playerCard, isRight && styles.playerCardRight]}>
      {player?.profileImage ? (
        <Image
          source={{ uri: player.profileImage }}
          style={styles.avatar}
          contentFit="cover"
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {(player?.fullName?.[0] || "?").toUpperCase()}
          </Text>
        </View>
      )}
      <Text
        style={[
          styles.playerName,
          isRight && styles.playerNameRight,
        ]}
        numberOfLines={1}
      >
        {player?.fullName || "Unnamed"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  singlesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  doublesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  teamColumn: {
    flex: 1,
    gap: 12,
  },
  vsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  vsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playerCardRight: {
    flexDirection: "row-reverse",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#d1d5db",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  playerName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
    flex: 1,
  },
  playerNameRight: {
    textAlign: "right",
  },
});

