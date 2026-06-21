import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Text } from "react-native-paper";
import { axiosInstance } from "@/lib/axiosInstance";
import Toast from "react-native-toast-message";
import { JoinCodeDisplay } from "@/components/tournaments/join-share/JoinCodeDisplay";
import { JoinEnableToggle } from "@/components/tournaments/join-share/JoinEnableToggle";
import { TeamJoinQrCodePanel } from "./TeamJoinQrCodePanel";
import { TeamJoinShareActions } from "./TeamJoinShareActions";

interface TeamInviteDialogProps {
  visible: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  joinCode?: string;
  allowJoinByCode: boolean;
  onUpdate: (joinCode: string, allowJoinByCode: boolean) => void;
}

export function TeamInviteDialog({
  visible,
  onClose,
  teamId,
  teamName,
  joinCode,
  allowJoinByCode,
  onUpdate,
}: TeamInviteDialogProps) {
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
        `/teams/${teamId}/toggle-join-code`,
        { enable: newEnabled },
      );

      setEnabled(data.allowJoinByCode);
      onUpdate(data.joinCode ?? joinCode ?? "", data.allowJoinByCode);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: data.message || "Invite settings updated",
      });
    } catch (err: unknown) {
      console.error("Error toggling team invite:", err);
      const message =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object"
          ? String(
              (err.response.data as { message?: string; error?: string }).message ||
                (err.response.data as { error?: string }).error ||
                "Failed to update invite settings",
            )
          : "Failed to update invite settings";
      Toast.show({
        type: "error",
        text1: "Error",
        text2: message,
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
              Share a link or QR code so players can join your team. They can also enter the
              6-character code manually.
            </Text>

            <JoinEnableToggle enabled={enabled} loading={loading} onToggle={handleToggle} />

            {activeCode ? (
              <View style={styles.inviteBody}>
                <TeamJoinQrCodePanel joinCode={joinCode} />
                <JoinCodeDisplay joinCode={joinCode} />
                <TeamJoinShareActions teamName={teamName} joinCode={joinCode} />
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
