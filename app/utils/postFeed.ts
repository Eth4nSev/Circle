import { supabase } from "./supabase";

export type FeedPost = {
  id: string;
  user_id: string;
  image: string | null;
  caption: string | null;
  created_at: string;
  circle_id: string | null;
  allow_comments: boolean;
  allow_sharing: boolean;
  allow_reactions: boolean;
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  like_count: number;
  is_liked: boolean;
};

export type PostFeedMode =
  | {
      type: "home";
      followedUserIds: string[];
      memberCircleIds: string[];
    }
  | {
      type: "following";
      userIds: string[];
    }
  | {
      type: "circles";
      circleIds: string[];
    }
  | {
      type: "circle";
      circleId: string;
    }
  | {
      type: "user";
      userId: string;
    };

type FetchPostPageOptions = {
  mode: PostFeedMode;
  currentUserId: string;
  page?: number;
  pageSize?: number;
};

export async function fetchPostPage({
  mode,
  currentUserId,
  page = 0,
  pageSize = 20,
}: FetchPostPageOptions) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("posts")
    .select(
      `
        id,
        user_id,
        image,
        caption,
        created_at,
        circle_id,
        allow_comments,
        allow_sharing,
        allow_reactions,
        profiles!posts_user_id_fkey (
          username,
          display_name,
          avatar_url
        )
      `,
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (mode.type === "home") {
    const filters: string[] = [];

    if (mode.followedUserIds.length > 0) {
      filters.push(`user_id.in.(${mode.followedUserIds.join(",")})`);
    }

    if (mode.memberCircleIds.length > 0) {
      filters.push(`circle_id.in.(${mode.memberCircleIds.join(",")})`);
    }

    if (filters.length === 0) {
      return {
        posts: [] as FeedPost[],
        hasMore: false,
      };
    }

    query = query.or(filters.join(","));
  }

  if (mode.type === "following") {
    if (mode.userIds.length === 0) {
      return {
        posts: [] as FeedPost[],
        hasMore: false,
      };
    }

    query = query.in("user_id", mode.userIds);
  }

  if (mode.type === "circles") {
    if (mode.circleIds.length === 0) {
      return {
        posts: [] as FeedPost[],
        hasMore: false,
      };
    }

    query = query.in("circle_id", mode.circleIds);
  }

  if (mode.type === "circle") {
    query = query.eq("circle_id", mode.circleId);
  }

  if (mode.type === "user") {
    query = query.eq("user_id", mode.userId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const posts = (data ?? []) as Omit<
    FeedPost,
    "like_count" | "is_liked"
  >[];

  if (posts.length === 0) {
    return {
      posts: [] as FeedPost[],
      hasMore: false,
    };
  }

  const postIds = posts.map((post) => post.id);

  const [{ data: likeCounts, error: likeCountError }, { data: likedRows, error: likedError }] =
    await Promise.all([
      supabase
        .from("post_like_counts")
        .select("post_id, like_count")
        .in("post_id", postIds),
      supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", currentUserId)
        .in("post_id", postIds),
    ]);

  if (likeCountError) {
    throw likeCountError;
  }

  if (likedError) {
    throw likedError;
  }

  const countMap = new Map(
    (likeCounts ?? []).map((row) => [
      row.post_id as string,
      Number(row.like_count),
    ]),
  );

  const likedSet = new Set(
    (likedRows ?? []).map((row) => row.post_id as string),
  );

  return {
    posts: posts.map((post) => ({
      ...post,
      like_count: countMap.get(post.id) ?? 0,
      is_liked: likedSet.has(post.id),
    })),
    hasMore: posts.length === pageSize,
  } as { posts: FeedPost[]; hasMore: boolean };
}
