import React from "react";
import { Share, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import {
  buildShareJoinUrl,
  buildShareMessage,
  normalizeJoinCode,
} from "@/lib/teams/joinLinks";

interface TeamJoinShareActionsProps {
  teamName: string;
  joinCode: string;
}

export function TeamJoinShareActions({ teamName, joinCode }: TeamJoinShareActionsProps) {
  const normalized = normalizeJoinCode(joinCode);
  const joinLink = buildShareJoinUrl(normalized);

  const copyLink = async () => {
    await Clipboard.setStringAsync(joinLink);
    Toast.show({
      type: "success",
      text1: "Link copied",
      text2: "Invite link copied to clipboard",
    });
  };

  const copyCode = async () => {
    await Clipboard.setStringAsync(normalized);
    Toast.show({
      type: "success",
      text1: "Code copied",
      text2: "Join code copied to clipboard",
    });
  };

  const shareInvite = async () => {
    try {
      await Share.share({
        message: buildShareMessage({ teamName, joinCode: normalized }),
        title: `Join ${teamName}`,
        url: joinLink,
      });
    } catch (err) {
      console.error("Error sharing team invite:", err);
    }
  };

  return (
    <View style={styles.wrap}>
      <Button mode="contained" onPress={shareInvite} icon="share-variant" style={styles.primary}>
        Share invite link
      </Button>
      <View style={styles.row}>
        <Button mode="outlined" onPress={copyLink} icon="link-variant" style={styles.half}>
          Copy link
        </Button>
        <Button mode="outlined" onPress={copyCode} icon="content-copy" style={styles.half}>
          Copy code
        </Button>
      </View>
      <Text variant="bodySmall" style={styles.linkPreview} numberOfLines={2}>
        {joinLink}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  primary: {
    borderRadius: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  half: {
    flex: 1,
    borderRadius: 8,
  },
  linkPreview: {
    color: "#64748b",
    textAlign: "center",
  },
});
