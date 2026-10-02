import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

export type NotificationType =
  | "direct_message"
  | "circle_invite"
  | "like"
  | "comment"
  | "follow_request";

export type NotificationPreferences = {
  pushEnabled: boolean;
  directMessages: boolean;
  circleInvites: boolean;
  likes: boolean;
  comments: boolean;
  followRequests: boolean;
};

export type LocalNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  receivedAt: string;
  read: boolean;
};

export type SendNotificationInput = {
  recipientId: string;
  type: NotificationType;
  data: Record<string, unknown>;
};

const NOTIFICATIONS_KEY = "@circle/notifications";
const NOTIFICATION_PREFERENCES_KEY = "@circle/notification-preferences";
const PUSH_TOKEN_KEY = "@circle/push-token";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  directMessages: true,
  circleInvites: true,
  likes: true,
  comments: true,
  followRequests: true,
};

const isNotificationType = (value: unknown): value is NotificationType =>
  value === "direct_message" ||
  value === "circle_invite" ||
  value === "like" ||
  value === "comment" ||
  value === "follow_request";

function pruneNotifications(items: LocalNotification[]) {
  const cutoff = Date.now() - THIRTY_DAYS_MS;

  return items
    .filter((item) => {
      const timestamp = new Date(item.receivedAt).getTime();
      return Number.isFinite(timestamp) && timestamp >= cutoff;
    })
    .sort(
      (a, b) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
    );
}

export async function loadNotifications() {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as LocalNotification[]) : [];
    const pruned = pruneNotifications(Array.isArray(parsed) ? parsed : []);

    if (pruned.length !== parsed.length) {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(pruned));
    }

    return pruned;
  } catch (error) {
    console.error("Failed to load notifications:", error);
    return [];
  }
}

export async function saveNotification(notification: LocalNotification) {
  try {
    const current = await loadNotifications();
    const next = pruneNotifications([
      notification,
      ...current.filter((item) => item.id !== notification.id),
    ]);

    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next));
    return next;
  } catch (error) {
    console.error("Failed to save notification:", error);
    return [];
  }
}

export async function markNotificationRead(id: string) {
  try {
    const current = await loadNotifications();
    const next = current.map((item) =>
      item.id === id ? { ...item, read: true } : item,
    );

    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next));
    return next;
  } catch (error) {
    console.error("Failed to mark notification read:", error);
    return [];
  }
}

export async function loadNotificationPreferences() {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;

    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;

    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...parsed,
    };
  } catch (error) {
    console.error("Failed to load notification preferences:", error);
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences,
) {
  await AsyncStorage.setItem(
    NOTIFICATION_PREFERENCES_KEY,
    JSON.stringify(preferences),
  );
}

function notificationToLocal(
  notification: Notifications.Notification,
): LocalNotification | null {
  const content = notification.request.content;
  const rawData = content.data;

  const type =
    rawData && typeof rawData === "object"
      ? (rawData as Record<string, unknown>).type
      : null;

  if (!isNotificationType(type)) {
    return null;
  }

  return {
    id: notification.request.identifier,
    type,
    title: content.title ?? "Circle",
    body: content.body ?? "",
    data: (rawData as Record<string, unknown>) ?? {},
    receivedAt: new Date().toISOString(),
    read: false,
  };
}

export async function saveIncomingNotification(
  notification: Notifications.Notification,
) {
  const local = notificationToLocal(notification);
  if (!local) return null;

  await saveNotification(local);
  return local;
}

export async function syncPresentedNotifications() {
  try {
    const presented = await Notifications.getPresentedNotificationsAsync();

    for (const notification of presented) {
      await saveIncomingNotification(notification);
    }
  } catch (error) {
    console.error("Failed to sync presented notifications:", error);
  }
}

async function getCachedPushToken() {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}

export async function syncPushNotifications(
  userId: string,
  preferences: NotificationPreferences,
) {
  try {
    let token = await getCachedPushToken();

    if (preferences.pushEnabled) {
      const permission = await Notifications.getPermissionsAsync();

      if (permission.status !== "granted") {
        const requested = await Notifications.requestPermissionsAsync();

        if (requested.status !== "granted") {
          return;
        }
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Circle",
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: "default",
        });
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.error("Expo project ID is unavailable.");
        return;
      }

      const expoToken = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      token = expoToken.data;
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    }

    if (!token) return;

    const { error } = await supabase.from("push_tokens").upsert(
      {
        token,
        user_id: userId,
        platform: Platform.OS,
        preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    );

    if (error) {
      console.error("Failed to sync push token:", error);
    }
  } catch (error) {
    console.error("Push notification setup failed:", error);
  }
}

export async function sendNotification(input: SendNotificationInput) {
  try {
    const { error } = await supabase.functions.invoke("send-notification", {
      body: input,
    });

    if (error) {
      console.error("Notification delivery failed:", error);
    }
  } catch (error) {
    console.error("Notification delivery failed:", error);
  }
}

export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
