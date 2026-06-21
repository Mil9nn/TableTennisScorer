import React, { Component, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, Typography, BorderRadius } from "@/constants/theme";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class TournamentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Tournament Error Boundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Card style={styles.card}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="alert-triangle" size={24} color="#ef4444" />
              </View>
              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.description}>
                We encountered an error while loading the tournament. Please try again.
              </Text>
            </View>

            <View style={styles.content}>
              {this.state.error && (
                <View style={styles.errorDetails}>
                  <Text style={styles.errorLabel}>Error details:</Text>
                  <Text style={styles.errorMessage}>{this.state.error.message}</Text>
                </View>
              )}

              <View style={styles.actions}>
                <Button
                  onPress={this.handleReset}
                  style={styles.tryAgainButton}
                  variant="primary"
                >
                  <Ionicons name="refresh" size={16} color="#fff" />
                  <Text style={styles.buttonText}>Try Again</Text>
                </Button>
                <Button
                  onPress={() => router.push("/(tabs)/tournaments" as any)}
                  style={styles.backButton}
                  variant="outline"
                >
                  <Ionicons name="home" size={16} color={Colors.light.text} />
                  <Text style={[styles.buttonText, { color: Colors.light.text }]}>
                    Back to Tournaments
                  </Text>
                </Button>
              </View>
            </View>
          </Card>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.base,
    backgroundColor: Colors.light.background,
  },
  card: {
    maxWidth: 400,
    width: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.base,
  },
  iconContainer: {
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.xl,
    fontWeight: Typography.weights.bold,
    color: "#ef4444",
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  description: {
    ...Typography.sm,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  content: {
    gap: Spacing.base,
  },
  errorDetails: {
    padding: Spacing.sm,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: BorderRadius.sm,
  },
  errorLabel: {
    ...Typography.sm,
    fontWeight: Typography.weights.medium,
    color: "#991b1b",
    marginBottom: Spacing.xs,
  },
  errorMessage: {
    ...Typography.xs,
    fontFamily: "monospace",
    color: "#991b1b",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  tryAgainButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  backButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  buttonText: {
    ...Typography.sm,
    fontWeight: Typography.weights.semibold,
    color: "#fff",
  },
});

