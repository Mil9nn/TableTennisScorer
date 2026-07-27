import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Share,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useThemeColors } from "@/hooks/useThemeColors";
import { axiosInstance } from "@/lib/axiosInstance";
import { timeAgo } from "@/lib/utils";
import type { FeedComment, SocialFeedPost } from "@/hooks/useHomeFeed";

type FeedPostCardProps = {
  post: SocialFeedPost;
  onAppreciate: (postId: string) => Promise<void>;
  onComment: (postId: string, text: string) => Promise<unknown>;
  onShare: (postId: string) => Promise<void>;
};

function Avatar({
  name,
  image,
  isApp,
  size,
}: {
  name: string;
  image?: string;
  isApp?: boolean;
  size: number;
}) {
  const theme = useThemeColors();
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (image) {
    return (
      <Image
        source={{ uri: image }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.background.secondary,
        }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: isApp ? theme.colors.primary[600] : theme.colors.primary[100],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: size * 0.38,
          fontWeight: theme.typography.fontWeight.bold,
          color: isApp ? theme.colors.text.inverse : theme.colors.primary[700],
        }}
      >
        {isApp ? "T" : initial}
      </Text>
    </View>
  );
}

export function FeedPostCard({
  post,
  onAppreciate,
  onComment,
  onShare,
}: FeedPostCardProps) {
  const theme = useThemeColors();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [appreciating, setAppreciating] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>(post.previewComments);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    setComments(post.previewComments);
  }, [post.id, post.previewComments]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: theme.colors.background.primary,
          borderRadius: theme.borderRadius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
          paddingHorizontal: theme.spacing[4],
          paddingTop: theme.spacing[4],
          paddingBottom: theme.spacing[3],
          gap: theme.spacing[3],
          ...theme.shadows.sm,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
        },
        headerText: { flex: 1, minWidth: 0 },
        nameRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        },
        name: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
        },
        appBadge: {
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: theme.borderRadius.full,
          backgroundColor: theme.colors.primary[50],
        },
        appBadgeText: {
          fontSize: 10,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary[700],
          textTransform: "uppercase",
          letterSpacing: 0.4,
        },
        meta: {
          marginTop: 2,
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
        },
        body: {
          fontSize: theme.typography.fontSize.base,
          lineHeight: 22,
          color: theme.colors.text.primary,
        },
        image: {
          width: "100%",
          height: 180,
          borderRadius: theme.borderRadius.md,
          backgroundColor: theme.colors.background.secondary,
        },
        actions: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.border.light,
          marginHorizontal: -theme.spacing[4],
          paddingHorizontal: theme.spacing[1],
          paddingTop: theme.spacing[2],
          paddingBottom: theme.spacing[1],
        },
        actionBtn: {
          flex: 1,
          minHeight: 48,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: theme.spacing[2],
          paddingHorizontal: theme.spacing[1],
          borderRadius: theme.borderRadius.md,
        },
        actionInner: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        },
        actionDivider: {
          width: StyleSheet.hairlineWidth,
          height: 24,
          backgroundColor: theme.colors.border.light,
        },
        actionLabel: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.secondary,
          flexShrink: 1,
        },
        actionLabelActive: {
          color: theme.colors.primary[700],
        },
        commentsBlock: {
          gap: theme.spacing[3],
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.border.light,
          paddingTop: theme.spacing[3],
        },
        commentRow: {
          flexDirection: "row",
          gap: theme.spacing[2],
        },
        commentBubble: {
          flex: 1,
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.md,
          paddingHorizontal: theme.spacing[3],
          paddingVertical: theme.spacing[2],
          gap: 2,
        },
        commentAuthor: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
        },
        commentText: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          lineHeight: 18,
        },
        commentTime: {
          fontSize: 10,
          color: theme.colors.text.tertiary,
          marginTop: 2,
        },
        composerRow: {
          flexDirection: "row",
          alignItems: "flex-end",
          gap: theme.spacing[2],
        },
        input: {
          flex: 1,
          minHeight: 40,
          maxHeight: 96,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.md,
          paddingHorizontal: theme.spacing[3],
          paddingVertical: theme.spacing[2],
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.primary,
        },
        sendBtn: {
          width: 44,
          height: 44,
          borderRadius: theme.borderRadius.full,
          backgroundColor: theme.colors.primary[600],
          alignItems: "center",
          justifyContent: "center",
        },
        sendBtnDisabled: {
          opacity: 0.45,
        },
      }),
    [theme],
  );

  const handleAppreciate = async () => {
    if (appreciating) return;
    setAppreciating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await onAppreciate(post.id);
    } catch {
      Toast.show({ type: "error", text1: "Could not appreciate post" });
    } finally {
      setAppreciating(false);
    }
  };

  const handleToggleComments = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (!next) return;
    setLoadingComments(true);
    try {
      const res = await axiosInstance.get(`/feed/${post.id}/comments`);
      const nextComments: FeedComment[] = res.data?.comments ?? post.previewComments;
      setComments(nextComments);
    } catch {
      setComments(post.previewComments);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const authorLabel = post.author.isApp ? "TTPro" : post.author.name;
    try {
      const result = await Share.share({
        message: `${authorLabel} on TTPro:\n\n${post.body}`,
        title: "Share TTPro post",
      });
      if (result.action === Share.sharedAction) {
        await onShare(post.id);
      }
    } catch {
      Toast.show({ type: "error", text1: "Could not share post" });
    }
  };

  const handleSubmitComment = async () => {
    if (!draft.trim() || submitting) return;
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const updated = (await onComment(post.id, draft)) as SocialFeedPost | null;
      setDraft("");
      setCommentsOpen(true);
      if (updated?.previewComments) {
        setComments(updated.previewComments);
      }
      // Refresh full thread after posting
      try {
        const res = await axiosInstance.get(`/feed/${post.id}/comments`);
        setComments(res.data?.comments ?? updated?.previewComments ?? []);
      } catch {
        // keep preview comments
      }
    } catch {
      Toast.show({ type: "error", text1: "Could not post comment" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar
          name={post.author.name}
          image={post.author.profileImage}
          isApp={post.author.isApp}
          size={40}
        />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {post.author.name}
            </Text>
            {post.author.isApp ? (
              <View style={styles.appBadge}>
                <Text style={styles.appBadgeText}>Official</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.meta}>
            {post.author.username ? `@${post.author.username} · ` : ""}
            {timeAgo(post.createdAt)}
          </Text>
        </View>
      </View>

      <Text style={styles.body}>{post.body}</Text>

      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.image} contentFit="cover" />
      ) : null}

      <View style={styles.actions}>
        <Pressable
          onPress={handleAppreciate}
          style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={post.likedByViewer ? "Unlike post" : "Like post"}
        >
          <View style={styles.actionInner}>
            <Feather
              name="heart"
              size={18}
              color={post.likedByViewer ? theme.colors.primary[600] : theme.colors.text.secondary}
            />
            <Text
              style={[
                styles.actionLabel,
                post.likedByViewer && styles.actionLabelActive,
              ]}
              numberOfLines={1}
            >
              {post.likeCount > 0 ? `${post.likeCount} ` : ""}Like
            </Text>
          </View>
        </Pressable>

        <View style={styles.actionDivider} />

        <Pressable
          onPress={handleToggleComments}
          style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Comment on post"
        >
          <View style={styles.actionInner}>
            <Feather name="message-circle" size={18} color={theme.colors.text.secondary} />
            <Text style={styles.actionLabel} numberOfLines={1}>
              {post.commentCount > 0 ? `${post.commentCount} ` : ""}Comment
            </Text>
          </View>
        </Pressable>

        <View style={styles.actionDivider} />

        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Share post"
        >
          <View style={styles.actionInner}>
            <Feather name="share-2" size={18} color={theme.colors.text.secondary} />
            <Text style={styles.actionLabel} numberOfLines={1}>
              {post.shareCount > 0 ? `${post.shareCount} ` : ""}Share
            </Text>
          </View>
        </Pressable>
      </View>

      {commentsOpen ? (
        <View style={styles.commentsBlock}>
          {loadingComments ? (
            <ActivityIndicator color={theme.colors.primary[600]} />
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentRow}>
                <Avatar
                  name={comment.author.name}
                  image={comment.author.profileImage}
                  size={28}
                />
                <View style={styles.commentBubble}>
                  <Text style={styles.commentAuthor}>{comment.author.name}</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
                </View>
              </View>
            ))
          )}

          {!loadingComments && comments.length === 0 ? (
            <Text style={styles.commentTime}>Be the first to comment</Text>
          ) : null}

          <View style={styles.composerRow}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Write a comment…"
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
              maxLength={500}
              editable={!submitting}
            />
            <Pressable
              onPress={handleSubmitComment}
              disabled={!draft.trim() || submitting}
              style={[
                styles.sendBtn,
                (!draft.trim() || submitting) && styles.sendBtnDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Send comment"
            >
              {submitting ? (
                <ActivityIndicator color={theme.colors.text.inverse} size="small" />
              ) : (
                <Feather name="send" size={16} color={theme.colors.text.inverse} />
              )}
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}