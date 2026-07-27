import { useCallback, useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";

export type FeedAuthor = {
  type: "user" | "app";
  id: string;
  name: string;
  username: string;
  profileImage?: string;
  isApp: boolean;
};

export type FeedComment = {
  id: string;
  text: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    profileImage?: string;
  };
};

export type SocialFeedPost = {
  id: string;
  body: string;
  imageUrl?: string;
  linkType?: string;
  linkId?: string;
  author: FeedAuthor;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByViewer: boolean;
  previewComments: FeedComment[];
  createdAt: string;
};

export function useHomeFeed(enabled: boolean) {
  const [posts, setPosts] = useState<SocialFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(
    async (options?: { silent?: boolean; skip?: number; append?: boolean }) => {
      if (!enabled) {
        setPosts([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setError(null);
      if (options?.silent) setRefreshing(true);
      else if (!options?.append) setLoading(true);

      try {
        const skip = options?.skip ?? 0;
        const res = await axiosInstance.get(`/feed?limit=20&skip=${skip}`);
        const nextPosts: SocialFeedPost[] = res.data?.posts ?? [];
        setPosts((prev) => (options?.append ? [...prev, ...nextPosts] : nextPosts));
        setHasMore(Boolean(res.data?.pagination?.hasMore));
      } catch {
        setError("Could not load the feed. Pull to retry.");
        if (!options?.append) setPosts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [enabled],
  );

  useEffect(() => {
    load();
  }, [load]);

  const toggleAppreciate = useCallback(async (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const liked = !post.likedByViewer;
        return {
          ...post,
          likedByViewer: liked,
          likeCount: Math.max(0, post.likeCount + (liked ? 1 : -1)),
        };
      }),
    );

    try {
      const res = await axiosInstance.post(`/feed/${postId}/like`);
      const updated: SocialFeedPost | undefined = res.data?.post;
      if (updated) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      }
    } catch {
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          const liked = !post.likedByViewer;
          return {
            ...post,
            likedByViewer: liked,
            likeCount: Math.max(0, post.likeCount + (liked ? 1 : -1)),
          };
        }),
      );
      throw new Error("appreciate_failed");
    }
  }, []);

  const addComment = useCallback(async (postId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const res = await axiosInstance.post(`/feed/${postId}/comments`, { text: trimmed });
    const updated: SocialFeedPost | undefined = res.data?.post;
    if (updated) {
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    }
    return updated ?? null;
  }, []);

  const recordShare = useCallback(async (postId: string) => {
    try {
      const res = await axiosInstance.post(`/feed/${postId}/share`);
      const updated: SocialFeedPost | undefined = res.data?.post;
      if (updated) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      }
    } catch {
      // Share sheet may still succeed; ignore count sync failures
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || refreshing) return;
    return load({ append: true, skip: posts.length, silent: true });
  }, [hasMore, loading, refreshing, load, posts.length]);

  return {
    posts,
    loading,
    refreshing,
    error,
    hasMore,
    reload: () => load(),
    refresh: () => load({ silent: true }),
    loadMore,
    toggleAppreciate,
    addComment,
    recordShare,
  };
}
