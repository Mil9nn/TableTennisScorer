import { LEGAL_URLS } from "@/lib/legalUrls";
import { useThemeColors } from "@/hooks/useThemeColors";
import * as WebBrowser from "expo-web-browser";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type AuthLegalFooterProps = {
  /** When true, shows signup consent copy above the links. */
  showSignupConsent?: boolean;
};

async function openLegalUrl(url: string) {
  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
  });
}

export function AuthLegalFooter({ showSignupConsent = false }: AuthLegalFooterProps) {
  const theme = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginTop: theme.spacing[8],
          alignItems: "center",
          gap: theme.spacing[4],
        },
        consent: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
          textAlign: "center",
          lineHeight: 20,
          paddingHorizontal: theme.spacing[2],
        },
        linksRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[2],
        },
        link: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.primary[500],
          fontWeight: theme.typography.fontWeight.semibold,
        },
        dot: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.wrap}>
      {showSignupConsent ? (
        <Text style={styles.consent}>
          By creating an account, you agree to our{" "}
          <Text style={styles.link} onPress={() => openLegalUrl(LEGAL_URLS.termsOfService)}>
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text style={styles.link} onPress={() => openLegalUrl(LEGAL_URLS.privacyPolicy)}>
            Privacy Policy
          </Text>
          .
        </Text>
      ) : null}
      <View style={styles.linksRow}>
        <TouchableOpacity
          onPress={() => openLegalUrl(LEGAL_URLS.termsOfService)}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Text style={styles.link}>Terms of Service</Text>
        </TouchableOpacity>
        <Text style={styles.dot}>·</Text>
        <TouchableOpacity
          onPress={() => openLegalUrl(LEGAL_URLS.privacyPolicy)}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Text style={styles.link}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
