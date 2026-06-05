import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { SavedOpportunity } from "@/types/savedOpportunity";

const ALERT_NOTIFICATION_IDS_KEY = "ppo.alert.notification.ids";
const ALERT_NOTIFICATION_CHANNEL_ID = "ppo-alert-deadlines";

type AlertNotificationIds = Record<string, string>;
type NotificationPermissionStatus = {
  granted?: boolean;
  status?: string;
};

function canUseWebStorage() {
  return Platform.OS === "web" && typeof window !== "undefined" && !!window.localStorage;
}

function parseDateOnly(value: string | null) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day, 9, 0, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function getReminderDate(alertDate: string | null) {
  const date = parseDateOnly(alertDate);

  if (!date || date.getTime() <= Date.now()) {
    return null;
  }

  return date;
}

async function readNotificationIds(): Promise<AlertNotificationIds> {
  let rawValue: string | null = null;

  if (canUseWebStorage()) {
    rawValue = window.localStorage.getItem(ALERT_NOTIFICATION_IDS_KEY);
  } else if (await SecureStore.isAvailableAsync()) {
    rawValue = await SecureStore.getItemAsync(ALERT_NOTIFICATION_IDS_KEY);
  }

  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeNotificationIds(notificationIds: AlertNotificationIds) {
  const value = JSON.stringify(notificationIds);

  if (canUseWebStorage()) {
    window.localStorage.setItem(ALERT_NOTIFICATION_IDS_KEY, value);
    return;
  }

  if (!(await SecureStore.isAvailableAsync())) {
    return;
  }

  await SecureStore.setItemAsync(ALERT_NOTIFICATION_IDS_KEY, value);
}

async function ensureNotificationPermission() {
  if (Platform.OS === "web") {
    return false;
  }

  const currentPermissions = await Notifications.getPermissionsAsync() as NotificationPermissionStatus;

  if (currentPermissions.granted || currentPermissions.status === "granted") {
    return true;
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync() as NotificationPermissionStatus;
  return !!requestedPermissions.granted || requestedPermissions.status === "granted";
}

async function configureAndroidNotificationChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(ALERT_NOTIFICATION_CHANNEL_ID, {
    importance: Notifications.AndroidImportance.DEFAULT,
    name: "Prazos de editais",
  });
}

export async function cancelAlertNotification(contratacaoId: string) {
  const notificationIds = await readNotificationIds();
  const notificationId = notificationIds[contratacaoId];

  if (!notificationId) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(notificationId);
  delete notificationIds[contratacaoId];
  await writeNotificationIds(notificationIds);
}

export async function scheduleAlertNotification(item: SavedOpportunity) {
  await cancelAlertNotification(item.id);

  if (item.alertDone) {
    return;
  }

  const reminderDate = getReminderDate(item.alertDate);

  if (!reminderDate || !(await ensureNotificationPermission())) {
    return;
  }

  await configureAndroidNotificationChannel();

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Prazo de edital hoje",
      body: item.title,
      data: {
        contratacaoId: item.id,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
      channelId: ALERT_NOTIFICATION_CHANNEL_ID,
    },
  });

  const notificationIds = await readNotificationIds();
  notificationIds[item.id] = notificationId;
  await writeNotificationIds(notificationIds);
}
