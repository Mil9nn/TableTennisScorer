import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Text } from "react-native-paper";
import { axiosInstance } from "@/lib/axiosInstance";
import Toast from "react-native-toast-message";
import { JoinCodeDisplay } from "./JoinCodeDisplay";
import { JoinEnableToggle } from "./JoinEnableToggle";
import { JoinQrCodePanel } from "./JoinQrCodePanel";
import { JoinShareActions } from "./JoinShareActions";

interface TournamentInviteDialogProps {
  visible: boolean;
  onClose: () => void;
  tournamentId: string;
  tournamentName: string;
  joinCode?: string;
  allowJoinByCode: boolean;
  onUpdate: (joinCode: string, allowJoinByCode: boolean) => void;
}

export function TournamentInviteDialog({
  visible,
  onClose,
  tournamentId,
  tournamentName,
  joinCode,
  allowJoinByCode,
  onUpdate,
}: TournamentInviteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(allowJoinByCode);

  useEffect(() => {
    if (visible) {
      setEnabled(allowJoinByCode);
    }
  }, [visible, allowJoinByCode]);

  const handleToggle = async (newEnabled: boolean) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post(
        `/tournaments/${tournamentId}/toggle-join-code`,
        { enable: newEnabled },
      );

      setEnabled(data.allowJoinByCode);
      onUpdate(data.joinCode, data.allowJoinByCode);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: data.message || "Registration settings updated",
      });
    } catch (err: any) {
      console.error("Error toggling join registration:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.response?.data?.error || "Failed to update registration",
      });
      setEnabled(allowJoinByCode);
    } finally {
      setLoading(false);
    }
  };

  const activeCode = joinCode && enabled;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>Invite players</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text variant="bodySmall" style={styles.description}>
              Share a link or QR code so players can join instantly. They can also enter the
              6-character code manually.
            </Text>

            <JoinEnableToggle enabled={enabled} loading={loading} onToggle={handleToggle} />

            {activeCode ? (
              <View style={styles.inviteBody}>
                <JoinQrCodePanel joinCode={joinCode} />
                <JoinCodeDisplay joinCode={joinCode} />
                <JoinShareActions tournamentName={tournamentName} joinCode={joinCode} />
              </View>
            ) : (
              <Text variant="bodySmall" style={styles.emptyText}>
                Turn on open registration to generate your invite link, QR code, and join code.
              </Text>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onClose}>Done</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 12,
    backgroundColor: "#fff",
    maxHeight: "90%",
  },
  scrollArea: {
    paddingHorizontal: 0,
    maxHeight: 480,
  },
  content: {
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  description: {
    color: "#64748b",
  },
  inviteBody: {
    gap: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    paddingVertical: 12,
  },
});
