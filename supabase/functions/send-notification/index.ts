import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type NotificationType =
  | "direct_message"
  | "circle_invite"
  | "like"
  | "comment"
  | "follow_request";

type RequestBody = {
  recipientId?: string;
  type?: NotificationType;
  data?: Record<string, unknown>;
};

const preferenceKey: Record<NotificationType, string> = {
  direct_message: "directMessages",
  circle_invite: "circleInvites",
  like: "likes",
  comment: "comments",
  follow_request: "followRequests",
};

const titles: Record<NotificationType, string> = {
  direct_message: "New message",
  circle_invite: "Circle invitation",
  like: "New like",
  comment: "New comment",
  follow_request: "Follow request",
};

const defaultBodies: Record<NotificationType, string> = {
  direct_message: "You received a new direct message.",
  circle_invite: "Someone invited you to a Circle.",
  like: "Someone liked your post.",
  comment: "Someone commented on your post.",
  follow_request: "Someone requested to follow you.",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function getSecretKey() {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");

  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys);
      if (parsed.default) return parsed.default;
    } catch {
      console.error("Failed to parse SUPABASE_SECRET_KEYS.");
    }
  }

  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

async function validateEvent(
  admin: ReturnType<typeof createClient>,
  callerId: string,
  body: Required<RequestBody>,
) {
  const data = body.data ?? {};

  switch (body.type) {
    case "direct_message": {
      const messageId = data.messageId;
      if (typeof messageId !== "string") return false;

      const { data: message } = await admin
        .from("direct_messages")
        .select("id, sender_id, receiver_id")
        .eq("id", messageId)
        .maybeSingle();

      return (
        message?.sender_id === callerId &&
        message?.receiver_id === body.recipientId
      );
    }

    case "circle_invite": {
      const invitationId = data.invitationId;
      if (typeof invitationId !== "string") return false;

      const { data: invitation } = await admin
        .from("circle_invitations")
        .select("id, inviter_id, invitee_id, status")
        .eq("id", invitationId)
        .maybeSingle();

      return (
        invitation?.inviter_id === callerId &&
        invitation?.invitee_id === body.recipientId &&
        invitation?.status === "pending"
      );
    }

    case "like": {
      const postId = data.postId;
      if (typeof postId !== "string") return false;

      const { data: like } = await admin
        .from("post_likes")
        .select("post_id, user_id")
        .eq("post_id", postId)
        .eq("user_id", callerId)
        .maybeSingle();

      if (!like) return false;

      const { data: post } = await admin
        .from("posts")
        .select("user_id")
        .eq("id", postId)
        .maybeSingle();

      return post?.user_id === body.recipientId;
    }

    case "comment": {
      const commentId = data.commentId;
      if (typeof commentId !== "string") return false;

      const { data: comment } = await admin
        .from("comments")
        .select("id, user_id, post_id")
        .eq("id", commentId)
        .maybeSingle();

      if (!comment || comment.user_id !== callerId) return false;

      const { data: post } = await admin
        .from("posts")
        .select("user_id")
        .eq("id", comment.post_id)
        .maybeSingle();

      return post?.user_id === body.recipientId;
    }

    case "follow_request": {
      const followId = data.followId;
      if (typeof followId !== "string") return false;

      const { data: follow } = await admin
        .from("follows")
        .select("id, follower_id, following_id, status")
        .eq("id", followId)
        .maybeSingle();

      return (
        follow?.follower_id === callerId &&
        follow?.following_id === body.recipientId &&
        follow?.status === "pending"
      );
    }

    default:
      return false;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authorization = req.headers.get("Authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!accessToken) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKey = getSecretKey();

  if (!supabaseUrl || !secretKey) {
    return json({ error: "Server configuration error" }, 500);
  }

  const admin = createClient(supabaseUrl, secretKey);

  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(accessToken);

  if (authError || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: RequestBody;

  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (
    !body.recipientId ||
    !body.type ||
    !Object.prototype.hasOwnProperty.call(preferenceKey, body.type)
  ) {
    return json({ error: "Invalid notification request" }, 400);
  }

  if (!(await validateEvent(admin, user.id, body as Required<RequestBody>))) {
    return json({ error: "Notification event could not be validated" }, 403);
  }

  const { data: tokenRows, error: tokenError } = await admin
    .from("push_tokens")
    .select("token, preferences")
    .eq("user_id", body.recipientId);

  if (tokenError) {
    console.error("Failed to load push tokens:", tokenError);
    return json({ error: "Could not load notification targets" }, 500);
  }

  const key = preferenceKey[body.type];
  const tokens = (tokenRows ?? [])
    .filter((row) => {
      const preferences =
        row.preferences && typeof row.preferences === "object"
          ? (row.preferences as Record<string, unknown>)
          : {};

      return preferences.pushEnabled !== false && preferences[key] !== false;
    })
    .map((row) => row.token)
    .filter((token): token is string => typeof token === "string");

  if (tokens.length === 0) {
    return json({ sent: 0 });
  }

  const expoMessages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title: titles[body.type],
    body: defaultBodies[body.type],
    data: {
      type: body.type,
      ...(body.data ?? {}),
    },
  }));

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(expoMessages),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Expo push request failed:", errorText);
    return json({ error: "Push delivery failed" }, 502);
  }

  const result = (await response.json()) as {
    data?: Array<{
      status?: string;
      details?: {
        error?: string;
      };
    }>;
  };

  const invalidTokens = tokens.filter(
    (_, index) =>
      result.data?.[index]?.details?.error === "DeviceNotRegistered",
  );

  if (invalidTokens.length > 0) {
    await admin.from("push_tokens").delete().in("token", invalidTokens);
  }

  return json({
    sent: tokens.length - invalidTokens.length,
  });
});
