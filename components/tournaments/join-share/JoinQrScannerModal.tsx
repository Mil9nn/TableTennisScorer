import React, { useCallback, useEffect, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Button, IconButton, Text } from "react-native-paper";
import { parseJoinCodeFromUrl } from "@/lib/tournaments/joinLinks";

interface JoinQrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onCodeScanned: (code: string) => void;
}

export function JoinQrScannerModal({
  visible,
  onClose,
  onCodeScanned,
}: JoinQrScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false);
    }
  }, [visible]);

  const handleBarcode = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) return;
      const code = parseJoinCodeFromUrl(data);
      if (!code) return;

      setScanned(true);
      onCodeScanned(code);
      onClose();
    },
    [onClose, onCodeScanned, scanned],
  );

  const handleDismiss = () => {
    setScanned(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleDismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            Scan invite QR
          </Text>
          <IconButton icon="close" onPress={handleDismiss} />
        </View>

        {!permission ? (
          <View style={styles.centered}>
            <Text>Checking camera permission…</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.centered}>
            <Text style={styles.permissionText}>
              Camera access is required to scan tournament invite QR codes.
            </Text>
            <Button mode="contained" onPress={requestPermission}>
              Allow camera
            </Button>
            <Button onPress={handleDismiss}>Cancel</Button>
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={scanned ? undefined : handleBarcode}
            />
            <Text variant="bodySmall" style={styles.overlayHint}>
              Align the QR code within the frame
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 48,
    paddingBottom: 8,
  },
  title: {
    color: "#fff",
    marginLeft: 8,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  permissionText: {
    textAlign: "center",
    color: "#e2e8f0",
  },
  cameraWrap: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
  overlayHint: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#fff",
  },
});
