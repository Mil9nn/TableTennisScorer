import { Ionicons } from "@expo/vector-icons";
import { formatDate } from "@/lib/utils";
import { isIndividualMatch, Match } from "@/types/match.type";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  match: Match;
}

export default function MatchInfo({ match }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Match Information</Text>
      {isIndividualMatch(match) ? (
        <IndividualMatchInfo match={match} />
      ) : (
        <TeamMatchInfo match={match} />
      )}
    </View>
  );
}

function InfoItem({
  icon,
  label,
  value,
  iconColor = "#6b7280",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  iconColor?: string;
}) {
  return (
    <View style={styles.infoItem}>
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function IndividualMatchInfo({ match }: { match: any }) {
  return (
    <View style={styles.infoGrid}>
      <InfoItem
        icon="calendar-outline"
        label="Date"
        value={formatDate(match.createdAt)}
        iconColor="#3b82f6"
      />
      <InfoItem
        icon="location-outline"
        label="Location"
        value={match.city || "Not specified"}
        iconColor="#ef4444"
      />
      <InfoItem
        icon="list-outline"
        label="Format"
        value={`Best of ${match.numberOfSets}`}
        iconColor="#8b5cf6"
      />
    </View>
  );
}

function TeamMatchInfo({ match }: { match: any }) {
  return (
    <View style={styles.infoGrid}>
      <InfoItem
        icon="calendar-outline"
        label="Date"
        value={formatDate(match.createdAt)}
        iconColor="#3b82f6"
      />
      <InfoItem
        icon="location-outline"
        label="Location"
        value={match.city || "Not specified"}
        iconColor="#ef4444"
      />
      <InfoItem
        icon="settings-outline"
        label="Match Format"
        value={match.matchFormat.replace(/_/g, " ")}
        iconColor="#f59e0b"
      />
      <InfoItem
        icon="list-outline"
        label="Sets per Match"
        value={`Best of ${match.numberOfSetsPerSubMatch}`}
        iconColor="#8b5cf6"
      />
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
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
});

